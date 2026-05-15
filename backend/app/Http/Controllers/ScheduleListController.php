<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScheduleListController extends Controller
{
    public function index(Request $request)
    {
        $offset = (int) $request->query('offset', 0);
        $channel = $request->query('channel');
        $search = $request->query('search');

        $query = DB::table('schedule_templates')
            ->whereBetween('day_cycle', [$offset + 1, $offset + 299]);

        // Filter by specific Channel if selected
        if ($channel && $channel !== 'all') {
            $query->where('channel_id', $channel);
        }

        // Filter by Program Title (Search)
        if ($search) {
            $query->where('title', 'LIKE', '%' . strtoupper($search) . '%');
        }

        $schedules = $query->orderBy('day_cycle')
            ->orderBy('channel_id')
            ->orderBy('start_time')
            ->paginate(100); // Use pagination for better performance

        return response()->json($schedules);
    }
    public function update(Request $request, $id)
    {
        $request->validate([
            'title'      => 'required|string',
            'start_time' => 'required',
            'end_time'   => 'required',
        ]);

        DB::table('schedule_templates')->where('id', $id)->update([
            'title'      => strtoupper($request->title),
            'start_time' => $request->start_time,
            'end_time'   => $request->end_time,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Updated']);
    }

    public function destroy($id)
    {
        DB::table('schedule_templates')->where('id', $id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
