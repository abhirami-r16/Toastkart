<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeeshoProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'product_id',
        'meesho_product_id',
        'meesho_catalog_id',
        'title',
        'description',
        'category',
        'sku',
        'source_price',
        'selling_price',
        'original_price',
        'estimated_shipping',
        'margin_amount',
        'margin_percentage',
        'stock_quantity',
        'stock_status',
        'images',
        'variants',
        'last_synced_at',
        'sync_status',
    ];

    protected $casts = [
        'source_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'original_price' => 'decimal:2',
        'estimated_shipping' => 'decimal:2',
        'margin_amount' => 'decimal:2',
        'margin_percentage' => 'decimal:2',
        'stock_quantity' => 'integer',
        'images' => 'array',
        'variants' => 'array',
        'last_synced_at' => 'datetime',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function resellingOrders()
    {
        return $this->hasMany(MeeshoOrder::class);
    }
}
