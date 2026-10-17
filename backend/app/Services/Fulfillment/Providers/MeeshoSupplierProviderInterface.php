<?php

namespace App\Services\Fulfillment\Providers;

use App\Models\MeeshoOrder;

interface MeeshoSupplierProviderInterface
{
    /**
     * Unique identifier of this provider.
     */
    public function getProviderName(): string;

    /**
     * Returns true if provider supports automated direct checkout / supplier order placement.
     */
    public function supportsAutomatedOrdering(): bool;

    /**
     * Returns true if provider supports polling or querying live shipment tracking.
     */
    public function supportsTrackingPolling(): bool;

    /**
     * Places an order with the supplier.
     * Must return an array with:
     * - 'ok' (bool)
     * - 'supplier_order_id' (string|null)
     * - 'supplier_status' (string)
     * - 'message' (string)
     * - 'tracking' (array|null: courier, awb, tracking_url, shipment_status)
     * - 'error_code' (string|null)
     */
    public function createSupplierOrder(MeeshoOrder $order, array $customerData, string $idempotencyKey): array;

    /**
     * Queries upstream tracking status from supplier / carrier.
     */
    public function getTrackingStatus(MeeshoOrder $order): array;

    /**
     * Cancels an order with the supplier.
     */
    public function cancelSupplierOrder(MeeshoOrder $order, string $reason): array;
}
