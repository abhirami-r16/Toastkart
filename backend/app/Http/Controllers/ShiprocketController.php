<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\ShiprocketShipment;
use App\Services\Shiprocket\ShiprocketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ShiprocketController extends Controller
{
    protected ShiprocketService $shiprocket;

    public function __construct(ShiprocketService $shiprocket)
    {
        $this->shiprocket = $shiprocket;
    }

    /**
     * Check current Shiprocket connection & configuration status for AMIORA (Store ID: 86)
     */
    public function getStatus(Request $request): JsonResponse
    {
        $this->authorizeStoreOwner($request);

        $isConfigured = $this->shiprocket->isConfigured();
        $isSandbox = $this->shiprocket->isSandbox();

        $tokenValid = false;
        try {
            $token = $this->shiprocket->getToken();
            $tokenValid = !empty($token);
        } catch (\Exception $e) {
            $tokenValid = false;
        }

        $totalAmioraOrders = Order::where('store_id', 86)->count();
        $syncedCount = ShiprocketShipment::where('store_id', 86)->whereNotNull('shiprocket_order_id')->count();
        $awbCount = ShiprocketShipment::where('store_id', 86)->whereNotNull('awb_code')->count();

        return response()->json([
            'status' => 'success',
            'store_id' => 86,
            'store_name' => 'Amiora',
            'business_name' => 'LA EMVITHA â€“ AMIORA',
            'is_configured' => $isConfigured,
            'is_sandbox' => $isSandbox,
            'token_valid' => $tokenValid,
            'pickup_location' => config('services.shiprocket.pickup_location', 'Primary'),
            'pickup_pincode' => config('services.shiprocket.pickup_pincode', '683549'),
            'stats' => [
                'total_orders' => $totalAmioraOrders,
                'synced_orders' => $syncedCount,
                'awb_generated' => $awbCount,
            ],
        ]);
    }

    /**
     * List AMIORA Store ID 86 orders with their Shiprocket synchronization details
     */
    public function getOrders(Request $request): JsonResponse
    {
        $this->authorizeStoreOwner($request);

        $query = Order::with(['items.product', 'customer', 'shiprocketShipment'])
            ->where('store_id', 86);

        if ($request->has('sync_status') && $request->sync_status !== 'all') {
            $syncStatus = $request->sync_status;
            if ($syncStatus === 'unsynced') {
                $query->whereDoesntHave('shiprocketShipment');
            } else {
                $query->whereHas('shiprocketShipment', function ($q) use ($syncStatus) {
                    $q->where('sync_status', $syncStatus);
                });
            }
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%")
                    ->orWhereHas('shiprocketShipment', function ($sq) use ($search) {
                        $sq->where('awb_code', 'like', "%{$search}%")
                            ->orWhere('shiprocket_order_id', 'like', "%{$search}%");
                    });
            });
        }

        $orders = $query->orderBy('id', 'desc')->paginate($request->input('per_page', 25));

        return response()->json($orders);
    }

    /**
     * Sync an AMIORA order with Shiprocket
     */
    public function syncOrder(Request $request, $id): JsonResponse
    {
        $this->authorizeStoreOwner($request);

        $order = Order::where('store_id', 86)->findOrFail($id);

        if (strtolower($order->status) === 'cancelled') {
            return response()->json([
                'error' => 'Cancelled orders cannot be synchronized with Shiprocket.',
            ], 422);
        }

        $dimensions = $request->only(['package_weight', 'package_length', 'package_breadth', 'package_height']);

        try {
            $shipment = $this->shiprocket->syncOrder($order, $dimensions);

            return response()->json([
                'status' => 'success',
                'message' => 'Order successfully synchronized with Shiprocket.',
                'shipment' => $shipment,
                'order' => $order->fresh()->load('shiprocketShipment'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Check available couriers and rates for an AMIORA order
     */
    public function checkServiceability(Request $request, $id): JsonResponse
    {
        $this->authorizeStoreOwner($request);

        $order = Order::with('shiprocketShipment')->where('store_id', 86)->findOrFail($id);

        // Extract delivery pincode
        $deliveryPincode = $request->input('pincode');
        if (empty($deliveryPincode)) {
            $rawAddress = $order->shipping_address ?: ($order->customer?->address ?: '');
            if (preg_match('/\b([1-9][0-9]{5})\b/', $rawAddress, $matches)) {
                $deliveryPincode = $matches[1];
            } else {
                $deliveryPincode = '683549'; // Default Kerala pincode
            }
        }

        $weight = (float)($request->input('weight') ?: ($order->shiprocketShipment?->package_weight ?: 0.5));
        $isCod = strtoupper($order->payment_status) === 'COD';

        $couriers = $this->shiprocket->checkServiceability($deliveryPincode, $weight, $isCod);

        return response()->json([
            'status' => 'success',
            'delivery_pincode' => $deliveryPincode,
            'weight' => $weight,
            'is_cod' => $isCod,
            'couriers' => $couriers,
        ]);
    }

    /**
     * Generate AWB and assign courier for an AMIORA order
     */
    public function generateAwb(Request $request, $id): JsonResponse
    {
        $this->authorizeStoreOwner($request);

        $order = Order::with('shiprocketShipment')->where('store_id', 86)->findOrFail($id);

        $shipment = $order->shiprocketShipment;
        if (!$shipment) {
            // Auto-sync first if not yet synced
            $shipment = $this->shiprocket->syncOrder($order);
        }

        $courierId = $request->input('courier_company_id');

        try {
            $updatedShipment = $this->shiprocket->generateAwb($shipment, $courierId ? (int)$courierId : null);

            return response()->json([
                'status' => 'success',
                'message' => "AWB ({$updatedShipment->awb_code}) assigned successfully with {$updatedShipment->courier_name}.",
                'shipment' => $updatedShipment,
                'order' => $order->fresh()->load('shiprocketShipment'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get / Generate Shipping Label URL
     */
    public function getLabel(Request $request, $id): JsonResponse
    {
        $this->authorizeStoreOwner($request);

        $order = Order::with('shiprocketShipment')->where('store_id', 86)->findOrFail($id);
        $shipment = $order->shiprocketShipment;

        if (!$shipment || empty($shipment->shipment_id)) {
            return response()->json(['error' => 'Order is not yet synced to Shiprocket.'], 400);
        }

        try {
            $labelUrl = $this->shiprocket->generateLabel($shipment);

            return response()->json([
                'status' => 'success',
                'label_url' => $labelUrl,
                'shipment' => $shipment->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get / Generate Manifest URL
     */
    public function getManifest(Request $request, $id): JsonResponse
    {
        $this->authorizeStoreOwner($request);

        $order = Order::with('shiprocketShipment')->where('store_id', 86)->findOrFail($id);
        $shipment = $order->shiprocketShipment;

        if (!$shipment || empty($shipment->shipment_id)) {
            return response()->json(['error' => 'Order is not yet synced to Shiprocket.'], 400);
        }

        try {
            $manifestUrl = $this->shiprocket->generateManifest($shipment);

            return response()->json([
                'status' => 'success',
                'manifest_url' => $manifestUrl,
                'shipment' => $shipment->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Track shipment in real time
     */
    public function track(Request $request, $id): JsonResponse
    {
        $this->authorizeStoreOwner($request);

        $order = Order::with('shiprocketShipment')->where('store_id', 86)->findOrFail($id);
        $shipment = $order->shiprocketShipment;

        if (!$shipment) {
            return response()->json(['error' => 'No Shiprocket shipment found for this order.'], 404);
        }

        try {
            $trackingData = $this->shiprocket->trackShipment($shipment);

            return response()->json([
                'status' => 'success',
                'tracking' => $trackingData,
                'shipment' => $shipment->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Cancel shipment on Shiprocket
     */
    public function cancel(Request $request, $id): JsonResponse
    {
        $this->authorizeStoreOwner($request);

        $order = Order::with('shiprocketShipment')->where('store_id', 86)->findOrFail($id);
        $shipment = $order->shiprocketShipment;

        if (!$shipment) {
            return response()->json(['error' => 'No active shipment found to cancel.'], 404);
        }

        try {
            $this->shiprocket->cancelShipment($shipment);

            return response()->json([
                'status' => 'success',
                'message' => 'Shiprocket shipment cancelled successfully.',
                'shipment' => $shipment->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Public Customer Shipment Tracking for AMIORA Storefront (Store ID: 86)
     */
    public function getCustomerTracking(Request $request, $orderNumber): JsonResponse
    {
        $cleanNumber = '#' . ltrim($orderNumber, '#');

        $order = Order::with(['items.product', 'shiprocketShipment'])
            ->where('store_id', 86)
            ->where(function ($q) use ($cleanNumber, $orderNumber) {
                $q->where('order_number', $cleanNumber)
                    ->orWhere('order_number', $orderNumber)
                    ->orWhere('id', is_numeric($orderNumber) ? (int)$orderNumber : -1);
            })
            ->first();

        if (!$order) {
            return response()->json([
                'error' => 'Order not found for AMIORA.',
            ], 404);
        }

        $shipment = $order->shiprocketShipment;

        return response()->json([
            'order_number' => $order->order_number,
            'order_date' => $order->created_at->format('d M Y'),
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'has_shipment' => (bool)$shipment,
            'awb_code' => $shipment?->awb_code,
            'courier_name' => $shipment?->courier_name,
            'tracking_url' => $shipment?->tracking_url,
            'etd' => $shipment?->etd,
            'milestones' => $shipment ? $shipment->milestones : (new ShiprocketShipment())->milestones,
            'activities' => $shipment?->tracking_history ?? [],
        ]);
    }

    /**
     * Secure Webhook Handler for Shiprocket status updates
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        // Optional webhook token validation
        $expectedToken = config('services.shiprocket.webhook_token');
        if (!empty($expectedToken)) {
            $headerToken = $request->header('x-shiprocket-token') ?? $request->header('Authorization');
            if ($headerToken !== $expectedToken && $headerToken !== "Bearer {$expectedToken}") {
                Log::warning('Shiprocket webhook unauthorized token attempt');
                return response()->json(['error' => 'Unauthorized'], 401);
            }
        }

        $payload = $request->all();
        Log::info('Shiprocket webhook received', ['payload' => $payload]);

        $awb = $payload['awb'] ?? ($payload['awb_code'] ?? null);
        $shipmentId = $payload['shipment_id'] ?? null;
        $orderId = $payload['order_id'] ?? null;
        $currentStatus = $payload['current_status'] ?? ($payload['status'] ?? null);

        if (!$awb && !$shipmentId && !$orderId) {
            return response()->json(['message' => 'Ignored, missing identifiers'], 200);
        }

        // Restrict strictly to AMIORA Store 86
        $shipment = ShiprocketShipment::where('store_id', 86)
            ->where(function ($q) use ($awb, $shipmentId, $orderId) {
                if ($awb) $q->orWhere('awb_code', $awb);
                if ($shipmentId) $q->orWhere('shipment_id', (string)$shipmentId);
                if ($orderId) $q->orWhere('shiprocket_order_id', (string)$orderId);
            })
            ->first();

        if ($shipment) {
            $normalizedStatus = strtolower($currentStatus);

            $syncStatus = match (true) {
                str_contains($normalizedStatus, 'deliver') => 'delivered',
                str_contains($normalizedStatus, 'out for delivery') => 'out_for_delivery',
                str_contains($normalizedStatus, 'in transit') || str_contains($normalizedStatus, 'shipped') => 'in_transit',
                str_contains($normalizedStatus, 'pickup') => 'pickup_scheduled',
                str_contains($normalizedStatus, 'cancel') || str_contains($normalizedStatus, 'rto') => 'cancelled',
                default => $shipment->sync_status,
            };

            $history = $shipment->tracking_history ?? [];
            if (!empty($payload['location']) || !empty($payload['activity'])) {
                $history[] = [
                    'date' => now()->format('d M Y, h:i A'),
                    'activity' => $payload['activity'] ?? "Status updated: {$currentStatus}",
                    'location' => $payload['location'] ?? '',
                ];
            }

            $shipment->update([
                'shipment_status' => $currentStatus ?: $shipment->shipment_status,
                'sync_status' => $syncStatus,
                'tracking_history' => $history,
                'etd' => $payload['edd'] ?? $shipment->etd,
                'last_synced_at' => now(),
            ]);

            // Sync with Toastkart order status
            if ($shipment->order) {
                if ($syncStatus === 'delivered') {
                    $shipment->order->update(['status' => 'Delivered']);
                } elseif ($syncStatus === 'in_transit' && $shipment->order->status === 'Pending') {
                    $shipment->order->update(['status' => 'Shipped']);
                }
            }
        }

        return response()->json(['status' => 'success', 'message' => 'Webhook processed']);
    }

    /**
     * Guard store access: only user owning store 86 or admin
     */
    protected function authorizeStoreOwner(Request $request): void
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        // Admins can manage any store
        if ($user->role === 'admin' || $user->role === 'superadmin') {
            return;
        }

        // Store owner must own Store 86
        if ((int)$user->id === 13) {
            return;
        }

        $isOwner = \App\Models\Store::where('id', 86)->where('user_id', $user->id)->exists();
        if (!$isOwner) {
            abort(403, 'Unauthorized. Access is restricted to AMIORA (Store ID: 86) managers.');
        }
    }
}
