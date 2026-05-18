<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SystemLog;
use App\Models\ProgramDictionary;

class ScheduleListController extends Controller
{
    protected function writeTelemetryLog(string $message, string $type = 'SYS', string $status = 'info', ?string $channel = null, ?int $cycle = null)
    {
        SystemLog::create([
            'log_type'     => $type,
            'message'      => $message,
            'channel_name' => $channel,
            'day_cycle'    => $cycle,
            'status_level' => $status,
        ]);
    }
    public function index(Request $request)
    {
        $offset = (int) $request->query('offset', 0);
        $channel = $request->query('channel');
        $search = $request->query('search');

        // 1. Start query and join with your dictionary table safely
        $query = DB::table('schedule_templates')
            ->leftJoin('program_dictionaries', 'schedule_templates.title', '=', 'program_dictionaries.title')
            ->whereBetween('schedule_templates.day_cycle', [$offset + 1, $offset + 299]) // Kept your original range
            ->select([
                'schedule_templates.*', // Grabs all your original working columns
                'program_dictionaries.description as global_description' // Adds the new description field safely
            ]);

        // 2. Filter by specific Channel if selected
        if ($channel && $channel !== 'all') {
            $query->where('schedule_templates.channel_id', $channel);
        }

        // 3. Filter by Program Title (Search)
        if ($search) {
            $query->where('schedule_templates.title', 'LIKE', '%' . strtoupper($search) . '%');
        }

        // 4. Order and Paginate exactly like your working backup version
        $schedules = $query->orderBy('schedule_templates.day_cycle')
            ->orderBy('schedule_templates.channel_id')
            ->orderBy('schedule_templates.start_time')
            ->paginate(100); // Kept pagination intact for your frontend

        return response()->json($schedules);
    }
    public function update(Request $request, $id)
    {
        $request->validate([
            'title'       => 'required|string',
            'start_time'  => 'required',
            'end_time'    => 'required',
            'description' => 'nullable|string',
        ]);

        $validatedTitle = strtoupper(trim($request->title));
        $descriptionText = trim($request->description);

        // 1. Fetch the original record BEFORE it gets updated
        $old = DB::table('schedule_templates')->where('id', $id)->first();

        if (!$old) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        // Resolve channel name context strings
        $channelName = $channelnamearray[$old->channel_id] ?? "CH_{$old->channel_id}";
        $dayCycle = $old->day_cycle;

        // 2. Perform individual row update
        DB::table('schedule_templates')->where('id', $id)->update([
            'title'      => $validatedTitle,
            'start_time' => $request->start_time,
            'end_time'   => $request->end_time,
            'updated_at' => now(),
        ]);

        // 3. Global dictionary save/update
        if (!empty($descriptionText)) {
            ProgramDictionary::updateOrCreate(
                ['title' => $validatedTitle],
                ['description' => $descriptionText]
            );
        }

        // 4. CONTEXTUAL LOGGING: Build the precise audit message
        $changes = [];

        // Check if title changed
        if ($old->title !== $validatedTitle) {
            $changes[] = "TITLE CHANGED FROM [{$old->title}] TO [{$validatedTitle}]";
        }

        // Check if times changed
        if ($old->start_time !== $request->start_time || $old->end_time !== $request->end_time) {
            $changes[] = "TIME ADJUSTED FROM [{$old->start_time} - { $old->end_time}] TO [{$request->start_time} - {$request->end_time}]";
        }

        // Check if description was added or changed
        // (Since description is in the joined dictionary table, we check if item.global_description was updated)
        if (isset($old->global_description) && $old->global_description !== $descriptionText && !empty($descriptionText)) {
            $changes[] = "DESCRIPTION UPDATED";
        } elseif (!isset($old->global_description) && !empty($descriptionText)) {
            $changes[] = "NEW DESCRIPTION COMPILED";
        }

        // If something was modified, write it out to the database log table
        if (count($changes) > 0) {
            $logMessage = "MODIFIED [{$validatedTitle}]: " . implode(' | ', $changes);
        } else {
            $logMessage = "MANUAL OVERRIDE: TARGET [{$validatedTitle}] RE-SAVED WITHOUT ALTERATIONS";
        }

        $this->writeTelemetryLog(
            message: $logMessage,
            type: "MOD",
            status: "warning", // Highlights amber in your terminal UI
            channel: $channelName,
            cycle: $dayCycle
        );

        return response()->json(['message' => 'Updated']);
    }
    // destroy is not currently used in the frontend, but it's here for potential future use if we want to allow deletion of schedule entries
    public function destroy($id)
    {
        DB::table('schedule_templates')->where('id', $id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
