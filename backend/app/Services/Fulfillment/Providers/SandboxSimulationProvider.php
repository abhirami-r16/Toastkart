<?php

namespace App\Services\Fulfillment\Providers;

use App\Models\MeeshoOrder;
use Illuminate\Support\Str;

class SandboxSimulationProvider implements MeeshoSupplierProviderInterface
{
    public function getProviderName(): string
    {
        return 'sandbox';
    }

    public function supportsAutomatedOrdering(): bool
    {
        return true;
    }

    public function supportsTrackingPolling(): bool
    {
        return true;
    }

    public function createSupplierOrder(MeeshoOrder $order, array $customerData, string $idempotencyKey): array
    {
        $phone = $customerData['customer_phone'] ?? '';
        
        // Test simulation hooks based on customer phone
        if ($phone === '0000000001') {
            return [
                'ok' => false,
                'supplier_order_id' => null,
                'supplier_status' => 'Failed',
                'error_code' => 'SUPPLIER_OUT_OF_STOCK',
                'message' => 'Supplier item is temporarily out of stock on sandbox simulation.',
                'tracking' => null,
            ];
        }

        if ($phone === '0000000002') {
            return [
                'ok' => false,
                'supplier_order_id' => null,
                'supplier_status' => 'Submission Pending Verification',
                'error_code' => 'UPSTREAM_TIMEOUT',
                'message' => 'Upstream supplier gateway timed out while processing order request. Retrying without verification may duplicate charges.',
                'tracking' => null,
            ];
        }

        $supplierId = 'SANDBOX-MSH-' . ($order->order_id ?: Str::upper(Str::random(6)));

        return [
            'ok' => true,
            'supplier_order_id' => $supplierId,
            'supplier_status' => 'Supplier Confirmed',
            'message' => 'Sandbox supplier order confirmed successfully.',
            'tracking' => [
                'courier_partner' => 'Delhivery Express',
                'awb_number' => 'SBX' . str_pad((string)$order->id, 8, '0', STR_PAD_LEFT),
                'tracking_url' => 'https://track.delhivery.com/tracking?awb=SBX' . str_pad((string)$order->id, 8, '0', STR_PAD_LEFT),
                'shipment_status' => 'Label Created',
            ],
            'error_code' => null,
        ];
    }

    public function getTrackingStatus(MeeshoOrder $order): array
    {
        $currentStatus = $order->shipment_status ?: 'Unfulfilled';

        // Simulate tracking lifecycle progression in sandbox
        $nextStatus = match ($currentStatus) {
            'Unfulfilled', 'Label Created' => 'Picked Up',
            'Picked Up' => 'In Transit',
            'In Transit' => 'Out for Delivery',
            'Out for Delivery' => 'Delivered',
            default => $currentStatus,
        };

        $awb = $order->awb_number ?: ('SBX' . str_pad((string)$order->id, 8, '0', STR_PAD_LEFT));

        return [
            'ok' => true,
            'shipment_status' => $nextStatus,
            'courier_partner' => $order->courier_partner ?: 'Delhivery Express',
            'awb_number' => $awb,
            'tracking_url' => 'https://track.delhivery.com/tracking?awb=' . $awb,
            'message' => "Sandbox tracking status updated to {$nextStatus}.",
        ];
    }

    public function cancelSupplierOrder(MeeshoOrder $order, string $reason): array
    {
        return [
            'ok' => true,
            'message' => 'Sandbox supplier order successfully cancelled.',
        ];
    }
}
