<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class MeeshoAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'user_id',
        'supplier_id',
        'account_name',
        'registered_email',
        'registered_phone',
        'encrypted_api_key',
        'encrypted_api_secret',
        'encrypted_auth_token',
        'connection_status',
        'mode',
        'connected_at',
        'last_synced_at',
        'notes',
    ];

    protected $casts = [
        'connected_at' => 'datetime',
        'last_synced_at' => 'datetime',
    ];

    protected $hidden = [
        'encrypted_api_key',
        'encrypted_api_secret',
        'encrypted_auth_token',
    ];

    public function setApiKeyAttribute($value)
    {
        $this->attributes['encrypted_api_key'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getApiKeyAttribute()
    {
        if (empty($this->attributes['encrypted_api_key'])) return null;
        try {
            return Crypt::decryptString($this->attributes['encrypted_api_key']);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function setApiSecretAttribute($value)
    {
        $this->attributes['encrypted_api_secret'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getApiSecretAttribute()
    {
        if (empty($this->attributes['encrypted_api_secret'])) return null;
        try {
            return Crypt::decryptString($this->attributes['encrypted_api_secret']);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
