<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Gemini;

class ScheduleImportController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'channel_id' => 'required|integer',
            'schedule_file' => 'required|file',
        ]);

        $channelId = $request->channel_id;
        $content = file_get_contents($request->file('schedule_file')->getRealPath());
        $fileName = $request->file('schedule_file')->getClientOriginalName();

        // 1. Split into blocks based on "Start time:"
        // We use a case-insensitive split
        $blocks = preg_split('/(?=Start time:)/i', $content, -1, PREG_SPLIT_NO_EMPTY);

        // DEBUG: If this is empty, the file doesn't contain "Start time:"
        if (empty($blocks)) {
            dd("Error: No 'Start time:' labels found in file.");
        }

        $finalData = [];
        $currentDay = 1;

        foreach ($blocks as $block) {
            // Extract lines and clean them
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
                    // Splits title from duration (they are usually on the same line)
                    $parts = preg_split('/Duration:/i', $line);
                    $title = trim($parts[0]);
                    preg_match('/\d+/', $parts[1], $durMatch);
                    $duration = isset($durMatch[0]) ? (int)$durMatch[0] : 0;
                } elseif (stripos($line, 'End time:') !== false) {
                    $endTime = trim(str_ireplace('End time:', '', $line));
                }
            }

            if ($startTime && $title) {
                // Convert to 24h format
                $start24 = date("H:i:s", strtotime($startTime));
                $end24 = $endTime ? date("H:i:s", strtotime($endTime)) : $start24;

                // Clean Title
                $cleanTitle = preg_replace('/\bEp\s+\d+\b/i', '', $title);
                $cleanTitle = preg_replace('/\bS\d+\b/i', '', $cleanTitle);
                $cleanTitle = trim(strtoupper(preg_replace('/\s+/', ' ', $cleanTitle)));

                $finalData[] = [
                    'channel_id'       => $channelId,
                    'day_cycle'        => $currentDay,
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

        // 2. DATABASE INSERT
        if (!empty($finalData)) {
            DB::transaction(function () use ($finalData, $channelId) {
                DB::table('schedule_templates')->where('channel_id', $channelId)->delete();

                // Insert in chunks of 50 to avoid SQL length limits
                foreach (array_chunk($finalData, 50) as $chunk) {
                    DB::table('schedule_templates')->insert($chunk);
                }
            });

            // 3. Sync to live table
            \Illuminate\Support\Facades\Artisan::call('app:rotate-schedules');

            return back()->with('message', "Successfully imported " . count($finalData) . " programs.");
        }

        dd("Error: Parser finished but found 0 valid programs. Check your text format.");
    }
}
