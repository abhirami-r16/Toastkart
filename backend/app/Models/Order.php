<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'store_id',
        'customer_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'shipping_address',
        'subtotal',
        'tax',
        'total_amount',
        'status',
        'payment_status',
    ];

    protected $appends = ['exact_order_id', 'meesho_products_list'];

    public function getExactOrderIdAttribute()
    {
        return $this->order_number ?: ('#ORD-' . ($this->id + 1000));
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function meeshoOrders()
    {
        return $this->hasMany(MeeshoOrder::class);
    }

    public function getMeeshoProductsListAttribute()
    {
        $list = [];
        $addedIds = [];

        // 1. Check items and associated products
        $items = $this->relationLoaded('items') ? $this->items : $this->items()->with('product.meeshoProduct')->get();
        foreach ($items as $item) {
            $mProd = $item->product?->meeshoProduct;
            if (!$mProd && $item->product_id) {
                $mProd = MeeshoProduct::where('product_id', $item->product_id)->first();
            }
            if (!$mProd && !empty($item->product_name)) {
                $mProd = MeeshoProduct::where('title', $item->product_name)->first();
            }

            if ($mProd && !empty($mProd->meesho_product_id) && !in_array($mProd->meesho_product_id, $addedIds, true)) {
                $addedIds[] = $mProd->meesho_product_id;
                $pId = $mProd->meesho_product_id;
                $list[] = [
                    'product_name' => $mProd->title ?: $item->product_name,
                    'meesho_product_id' => $pId,
                    'meesho_url' => str_starts_with($pId, 'http') ? $pId : "https://www.meesho.com/s/p/{$pId}",
                    'quantity' => $item->quantity ?? 1,
                ];
            }
        }

        // 2. Check meeshoOrders relation
        $mOrders = $this->relationLoaded('meeshoOrders') ? $this->meeshoOrders : MeeshoOrder::with('meeshoProduct')->where('order_id', $this->id)->get();
        foreach ($mOrders as $mo) {
            $mProd = $mo->meeshoProduct;
            if ($mProd && !empty($mProd->meesho_product_id) && !in_array($mProd->meesho_product_id, $addedIds, true)) {
                $addedIds[] = $mProd->meesho_product_id;
                $pId = $mProd->meesho_product_id;
                $list[] = [
                    'product_name' => $mProd->title,
                    'meesho_product_id' => $pId,
                    'meesho_url' => str_starts_with($pId, 'http') ? $pId : "https://www.meesho.com/s/p/{$pId}",
                    'quantity' => $mo->quantity ?? 1,
                ];
            }
        }

        return $list;
    }
}

