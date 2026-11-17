<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'owner_name',
        'slug',
        'subdomain',
        'logo',
        'currency',
        'description',
        'status',
        'category',
    ];

    protected $appends = [
        'phone',
    ];

    public function getPhoneAttribute()
    {
        return $this->user?->phone ?? ($this->slug === 'an-nafi' ? '7356997225' : null);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function shiprocketShipments()
    {
        return $this->hasMany(ShiprocketShipment::class);
    }

    public function aiConfigurations()
    {
        return $this->hasMany(AiStoreConfiguration::class)->orderBy('id', 'desc');
    }

    public function settings()
    {
        return $this->hasMany(Setting::class);
    }
}
