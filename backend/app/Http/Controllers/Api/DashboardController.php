<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Force the timezone so it matches your KL playlist exactly
        $now = now()->timezone('Asia/Kuala_Lumpur')->toTimeString();

        // 2. LIVE SHOW: Get the one currently in progress
        $liveShows = DB::table('tv_schedules')
            ->where('start_time', '<=', $now)
            ->where('end_time', '>', $now)
            ->get()
            ->keyBy('channel_id');

        // 3. NEXT SHOW: Get the very next one starting after now
        $nextShows = DB::table('tv_schedules')
            ->where('start_time', '>', $now)
            ->orderBy('start_time', 'asc')
            ->get()
            ->groupBy('channel_id')
            ->map(fn($group) => $group->first());

        return response()->json([
            'currentTime' => $now, // Return this so we can check it in React
            'live' => $liveShows,
            'next' => $nextShows,
        ]);
    }
}
