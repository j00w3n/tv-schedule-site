<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'log_type',
        'message',
        'channel_name',
        'day_cycle',
        'status_level',
        'description',
    ];
}