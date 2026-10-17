<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['items.product.meeshoProduct', 'meeshoOrders.meeshoProduct', 'customer', 'store']);

        if ($request->has('store_id') && $request->store_id) {
            $query->where(function ($q) use ($request) {
                $q->where('store_id', $request->store_id)
                  ->orWhereNull('store_id');
            });
        }

        if ($request->has('status') && $request->status && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        $orders = $query->orderBy('id', 'desc')->get();

        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'store_id' => 'nullable',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email',
            'customer_phone' => 'nullable|string|max:50',
            'shipping_address' => 'nullable|string',
            'payment_method' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable',
            'items.*.product_name' => 'nullable|string',
            'items.*.price' => 'nullable|numeric',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($validated) {
            $subtotal = 0;
            $orderItemsData = [];

            // If store_id is not a number, set to null to avoid foreign key error
            $storeId = $validated['store_id'] ?? null;
            if ($storeId !== null && !is_numeric($storeId)) {
                $storeId = null;
            }

            foreach ($validated['items'] as $item) {
                $qty = (int)$item['quantity'];
                
                $product = null;
                if (!empty($item['product_id']) && is_numeric($item['product_id'])) {
                    $product = Product::find($item['product_id']);
                }

                if ($product) {
                    if ($product->stock_quantity < $qty && $product->stock_quantity > 0) {
                        // Just warn or allow it for demo purposes, we won't throw exception to avoid breaking demo
                    }

                    $price = $product->price;
                    $productName = $product->name;

                    // Deduct stock
                    $newStock = max(0, $product->stock_quantity - $qty);
                    $status = $newStock <= 0 ? 'Out of Stock' : ($newStock <= 5 ? 'Low Stock' : 'In Stock');
                    $product->update([
                        'stock_quantity' => $newStock,
                        'status' => $status
                    ]);
                    $productId = $product->id;
                } else {
                    $price = $item['price'] ?? 0;
                    $productName = $item['product_name'] ?? 'Custom Item';
                    $productId = null;
                }

                $itemSubtotal = $price * $qty;
                $subtotal += $itemSubtotal;

                $orderItemsData[] = [
                    'product_id' => $productId,
                    'product_name' => $productName,
                    'quantity' => $qty,
                    'price' => $price,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $tax = round($subtotal * 0.05, 2); // 5% tax
            $totalAmount = $subtotal + $tax;

            // Find or create customer
            $customer = Customer::firstOrCreate(
                [
                    'store_id' => $storeId,
                    'email' => $validated['customer_email'],
                ],
                [
                    'name' => $validated['customer_name'],
                    'phone' => $validated['customer_phone'] ?? null,
                    'address' => $validated['shipping_address'] ?? null,
                ]
            );

            // Update customer totals
            $customer->increment('total_orders');
            $customer->increment('total_spent', $totalAmount);

            // Generate order number
            $maxId = Order::max('id') ?? 0;
            $orderNumber = '#ORD-' . ($maxId + 1001);

            $paymentMethod = $validated['payment_method'] ?? 'online';
            $paymentStatus = ($paymentMethod === 'cod') ? 'COD' : 'Paid';

            $order = Order::create([
                'order_number' => $orderNumber,
                'store_id' => $storeId,
                'customer_id' => $customer->id,
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'],
                'customer_phone' => $validated['customer_phone'] ?? null,
                'shipping_address' => $validated['shipping_address'] ?? null,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total_amount' => $totalAmount,
                'status' => 'Pending',
                'payment_status' => $paymentStatus,
            ]);

            foreach ($orderItemsData as $itemData) {
                $itemData['order_id'] = $order->id;
                OrderItem::create($itemData);
            }

            // Automatically check and process dropshipping fulfillment for Meesho reselling products
            try {
                app(\App\Services\Fulfillment\MeeshoFulfillmentService::class)->processNewToastkartOrder($order);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Automatic dropshipping fulfillment creation failed: ' . $e->getMessage());
            }

            return response()->json($order->load(['items.product', 'customer', 'store']), 201);
        });
    }

    public function show($id)
    {
        $order = Order::with(['items.product.meeshoProduct', 'meeshoOrders.meeshoProduct', 'customer', 'store'])->findOrFail($id);
        return response()->json($order);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Pending,Processing,Shipped,Delivered,Completed,Cancelled',
        ]);

        $order = Order::with('items')->findOrFail($id);
        $oldStatus = $order->status;
        $newStatus = $validated['status'];

        if ($oldStatus === $newStatus) {
            return response()->json($order);
        }

        DB::transaction(function () use ($order, $oldStatus, $newStatus) {
            // Restore stock if changing to Cancelled
            if ($newStatus === 'Cancelled' && $oldStatus !== 'Cancelled') {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        $product = Product::find($item->product_id);
                        if ($product) {
                            $newStock = $product->stock_quantity + $item->quantity;
                            $status = $newStock <= 0 ? 'Out of Stock' : ($newStock <= 5 ? 'Low Stock' : 'In Stock');
                            $product->update([
                                'stock_quantity' => $newStock,
                                'status' => $status
                            ]);
                        }
                    }
                }
            }

            // Deduct stock if un-cancelling
            if ($oldStatus === 'Cancelled' && $newStatus !== 'Cancelled') {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        $product = Product::find($item->product_id);
                        if ($product) {
                            $newStock = max(0, $product->stock_quantity - $item->quantity);
                            $status = $newStock <= 0 ? 'Out of Stock' : ($newStock <= 5 ? 'Low Stock' : 'In Stock');
                            $product->update([
                                'stock_quantity' => $newStock,
                                'status' => $status
                            ]);
                        }
                    }
                }
            }

            $order->update(['status' => $newStatus]);
        });

        return response()->json([
            'message' => "Order status updated to {$newStatus}",
            'order' => $order->fresh()->load(['items.product', 'customer'])
        ]);
    }
}
