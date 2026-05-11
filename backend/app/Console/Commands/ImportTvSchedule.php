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
    protected $signature = 'app:import-tv-schedule';

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
        $path = storage_path('app/schedule.txt');

        if (!file_exists($path)) {
            $this->error("File not found at $path");
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $importedCount = 0;

        foreach ($lines as $index => $line) {
            $line = trim($line);

            // 1. Find lines that start with # [START TIME
            if (str_starts_with($line, '# [START TIME')) {

                // 2. Extract start and end times
                preg_match('/START TIME : ([\d:]+)/', $line, $startMatch);
                preg_match('/END TIME : ([\d:]+)/', $line, $endMatch);

                // 3. The program title is always on the VERY NEXT line
                if (isset($lines[$index + 1])) {
                    $filePath = trim($lines[$index + 1]);

                    // Double check it's a file path and not another metadata line
                    if (!str_starts_with($filePath, '#')) {
                        $startTime = $startMatch[1] ?? null;
                        $endTime = $endMatch[1] ?? null;

                        // Clean the filename for the UI
                        $filename = pathinfo($filePath, PATHINFO_FILENAME);
                        $cleanTitle = str_replace(['mo', '.aes', 'ep', '_'], ['', '', ' Ep ', ' '], $filename);
                        $cleanTitle = preg_replace('/([a-z])([A-Z])/', '$1 $2', $cleanTitle);

                        if ($startTime && $endTime) {
                            DB::table('tv_schedules')->insert([
                                'title'      => trim($cleanTitle),
                                'episode'    => 'Broadcast Segment',
                                'start_time' => $startTime,
                                'end_time'   => $endTime,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                            $importedCount++;
                        }
                    }
                }
            }
        }

        $this->info("SUCCESS: Imported $importedCount segments.");
    }
}
