<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ImportTvSchedule extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:import-schedule {channel}';
    
    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    // app/Console/Commands/ImportTvSchedule.php

    public function handle()
    {
        $channelId = $this->argument('channel');

        // 1. DYNAMIC OFFSET CALCULATION: Read an option or argument passed from console
        // Example command run: php artisan schedule:import VIVTECH_MAIN --offset=100
        $monthOffset = (int) $this->option('offset', 0);

        $path = storage_path('app/schedule.txt');

        if (!file_exists($path)) {
            $this->error("File not found at $path");
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $importedCount = 0;
        $skippedCount = 0;
        $currentDay = 1 + $monthOffset; // Apply base starting window day directly

        // 2. SAFE PURGE: Only delete existing slots for this channel WITHIN this month's window range
        DB::table('schedule_templates')
            ->where('channel_id', $channelId)
            ->whereBetween('day_cycle', [$monthOffset + 1, $monthOffset + 299])
            ->delete();

        foreach ($lines as $index => $line) {
            $line = trim($line);

            // A. Detect Day Change: # [DAY : 10]
            if (str_contains($line, '[DAY :')) {
                preg_match('/DAY : (\d+)/', $line, $dayMatch);
                $rawDay = isset($dayMatch[1]) ? (int)$dayMatch[1] : 1;

                // Increment forward relative to your month offset window selection
                $currentDay = $rawDay + $monthOffset;
                continue;
            }

            // B. Find Metadata lines
            if (str_starts_with($line, '# [START TIME')) {

                // 1. Extract Duration and Filter Fillers
                preg_match('/DURATION : ([\d:]+)/', $line, $durMatch);
                $duration = $durMatch[1] ?? '00:00:00';

                $parts = explode(':', $duration);
                $seconds = ($parts[0] * 3600) + ($parts[1] * 60) + $parts[2];

                if ($seconds < 120) {
                    $skippedCount++;
                    continue;
                }

                // 2. Extract Times
                preg_match('/START TIME : ([\d:]+)/', $line, $startMatch);
                preg_match('/END TIME : ([\d:]+)/', $line, $endMatch);

                // 3. Get Title from next line
                if (isset($lines[$index + 1])) {
                    $filePath = trim($lines[$index + 1]);

                    if (!str_starts_with($filePath, '#')) {
                        $startTime = $startMatch[1] ?? null;
                        $endTime = $endMatch[1] ?? null;

                        $filename = pathinfo($filePath, PATHINFO_FILENAME);
                        $cleanTitle = str_replace(['mo', '.aes', 'ep', '_'], ['', '', ' Ep ', ' '], $filename);
                        $cleanTitle = preg_replace('/([a-z])([A-Z])/', '$1 $2', $cleanTitle);

                        $finalTitleKey = strtoupper(trim($cleanTitle));

                        if ($startTime && $endTime) {
                            // Insert into the MASTER TEMPLATE table
                            DB::table('schedule_templates')->insert([
                                'channel_id'       => $channelId,
                                'day_cycle'        => $currentDay, // Stores correctly as 101, 102, etc.
                                'title'            => $finalTitleKey,
                                'start_time'       => $startTime,
                                'end_time'         => $endTime,
                                'duration_seconds' => $seconds,
                                'file_path'        => $filePath,
                                'created_at'       => now(),
                                'updated_at'       => now(),
                            ]);
                            $importedCount++;

                            // Lock unique rows straight into the dictionary table
                            DB::table('program_dictionaries')->insertOrIgnore([
                                'title'       => $finalTitleKey,
                                'description' => '',
                                'created_at'  => now(),
                                'updated_at'  => now()
                            ]);
                        }
                    }
                }
            }
        }

        $this->info("CHANNEL $channelId (Offset: $monthOffset): Imported $importedCount programs. Purged $skippedCount fillers.");
    }
}
