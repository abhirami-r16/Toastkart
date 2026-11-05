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
        $bypassEmail = strtolower(trim(config('auth.special_bypass_owner_email', env('SPECIAL_BYPASS_OWNER_EMAIL', 'emvithaofficial@gmail.com'))));
        return !empty($this->email) && strtolower(trim($this->email)) === $bypassEmail;
    }

    public function hasActiveSubscriptionOrBypass(): bool
    {
        if ($this->role === 'admin' || $this->email === 'admin@gmail.com') {
            return true;
        }

        if ($this->hasSubscriptionBypass()) {
            return true;
        }

        return $this->activeSubscription()->exists();
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
