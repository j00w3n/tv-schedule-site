<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ScheduleController extends Controller
{
    public function index()
    {

        $now = Carbon::now('Asia/Kuala_Lumpur')->toTimeString();
        $schedules = DB::table('tv_schedules')->get()->map(function ($item) use ($now) {
            $item->time = Carbon::parse($item->start_time)->format('h:i A');

            // Logic to determine status
            if ($now >= $item->start_time && $now <= $item->end_time) {
                $item->status = 'live';
            } elseif ($now > $item->end_time) {
                $item->status = 'finished';
            } else {
                $item->status = 'upcoming';
            }

            return $item;
        });
        // $schedules = DB::table('tv_schedules')
        //     ->orderBy('start_time', 'asc')
        //     ->get()
        //     ->map(function ($item) use ($now) {
        //         // Determine status logic
        //         if ($now >= $item->start_time && $now <= $item->end_time) {
        //             $item->status = 'live';
        //         } elseif ($now < $item->start_time) {
        //             $item->status = 'upcoming';
        //         } else {
        //             $item->status = 'finished';
        //         }

        //         // Format time for React UI (12-hour clock)
        //         $item->time = Carbon::createFromFormat('H:i:s', $item->start_time)->format('h:i A');
        //         return $item;
        //     });
        return response()->json($schedules);
    }
}
