<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SystemLog;
use App\Models\ProgramDictionary;
use Carbon\Carbon;

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
            ->get(); // 🔥 Swapped from paginate(100) to get()  
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
    public function destroyItem($id)
    {
        $deleted = DB::table('schedule_templates')->where('id', $id)->delete();

        if (!$deleted) {
            return response()->json(['error' => 'Programme item not found.'], 404);
        }

        return response()->json(['message' => 'Programme deleted successfully.']);
    }
    // 2. WIPE AN ENTIRE DAY CYCLE GROUP
    public function destroyDay($dayCycle)
    {
        $deleted = DB::table('schedule_templates')->where('day_cycle', $dayCycle)->delete();

        if (!$deleted) {
            return response()->json(['error' => 'No templates found for this day cycle.'], 404);
        }

        return response()->json(['message' => "All items for Day {$dayCycle} deleted successfully."]);
    }

    public function storeItem(Request $request)
    {
        // 1. Validate incoming parameters
        $validated = $request->validate([
            'day_cycle'   => 'required|integer',
            'channel_id'  => 'required',
            'title'       => 'required|string',
            'start_time'  => 'required|string', // Format: HH:MM:SS
            'end_time'    => 'required|string', // Format: HH:MM:SS
            'description' => 'nullable|string'
        ]);

        // 2. ⏱️ Calculate the duration in seconds automatically
        try {
            $start = Carbon::createFromFormat('H:i:s', $validated['start_time']);
            $end = Carbon::createFromFormat('H:i:s', $validated['end_time']);

            // If the program crosses midnight (e.g., starts 23:00, ends 01:00)
            if ($end->lessThan($start)) {
                $end->addDay();
            }

            $durationSeconds = $start->diffInSeconds($end);
        } catch (\Exception $e) {
            // Fallback safety if the user typed an invalid time string format
            $durationSeconds = 0;
        }

        // 3. Insert into database including the missing duration_seconds column!
        // Inside ScheduleController.php -> storeItem()

        $id = DB::table('schedule_templates')->insertGetId([
            'day_cycle'        => $validated['day_cycle'],
            'channel_id'       => $validated['channel_id'],
            'title'            => strtoupper($validated['title']),
            'start_time'       => $validated['start_time'],
            'end_time'         => $validated['end_time'],
            'duration_seconds' => $durationSeconds,
            'file_path'        => "", // 🟢 Fixes the constraint by inserting an empty string!
            'created_at'       => now(),
            'updated_at'       => now()
        ]);

        // 4. Save description to dictionary safely
        if (!empty($validated['description'])) {
            DB::table('program_dictionaries')->updateOrInsert(
                ['title' => strtoupper($validated['title'])],
                ['description' => $validated['description']]
            );
        }

        return response()->json(['success' => true, 'id' => $id]);
    }
}
