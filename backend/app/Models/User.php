<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected $appends = [
        'subscription_bypass',
        'has_active_subscription',
    ];

    public function hasSubscriptionBypass(): bool
    {
        return true;
    }

    public function hasActiveSubscriptionOrBypass(): bool
    {
        return true;
    }

    public function getSubscriptionBypassAttribute(): bool
    {
        return $this->hasSubscriptionBypass();
    }

    public function getHasActiveSubscriptionAttribute(): bool
    {
        return $this->hasActiveSubscriptionOrBypass();
    }

    public function stores()
    {
        return $this->hasMany(Store::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class)
            ->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expiry_date')
                  ->orWhere('expiry_date', '>=', now());
            })
            ->latest('id');
    }
}
