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
        SystemLog::create([
            'log_type'     => $type,
            'message'      => $message,
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
            'day_cycle'     => 'required|integer', // Manual Day Cycle selection
            'schedule_file' => 'nullable|file',
            'schedule_text' => 'nullable|string',
        ]);

        $channelId = $request->channel_id;
        // In app/Http/Controllers/YourController.php
        $dayCycle = $request->day_cycle;
        $fileName  = '';
        
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
            message: "Data payload successfully synchronized.",
            type: "UPLINK",
            status: "success",
            channel: $channelId, // e.g., VIVTECH_MAIN
            cycle: $dayCycle       // e.g., 101
        );

        // 3. PARSING LOGIC
        // Split into blocks based on "Start time:" (Case Insensitive)
        $blocks = preg_split('/(?=Start time:)/i', $content, -1, PREG_SPLIT_NO_EMPTY);

        if (empty($blocks)) {
            return back()->with('error', "No valid program headers (Start time:) found in the input.");
        }

        $finalData = [];

        foreach ($blocks as $block) {
            $lines = explode("\n", trim($block));
            $startTime = null;
            $title = null;
            $duration = 0;
            $endTime = null;

            foreach ($lines as $line) {
                $line = trim($line);
                if (stripos($line, 'Start time:') !== false) {
                    $startTime = trim(str_ireplace('Start time:', '', $line));
                } elseif (stripos($line, 'Duration:') !== false) {
                    $parts = preg_split('/Duration:/i', $line);
                    $title = trim($parts[0]);
                    preg_match('/\d+/', $parts[1] ?? '', $durMatch);
                    $duration = isset($durMatch[0]) ? (int)$durMatch[0] : 0;
                } elseif (stripos($line, 'End time:') !== false) {
                    $endTime = trim(str_ireplace('End time:', '', $line));
                }
            }

            if ($startTime && $title) {
                // Formatting data
                $start24 = date("H:i:s", strtotime($startTime));
                $end24   = $endTime ? date("H:i:s", strtotime($endTime)) : $start24;

                // Clean and Upper Case Title (Tactical Look)
                $cleanTitle = preg_replace('/\bEp\s+\d+\b/i', '', $title);
                $cleanTitle = preg_replace('/\bS\d+\b/i', '', $cleanTitle);
                $cleanTitle = trim(strtoupper(preg_replace('/\s+/', ' ', $cleanTitle)));

                $finalData[] = [
                    'channel_id'       => $channelId,
                    'day_cycle'        => $dayCycle, // Using the manual input from form
                    'title'            => $cleanTitle,
                    'start_time'       => $start24,
                    'end_time'         => $end24,
                    'duration_seconds' => $duration * 60,
                    'file_path'        => $fileName,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ];
            }
        }

        // 4. DATABASE SYNC
        if (!empty($finalData)) {
            DB::transaction(function () use ($finalData, $channelId, $dayCycle) {
                // Delete existing templates for THIS channel AND THIS specific day cycle
                DB::table('schedule_templates')
                    ->where('channel_id', $channelId)
                    ->where('day_cycle', $dayCycle)
                    ->delete();

                foreach (array_chunk($finalData, 50) as $chunk) {
                    DB::table('schedule_templates')->insert($chunk);
                }
            });

            // 5. Trigger Rotation to update Live Table immediately
            Artisan::call('app:rotate-schedules');

            return back()->with('message', "Successfully synced Cycle $dayCycle for Channel $channelId.");
        }
        return back()->with('error', 'Parser failed to extract valid data.');
    }
}
