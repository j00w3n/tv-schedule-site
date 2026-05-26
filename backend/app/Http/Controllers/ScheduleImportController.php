<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use App\Models\SystemLog;

class ScheduleImportController extends Controller
{
    protected function writeTelemetryLog(string $message, string $type = 'SYS', string $status = 'info', ?string $channel = null, ?int $cycle = null)
    {
        $timestamp = now()->timezone('Asia/Kuala_Lumpur')->format('Y-m-d H:i:s');
        $formattedMessage = "[$timestamp] " . $message;
        SystemLog::create([
            'log_type'     => $type,
            'message'      => $formattedMessage,
            'channel_name' => $channel,
            'day_cycle'    => $cycle,
            'status_level' => $status,
        ]);
    }

    public function store(Request $request)
    {
        // 1. Validation: Either a file OR a text string must be present
        $request->validate([
            'channel_id'    => 'required|integer',
            'day_cycle'     => 'required|integer', // Manual Day Cycle selection from form UI
            'schedule_file' => 'nullable|file',
            'schedule_text' => 'nullable|string',
        ]);

        $channelId = $request->channel_id;
        $rawDayCycle = (int)$request->day_cycle; // The raw number selected (e.g., 18 or 118)

        // ==========================================
        // 12-DAY ROTATION MODULO MATRIX PROCESSING
        // ==========================================
        // Isolate partition windows (0 for May, 100 for June, 200 for July)
        $monthOffset = floor($rawDayCycle / 100) * 100;
        $relativeDay = $rawDayCycle % 100;

        if ($relativeDay === 0 && $rawDayCycle > 0) {
            $relativeDay = 100;
            $monthOffset = $monthOffset - 100;
        }

        // Apply modulo formula: Day 18 converts cleanly to Day 6
        $baseRelativeDay = (($relativeDay - 1) % 12) + 1;

        // Final target key mapping for database slots (e.g., Day 6, or Day 106 for June)
        $dayCycle = $baseRelativeDay + $monthOffset;
        // ==========================================

        $fileName = '';

        // 2. Source Identification
        if ($request->filled('schedule_text')) {
            $content = $request->schedule_text;
            $fileName = "MANUAL_PASTE_" . now()->format('Ymd_His');
        } elseif ($request->hasFile('schedule_file')) {
            $content = file_get_contents($request->file('schedule_file')->getRealPath());
            $fileName = $request->file('schedule_file')->getClientOriginalName();
        } else {
            return back()->with('error', 'Please provide either a file or paste the schedule text.');
        }

        $this->writeTelemetryLog(
            message: "Data payload synchronized. Normalizing input Day {$rawDayCycle} to active rotation track Day {$dayCycle}.",
            type: "UPLINK",
            status: "success",
            channel: $channelId,
            cycle: $dayCycle
        );

        // 3. PARSING LOGIC (Tailored for: Start time -> Title -> Duration layouts)
        // Split text cleanly wherever "Start time:" appears case-insensitively
        $blocks = preg_split('/(?=Start time:)/i', $content, -1, PREG_SPLIT_NO_EMPTY);

        if (empty($blocks)) {
            return back()->with('error', "No valid program entries found matching 'Start time:'.");
        }

        $finalData = [];
        $uniqueTitlesInUpload = [];

        foreach ($blocks as $block) {
            $lines = explode("\n", trim($block));

            // Clean up empty tracking spaces or line jumps
            $lines = array_values(array_filter(array_map('trim', $lines)));

            // A valid structural show entry must contain exactly 3 targeted text rows
            if (count($lines) < 3) {
                continue;
            }

            $startTimeRaw = str_ireplace('Start time:', '', $lines[0]);
            $titleRaw     = $lines[1];
            $durationRaw  = str_ireplace('Duration:', '', $lines[2]);

            if (!empty($startTimeRaw) && !empty($titleRaw) && !empty($durationRaw)) {

                // 1. Convert human strings like "7pm" cleanly to standard 24H "19:00:00"
                $timestamp = strtotime(trim($startTimeRaw));
                if (!$timestamp) {
                    continue;
                }
                $start24 = date("H:i:s", $timestamp);

                // 2. Extract and parse numeric minutes out of text (e.g. "47min" -> 47)
                preg_match('/\d+/', $durationRaw, $minuteMatch);
                $minutes = isset($minuteMatch[0]) ? (int)$minuteMatch[0] : 0;
                $durationSeconds = $minutes * 60;

                // THE PURGE: Skip short commercial filler segments under 2 minutes
                if ($durationSeconds < 120) {
                    continue;
                }

                // 3. Generate the end time by adding the duration to the start timestamp
                $end24 = date("H:i:s", $timestamp + $durationSeconds);

                // 4. Clean and Normalize Title capitalization mapping strings
                $cleanTitle = preg_replace('/\bEp\s+\d+\b/i', '', $titleRaw);
                $cleanTitle = preg_replace('/\bS\d+\b/i', '', $cleanTitle);
                $finalTitleKey = trim(strtoupper(preg_replace('/\s+/', ' ', $cleanTitle)));

                $finalData[] = [
                    'channel_id'       => $channelId,
                    'day_cycle'        => $dayCycle,
                    'title'            => $finalTitleKey,
                    'start_time'       => $start24,
                    'end_time'         => $end24,
                    'duration_seconds' => $durationSeconds,
                    'file_path'        => $fileName,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ];

                $uniqueTitlesInUpload[$finalTitleKey] = true;
            }
        }

        // 4. DATABASE TRANSACTION SYNC
        if (!empty($finalData)) {
            DB::transaction(function () use ($finalData, $channelId, $dayCycle, $uniqueTitlesInUpload) {
                // Delete previous logs matching this specific normalized partition cycle window
                DB::table('schedule_templates')
                    ->where('channel_id', $channelId)
                    ->where('day_cycle', $dayCycle)
                    ->delete();

                // Chunked bulk insert
                foreach (array_chunk($finalData, 50) as $chunk) {
                    DB::table('schedule_templates')->insert($chunk);
                }

                // AUTOMATION ARCHITECTURE: Update master dictionary table on the fly
                foreach (array_keys($uniqueTitlesInUpload) as $titleKey) {
                    DB::table('program_dictionaries')->insertOrIgnore([
                        'title'       => $titleKey,
                        'description' => '',
                        'created_at'  => now(),
                        'updated_at'  => now()
                    ]);
                }
            });

            // 5. Trigger Rotation to update Live Table immediately
            Artisan::call('app:rotate-schedules');

            return back()->with('message', "Successfully synced and mapped entries onto Master Cycle $dayCycle.");
        }

        return back()->with('error', 'Parser failed to extract valid structured data tracks.');
    }
}
