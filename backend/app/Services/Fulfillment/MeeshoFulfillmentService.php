<?php

namespace App\Services\Fulfillment;

use App\Models\MeeshoAccount;
use App\Models\MeeshoOrder;
use App\Models\MeeshoProduct;
use App\Models\MeeshoSyncLog;
use App\Models\Order;
use App\Models\Store;
use App\Services\Fulfillment\Providers\LivePartnerApiProvider;
use App\Services\Fulfillment\Providers\ManualAssistedProvider;
use App\Services\Fulfillment\Providers\MeeshoSupplierProviderInterface;
use App\Services\Fulfillment\Providers\SandboxSimulationProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MeeshoFulfillmentService
{
    /**
     * Resolve the active supplier provider based on environment config and store account.
     */
    public function resolveProvider(?Store $store = null): MeeshoSupplierProviderInterface
    {
        $globalMode = config('services.meesho.fulfillment_mode', 'manual_assisted');

        if ($globalMode === 'sandbox') {
            return app(SandboxSimulationProvider::class);
        }

        if ($store) {
            $account = MeeshoAccount::where('store_id', $store->id)->first();
            if ($account && $account->mode === 'sandbox_mock') {
                return app(SandboxSimulationProvider::class);
            }
            if ($account && $account->mode === 'partner_api') {
                return app(LivePartnerApiProvider::class);
            }
        }

        if ($globalMode === 'partner_api') {
            return app(LivePartnerApiProvider::class);
        }

        return app(ManualAssistedProvider::class);
    }

    /**
     * Automatic hook invoked when a new Toastkart store order is placed.
     * Inspects order line items and automatically creates dropshipping fulfillment records
     * for any items linked to Meesho reselling products.
     */
    public function processNewToastkartOrder(Order $order): array
    {
        $createdFulfillments = [];

        // Ensure order items are loaded
        if (!$order->relationLoaded('items')) {
            $order->load('items.product');
        }

        $storeId = $order->store_id;

        foreach ($order->items as $item) {
            if (!$item->product_id) {
                continue;
            }

            // Check if this item is mapped to a Meesho reselling product
            $mProductQuery = MeeshoProduct::where('product_id', $item->product_id);
            if ($storeId) {
                $mProductQuery->where('store_id', $storeId);
            }
            $mProduct = $mProductQuery->first();

            if (!$mProduct) {
                continue;
            }

            $effectiveStoreId = $storeId ?: $mProduct->store_id;
            $qty = max(1, (int) $item->quantity);
            $sourceUnitPrice = (float) $mProduct->source_price;
            $sellingUnitPrice = (float) $item->price;

            $totalSellingPrice = round($sellingUnitPrice * $qty, 2);
            $totalSourceCost = round($sourceUnitPrice * $qty, 2);
            $shippingCost = (float) $mProduct->estimated_shipping ?: 45.00;

            // Platform fee: 2% of retail revenue
            $platformFee = round($totalSellingPrice * 0.02, 2);
            // Gateway fee: 2% if paid online; 0 for COD
            $isOnlinePayment = strtolower((string)$order->payment_status) === 'paid'
                || strtolower((string)($order->payment_method ?? '')) === 'online';
            $gatewayFee = $isOnlinePayment ? round($totalSellingPrice * 0.02, 2) : 0.00;

            $grossMargin = round($totalSellingPrice - $totalSourceCost, 2);
            $netProfit = round($totalSellingPrice - $totalSourceCost - $shippingCost - $platformFee - $gatewayFee, 2);

            // Deterministic idempotency key
            $idempotencyKey = 'msh_ord_' . $order->id . '_' . $item->id . '_' . $mProduct->id;

            // Check if already created
            $existing = MeeshoOrder::where('idempotency_key', $idempotencyKey)
                ->orWhere(function ($q) use ($order, $mProduct) {
                    $q->where('order_id', $order->id)
                      ->where('meesho_product_id', $mProduct->id);
                })->first();

            if ($existing) {
                $createdFulfillments[] = $existing;
                continue;
            }

            // Extract variant information (size, color) from product if present
            $variantInfo = [];
            if ($item->product) {
                if (!empty($item->product->size)) {
                    $variantInfo['size'] = $item->product->size;
                }
                if (!empty($item->product->color)) {
                    $variantInfo['color'] = $item->product->color;
                }
            }

            $customerPaymentStatus = $order->payment_status ?: ($order->payment_method === 'cod' ? 'COD' : 'Paid');

            $meeshoOrder = MeeshoOrder::create([
                'store_id' => $effectiveStoreId,
                'order_id' => $order->id,
                'meesho_product_id' => $mProduct->id,
                'quantity' => $qty,
                'variant_info' => !empty($variantInfo) ? $variantInfo : null,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'customer_phone' => $order->customer_phone,
                'customer_address' => $order->shipping_address,
                'idempotency_key' => $idempotencyKey,
                'toastkart_selling_price' => $totalSellingPrice,
                'source_purchase_cost' => $totalSourceCost,
                'shipping_charges' => $shippingCost,
                'platform_fees' => $platformFee,
                'payment_gateway_fees' => $gatewayFee,
                'gross_margin' => $grossMargin,
                'net_profit' => $netProfit,
                'is_profit_confirmed' => false,
                'customer_payment_status' => $customerPaymentStatus,
                'supplier_order_status' => 'Pending Fulfillment',
                'shipment_status' => 'Unfulfilled',
                'fulfilment_mode' => config('services.meesho.fulfillment_mode', 'manual_assisted'),
                'notes' => "Auto-captured from Toastkart store order {$order->order_number} (Item: {$mProduct->title})",
            ]);

            MeeshoSyncLog::create([
                'store_id' => $effectiveStoreId,
                'action_type' => 'order_dispatch',
                'status' => 'info',
                'message' => "Auto-created dropshipping record for Order {$order->order_number} ({$mProduct->title}). Est net profit: ₹{$netProfit}.",
                'payload' => [
                    'order_id' => $order->id,
                    'meesho_order_id' => $meeshoOrder->id,
                    'selling_price' => $totalSellingPrice,
                    'source_cost' => $totalSourceCost,
                ],
            ]);

            // Evaluate Auto-Fulfillment Policy
            $policy = config('services.meesho.auto_fulfill_policy', 'paid_only');
            $canAutoSubmit = false;

            if ($policy === 'paid_only') {
                $canAutoSubmit = strtolower($customerPaymentStatus) === 'paid';
            } elseif ($policy === 'allow_cod') {
                $canAutoSubmit = in_array(strtolower($customerPaymentStatus), ['paid', 'cod']);
            }

            if ($canAutoSubmit) {
                $store = $order->store ?: Store::find($effectiveStoreId);
                $provider = $this->resolveProvider($store);

                if ($provider->supportsAutomatedOrdering()) {
                    $this->submitToSupplier($meeshoOrder);
                } else {
                    $meeshoOrder->update([
                        'notes' => $meeshoOrder->notes . ' | Supplier requires manual placement (ReefAPI/Apify are catalog-only).',
                    ]);
                }
            } else {
                $meeshoOrder->update([
                    'notes' => $meeshoOrder->notes . " | Held in Pending Fulfillment according to policy ({$policy}).",
                ]);
            }

            $createdFulfillments[] = $meeshoOrder->fresh()->load(['order', 'meeshoProduct']);
        }

        return $createdFulfillments;
    }

    /**
     * Submit / book order with supplier.
     * Supports both manual entry of genuine supplier order ID and automated provider submission.
     */
    public function submitToSupplier(
        MeeshoOrder $mOrder,
        ?string $manualSupplierOrderId = null,
        ?string $notes = null
    ): array {
        return DB::transaction(function () use ($mOrder, $manualSupplierOrderId, $notes) {
            /** @var MeeshoOrder $lockedOrder */
            $lockedOrder = MeeshoOrder::with(['order', 'meeshoProduct', 'store'])
                ->lockForUpdate()
                ->findOrFail($mOrder->id);

            // Safety check 1: Payment failed
            if ($lockedOrder->customer_payment_status === 'Failed') {
                return [
                    'ok' => false,
                    'status' => 422,
                    'message' => 'Cannot process supplier fulfillment for an order with failed customer payment.',
                ];
            }

            // Safety check 2: Already booked
            if (!empty($lockedOrder->meesho_order_id) && in_array($lockedOrder->supplier_order_status, [
                'Placed with Supplier',
                'Supplier Confirmed',
                'Supplier Processing',
                'Processing',
                'Shipped',
                'Delivered',
            ])) {
                if ($manualSupplierOrderId && $lockedOrder->meesho_order_id === $manualSupplierOrderId) {
                    return [
                        'ok' => true,
                        'status' => 200,
                        'message' => 'Order is already booked with this supplier reference.',
                        'order' => $lockedOrder,
                    ];
                }

                if ($manualSupplierOrderId && $lockedOrder->meesho_order_id !== $manualSupplierOrderId) {
                    return [
                        'ok' => false,
                        'status' => 422,
                        'message' => "Supplier order already booked with reference '{$lockedOrder->meesho_order_id}'. Cancel existing booking first to re-book.",
                    ];
                }

                return [
                    'ok' => true,
                    'status' => 200,
                    'message' => 'Order is already booked with supplier.',
                    'order' => $lockedOrder,
                ];
            }

            // Case A: Manual assisted submission (store owner provides actual supplier order ID)
            if (!empty($manualSupplierOrderId)) {
                $lockedOrder->update([
                    'meesho_order_id' => $manualSupplierOrderId,
                    'supplier_order_status' => 'Supplier Confirmed',
                    'supplier_placed_at' => now(),
                    'failure_reason' => null,
                    'notes' => $notes ?: $lockedOrder->notes,
                ]);

                if ($lockedOrder->order) {
                    $lockedOrder->order->update(['status' => 'Processing']);
                }

                MeeshoSyncLog::create([
                    'store_id' => $lockedOrder->store_id,
                    'action_type' => 'order_dispatch',
                    'status' => 'success',
                    'message' => "Order #{$lockedOrder->order_id} recorded with supplier reference {$manualSupplierOrderId}.",
                    'payload' => ['supplier_ref' => $manualSupplierOrderId],
                ]);

                return [
                    'ok' => true,
                    'status' => 200,
                    'message' => 'Supplier order recorded successfully.',
                    'order' => $lockedOrder->fresh()->load(['order', 'meeshoProduct']),
                ];
            }

            // Case B: Automated provider submission
            $provider = $this->resolveProvider($lockedOrder->store);

            if (!$provider->supportsAutomatedOrdering()) {
                $msg = 'Automated ordering is unavailable on standard public Meesho APIs. Order is placed in Pending Fulfillment for manual placement.';
                $lockedOrder->update([
                    'supplier_order_status' => 'Pending Fulfillment',
                    'notes' => $lockedOrder->notes . ' | ' . $msg,
                ]);

                return [
                    'ok' => false,
                    'status' => 200,
                    'message' => $msg,
                    'order' => $lockedOrder->fresh()->load(['order', 'meeshoProduct']),
                ];
            }

            // Mark in-flight to prevent race conditions
            $lockedOrder->update(['supplier_order_status' => 'Submitting to Supplier']);

            $customerData = [
                'customer_name' => $lockedOrder->customer_name ?: ($lockedOrder->order?->customer_name ?? 'Store Customer'),
                'customer_email' => $lockedOrder->customer_email ?: ($lockedOrder->order?->customer_email ?? 'customer@example.com'),
                'customer_phone' => $lockedOrder->customer_phone ?: ($lockedOrder->order?->customer_phone ?? ''),
                'customer_address' => $lockedOrder->customer_address ?: ($lockedOrder->order?->shipping_address ?? 'Store Address'),
            ];

            $idempotencyKey = $lockedOrder->idempotency_key ?: ('msh_sub_' . $lockedOrder->id . '_' . time());

            $res = $provider->createSupplierOrder($lockedOrder, $customerData, $idempotencyKey);

            if ($res['ok']) {
                $trackingData = $res['tracking'] ?? [];

                $lockedOrder->update([
                    'meesho_order_id' => $res['supplier_order_id'],
                    'supplier_order_status' => $res['supplier_status'] ?? 'Supplier Confirmed',
                    'supplier_placed_at' => now(),
                    'failure_reason' => null,
                    'courier_partner' => $trackingData['courier_partner'] ?? $lockedOrder->courier_partner,
                    'awb_number' => $trackingData['awb_number'] ?? $lockedOrder->awb_number,
                    'tracking_url' => $trackingData['tracking_url'] ?? $lockedOrder->tracking_url,
                    'shipment_status' => $trackingData['shipment_status'] ?? $lockedOrder->shipment_status,
                ]);

                if ($lockedOrder->order) {
                    $lockedOrder->order->update(['status' => 'Processing']);
                }

                MeeshoSyncLog::create([
                    'store_id' => $lockedOrder->store_id,
                    'action_type' => 'order_dispatch',
                    'status' => 'success',
                    'message' => "Order #{$lockedOrder->order_id} submitted to supplier ({$res['supplier_order_id']}).",
                    'payload' => $res,
                ]);

                return [
                    'ok' => true,
                    'status' => 200,
                    'message' => $res['message'],
                    'order' => $lockedOrder->fresh()->load(['order', 'meeshoProduct']),
                ];
            }

            // Provider failed or timed out
            $newStatus = $res['supplier_status'] ?? 'Failed';
            $lockedOrder->update([
                'supplier_order_status' => $newStatus,
                'failure_reason' => $res['message'] ?? 'Supplier order submission failed.',
                'retry_count' => $lockedOrder->retry_count + 1,
                'last_retry_at' => now(),
            ]);

            MeeshoSyncLog::create([
                'store_id' => $lockedOrder->store_id,
                'action_type' => 'order_dispatch',
                'status' => 'failed',
                'message' => "Order #{$lockedOrder->order_id} supplier submission failed: " . ($res['message'] ?? 'Error'),
                'payload' => $res,
            ]);

            return [
                'ok' => false,
                'status' => 422,
                'message' => $res['message'],
                'order' => $lockedOrder->fresh()->load(['order', 'meeshoProduct']),
            ];
        });
    }

    /**
     * Poll / sync tracking from supplier / courier.
     */
    public function syncTracking(MeeshoOrder $mOrder): array
    {
        $provider = $this->resolveProvider($mOrder->store);

        if (!$provider->supportsTrackingPolling()) {
            return [
                'ok' => true,
                'message' => 'Tracking is in manual/webhook mode.',
                'order' => $mOrder,
            ];
        }

        $res = $provider->getTrackingStatus($mOrder);

        if ($res['ok']) {
            $shipmentStatus = $res['shipment_status'] ?? $mOrder->shipment_status;
            $isDelivered = $shipmentStatus === 'Delivered';

            $mOrder->update([
                'courier_partner' => $res['courier_partner'] ?? $mOrder->courier_partner,
                'awb_number' => $res['awb_number'] ?? $mOrder->awb_number,
                'tracking_url' => $res['tracking_url'] ?? $mOrder->tracking_url,
                'shipment_status' => $shipmentStatus,
                'dispatched_at' => $mOrder->dispatched_at ?: now(),
                'delivered_at' => $isDelivered ? ($res['delivered_at'] ?? now()) : $mOrder->delivered_at,
                'is_profit_confirmed' => $isDelivered,
            ]);

            if ($mOrder->order) {
                if ($isDelivered) {
                    $mOrder->order->update(['status' => 'Delivered']);
                } elseif (in_array($shipmentStatus, ['Picked Up', 'In Transit', 'Out for Delivery'])) {
                    $mOrder->order->update(['status' => 'Shipped']);
                }
            }

            MeeshoSyncLog::create([
                'store_id' => $mOrder->store_id,
                'action_type' => 'tracking_update',
                'status' => 'success',
                'message' => "Tracking updated for Order #{$mOrder->order_id} ({$shipmentStatus}, AWB: {$mOrder->awb_number}).",
                'payload' => $res,
            ]);

            return [
                'ok' => true,
                'message' => 'Tracking synchronized successfully.',
                'order' => $mOrder->fresh()->load(['order', 'meeshoProduct']),
            ];
        }

        return [
            'ok' => false,
            'message' => $res['message'] ?? 'Failed to synchronize tracking.',
            'order' => $mOrder,
        ];
    }

    /**
     * Handle return, cancellation, and RTO with accurate profit and loss reconciliation.
     */
    public function handleReturn(
        MeeshoOrder $mOrder,
        string $returnStatus,
        string $returnReason,
        ?float $refundAmount = null
    ): array {
        if ($mOrder->return_status === 'refunded') {
            return [
                'ok' => false,
                'status' => 422,
                'message' => 'This order has already been refunded.',
            ];
        }

        $refundAmt = $refundAmount !== null ? (float)$refundAmount : (float)$mOrder->toastkart_selling_price;

        $isRefunded = $returnStatus === 'refunded';
        $isRTO = in_array($returnStatus, ['rto', 'returned', 'rto_delivered']);

        // Profit reconciliation
        $newNetProfit = $mOrder->net_profit;
        if ($isRefunded) {
            $newNetProfit = 0.00;
        } elseif ($isRTO) {
            // Unrecoverable forward shipping fee is an operational loss
            $newNetProfit = -1 * (float)$mOrder->shipping_charges;
        }

        $mOrder->update([
            'return_status' => $returnStatus,
            'return_reason' => $returnReason,
            'refund_amount' => $refundAmt,
            'is_profit_confirmed' => false,
            'net_profit' => $newNetProfit,
            'customer_payment_status' => $isRefunded ? 'Refunded' : $mOrder->customer_payment_status,
            'shipment_status' => $isRTO ? 'Returned' : $mOrder->shipment_status,
        ]);

        if ($isRefunded && $mOrder->order) {
            $mOrder->order->update(['status' => 'Cancelled']);
        }

        MeeshoSyncLog::create([
            'store_id' => $mOrder->store_id,
            'action_type' => 'order_dispatch',
            'status' => 'warning',
            'message' => "Return status for Order #{$mOrder->order_id} set to {$returnStatus}.",
            'payload' => [
                'return_status' => $returnStatus,
                'reason' => $returnReason,
                'refund_amount' => $refundAmt,
                'reconciled_profit' => $newNetProfit,
            ],
        ]);

        return [
            'ok' => true,
            'status' => 200,
            'message' => 'Return and financial reconciliation updated successfully.',
            'order' => $mOrder->fresh()->load(['order', 'meeshoProduct']),
        ];
    }
}
