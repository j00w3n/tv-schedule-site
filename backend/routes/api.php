<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\ScheduleController; // Ensure this matches your folder structure
use Illuminate\Http\Request;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ScheduleListController;

Route::get('/dashboard', [DashboardController::class, 'index']);
// 1. Fixed Current/Next Logic
Route::get('/current-schedule/{channel}', function ($channel) {
    // Standardize time format to match your start_time/end_time columns
    $now = now()->toTimeString();

    // Get the program currently playing using channel_id
    $current = DB::table('tv_schedules')
        ->where('channel_id', $channel)
        ->where('start_time', '<=', $now)
        ->where('end_time', '>=', $now)
        ->first();

    // Get the next program in the queue
    $next = DB::table('tv_schedules')
        ->where('channel_id', $channel)
        ->where('start_time', '>', $now)
        ->orderBy('start_time', 'asc')
        ->first();

    return response()->json([
        'current' => $current,
        'next' => $next,
        'server_time' => $now
    ]);
});

// 2. Main Schedule List
Route::get('/schedule/{channel}', function ($channel) {
    return DB::table('tv_schedules')
        ->where('channel_id', $channel)
        ->orderBy('start_time', 'asc')
        ->get();
});

Route::get('/schedules/list', [App\Http\Controllers\ScheduleListController::class, 'index']);
Route::put('/schedules/{id}', [App\Http\Controllers\ScheduleListController::class, 'update']);
