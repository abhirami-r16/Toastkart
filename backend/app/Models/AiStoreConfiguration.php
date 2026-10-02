<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiStoreConfiguration extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'configuration',
        'status',
        'version'
    ];

    protected $casts = [
        'configuration' => 'array'
    ];

    public function store()
    {
        return $this->belongsTo(Store::class);
    }
}
