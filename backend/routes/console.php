<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// Runs once daily at midnight (Asia/Kuala_Lumpur time) to swap the live schedule
Schedule::command('app:rotate-schedules')
    ->dailyAt('00:00')
    ->timezone('Asia/Kuala_Lumpur');

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');