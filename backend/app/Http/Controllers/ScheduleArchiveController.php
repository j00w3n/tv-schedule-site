<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\SystemLog;

class ScheduleArchiveController extends Controller
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

    public function cloneMonth(Request $request)
    {
        $request->validate([
            'source_offset' => 'required|integer',
            'target_offset' => 'required|integer',
            'channels'      => 'required',
        ]);

        $source = (int) $request->source_offset;
        $target = (int) $request->target_offset;
        $channelsInput = $request->channels;

        if ($source === $target) {
            return response()->json(['error' => 'Source and target partitions cannot be identical.'], 422);
        }

        // 1. Determine if we are copying the whole month
        $isAllChannels = ($channelsInput === 'all' || (is_array($channelsInput) && in_array('all', $channelsInput)));

        // 2. Build the Source Query Safely
        $query = DB::table('schedule_templates')
            ->whereBetween('day_cycle', [$source + 1, $source + 99]);

        if (!$isAllChannels) {
            // Ensure inputs are an array, then convert all elements safely to integers
            $channelIds = is_array($channelsInput) ? $channelsInput : [$channelsInput];
            $channelIds = array_map('intval', $channelIds);

            $query->whereIn('channel_id', $channelIds);
        }

        $sourceRows = $query->get();

        // If there is nothing to copy, exit early before touching any target data
        if ($sourceRows->isEmpty()) {
            return response()->json(['error' => 'No schedule data found in the source month for the selected channels.'], 404);
        }

        // 3. Execute Core Data Migration
        try {
            DB::transaction(function () use ($sourceRows, $source, $target, $isAllChannels, $channelsInput) {

                // Setup target wipe query
                $wipeQuery = DB::table('schedule_templates')
                    ->whereBetween('day_cycle', [$target + 1, $target + 99]);

                if (!$isAllChannels) {
                    $channelIds = is_array($channelsInput) ? $channelsInput : [$channelsInput];
                    $channelIds = array_map('intval', $channelIds);

                    $wipeQuery->whereIn('channel_id', $channelIds);
                }

                // Wipe out previous records to avoid duplicate timing collisions
                $wipeQuery->delete();

                $newDataChunks = [];
                foreach ($sourceRows as $row) {
                    $relativeDay = $row->day_cycle - $source;
                    $newDayCycle = $relativeDay + $target;

                    $newDataChunks[] = [
                        'channel_id'       => $row->channel_id,
                        'day_cycle'        => $newDayCycle,
                        'title'            => $row->title,
                        'start_time'       => $row->start_time,
                        'end_time'         => $row->end_time,
                        'duration_seconds' => $row->duration_seconds,
                        'file_path'        => $row->file_path,
                        'created_at'       => now(),
                        'updated_at'       => now(),
                    ];
                }

                // Write matching tracks into database using 100-row chunks
                foreach (array_chunk($newDataChunks, 100) as $chunk) {
                    DB::table('schedule_templates')->insert($chunk);
                }
            });
        } catch (\Exception $e) {
            // Log the exact database error message locally so you can check laravel.log
            Log::error("Archive Sync Crash: " . $e->getMessage());
            return response()->json(['error' => 'Database transaction failed: ' . $e->getMessage()], 500);
        }

        // 4. Telemetry Logging
        $logSummary = $isAllChannels ? "ALL CHANNELS" : "CHANNELS: " . (is_array($channelsInput) ? implode(', ', $channelsInput) : $channelsInput);

        $this->writeTelemetryLog(
            message: "MIGRATION DISPATCHED: Cloned schedules from offset [{$source}] to [{$target}] ({$logSummary}). Count: {$sourceRows->count()}",
            type: "ARCHIVE",
            status: "success"
        );

        return response()->json([
            'message' => 'Data replication process completed successfully.',
            'cloned_count' => $sourceRows->count()
        ]);
    }
}
