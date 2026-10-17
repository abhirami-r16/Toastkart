<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'category_id',
        'name',
        'slug',
        'sku',
        'price',
        'compare_price',
        'stock_quantity',
        'description',
        'image',
        'status',
        'is_active',
        'color',
        'size',
        'images',
    ];

    protected $casts = [
        'images' => 'array',
        'is_active' => 'boolean',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function meeshoProduct()
    {
        return $this->hasOne(MeeshoProduct::class, 'product_id');
    }
}

