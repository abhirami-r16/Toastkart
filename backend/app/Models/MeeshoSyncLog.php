<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeeshoSyncLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'action_type',
        'status',
        'message',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class);
    }
}
