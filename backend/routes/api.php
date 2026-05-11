<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ScheduleController; // Ensure this matches your folder structure

Route::get('/schedule', [ScheduleController::class, 'index']);