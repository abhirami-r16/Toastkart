<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeeshoOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'order_id',
        'meesho_product_id',
        'meesho_order_id',
        'meesho_sub_order_id',
        'toastkart_selling_price',
        'source_purchase_cost',
        'shipping_charges',
        'platform_fees',
        'payment_gateway_fees',
        'gross_margin',
        'net_profit',
        'is_profit_confirmed',
        'customer_payment_status',
        'supplier_order_status',
        'shipment_status',
        'courier_partner',
        'awb_number',
        'tracking_url',
        'supplier_placed_at',
        'dispatched_at',
        'delivered_at',
        'return_status',
        'return_reason',
        'refund_amount',
        'fulfilment_mode',
        'notes',
    ];

    protected $casts = [
        'toastkart_selling_price' => 'decimal:2',
        'source_purchase_cost' => 'decimal:2',
        'shipping_charges' => 'decimal:2',
        'platform_fees' => 'decimal:2',
        'payment_gateway_fees' => 'decimal:2',
        'gross_margin' => 'decimal:2',
        'net_profit' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'is_profit_confirmed' => 'boolean',
        'supplier_placed_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function meeshoProduct()
    {
        return $this->belongsTo(MeeshoProduct::class);
    }
}
