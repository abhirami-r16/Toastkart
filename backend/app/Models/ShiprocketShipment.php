<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShiprocketShipment extends Model
{
    use HasFactory;

    protected $table = 'shiprocket_shipments';

    protected $fillable = [
        'order_id',
        'store_id',
        'shiprocket_order_id',
        'shipment_id',
        'awb_code',
        'courier_company_id',
        'courier_name',
        'pickup_location',
        'sync_status',
        'shipment_status',
        'shipment_status_code',
        'label_url',
        'manifest_url',
        'tracking_url',
        'etd',
        'package_weight',
        'package_length',
        'package_breadth',
        'package_height',
        'shipping_charges',
        'pickup_scheduled_date',
        'response_payload',
        'tracking_history',
        'error_message',
        'last_synced_at',
    ];

    protected $casts = [
        'order_id' => 'integer',
        'store_id' => 'integer',
        'courier_company_id' => 'integer',
        'shipment_status_code' => 'integer',
        'package_weight' => 'decimal:2',
        'package_length' => 'decimal:2',
        'package_breadth' => 'decimal:2',
        'package_height' => 'decimal:2',
        'shipping_charges' => 'decimal:2',
        'response_payload' => 'array',
        'tracking_history' => 'array',
        'last_synced_at' => 'datetime',
    ];

    protected $appends = [
        'milestones',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Map current shipment status to standard 7 milestones for customer tracking
     */
    public function getMilestonesAttribute(): array
    {
        $status = strtolower($this->sync_status ?? 'unsynced');
        $shipmentStatus = strtolower($this->shipment_status ?? '');

        $milestones = [
            [
                'step' => 1,
                'key' => 'confirmed',
                'label' => 'Order Confirmed',
                'description' => 'Your order has been verified and confirmed at AMIORA.',
                'completed' => true,
                'current' => $status === 'unsynced',
            ],
            [
                'step' => 2,
                'key' => 'shipment_created',
                'label' => 'Shipment Created',
                'description' => 'Package manifest and details registered with Shiprocket.',
                'completed' => in_array($status, ['synced', 'awb_generated', 'pickup_scheduled', 'shipped', 'in_transit', 'out_for_delivery', 'delivered']),
                'current' => $status === 'synced',
            ],
            [
                'step' => 3,
                'key' => 'courier_assigned',
                'label' => 'Courier Assigned',
                'description' => !empty($this->courier_name) ? "Assigned to {$this->courier_name} (AWB: {$this->awb_code})" : 'Courier partner assigned.',
                'completed' => in_array($status, ['awb_generated', 'pickup_scheduled', 'shipped', 'in_transit', 'out_for_delivery', 'delivered']),
                'current' => $status === 'awb_generated',
            ],
            [
                'step' => 4,
                'key' => 'picked_up',
                'label' => 'Picked Up',
                'description' => 'Package picked up from AMIORA warehouse in Kerala.',
                'completed' => in_array($status, ['pickup_scheduled', 'shipped', 'in_transit', 'out_for_delivery', 'delivered']) || str_contains($shipmentStatus, 'pickup'),
                'current' => $status === 'pickup_scheduled',
            ],
            [
                'step' => 5,
                'key' => 'in_transit',
                'label' => 'In Transit',
                'description' => 'Shipment is on its way to the destination hub.',
                'completed' => in_array($status, ['shipped', 'in_transit', 'out_for_delivery', 'delivered']) || str_contains($shipmentStatus, 'transit'),
                'current' => in_array($status, ['shipped', 'in_transit']),
            ],
            [
                'step' => 6,
                'key' => 'out_for_delivery',
                'label' => 'Out for Delivery',
                'description' => 'Courier executive is out to deliver your package.',
                'completed' => in_array($status, ['out_for_delivery', 'delivered']) || str_contains($shipmentStatus, 'out for delivery'),
                'current' => $status === 'out_for_delivery',
            ],
            [
                'step' => 7,
                'key' => 'delivered',
                'label' => 'Delivered',
                'description' => 'Package has been safely delivered.',
                'completed' => $status === 'delivered' || str_contains($shipmentStatus, 'delivered'),
                'current' => $status === 'delivered',
            ],
        ];

        return $milestones;
    }
}
