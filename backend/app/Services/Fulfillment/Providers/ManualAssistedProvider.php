<?php

namespace App\Services\Fulfillment\Providers;

use App\Models\MeeshoOrder;

class ManualAssistedProvider implements MeeshoSupplierProviderInterface
{
    public function getProviderName(): string
    {
        return 'manual_assisted';
    }

    public function supportsAutomatedOrdering(): bool
    {
        return false;
    }

    public function supportsTrackingPolling(): bool
    {
        return false;
    }

    public function createSupplierOrder(MeeshoOrder $order, array $customerData, string $idempotencyKey): array
    {
        // ReefAPI and Apify provide catalog search/details only and do not support buyer checkout/order creation.
        // Meesho does not offer an open public REST API for direct third-party B2C dropshipping orders.
        return [
            'ok' => false,
            'supplier_order_id' => null,
            'supplier_status' => 'Pending Fulfillment',
            'error_code' => 'AUTOMATED_ORDERING_NOT_SUPPORTED',
            'message' => 'Automated direct buyer ordering is not available on public Meesho APIs (ReefAPI/Apify are catalog-only). Order is queued for Manual Assisted fulfillment: please place this order with the supplier and record the genuine supplier order reference.',
            'tracking' => null,
        ];
    }

    public function getTrackingStatus(MeeshoOrder $order): array
    {
        return [
            'ok' => true,
            'shipment_status' => $order->shipment_status,
            'courier_partner' => $order->courier_partner,
            'awb_number' => $order->awb_number,
            'tracking_url' => $order->tracking_url,
            'message' => 'Manual tracking mode: shipment status is updated via merchant entry or carrier webhooks.',
        ];
    }

    public function cancelSupplierOrder(MeeshoOrder $order, string $reason): array
    {
        return [
            'ok' => true,
            'message' => 'Manual assisted order marked as cancelled. Ensure cancellation is confirmed in your supplier panel.',
        ];
    }
}
