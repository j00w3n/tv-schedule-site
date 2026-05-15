<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RotateSchedules extends Command
{
    protected $signature = 'app:rotate-schedules';
    protected $description = 'Deploys grouped templates to the live broadcast table based on the date.';

    public function handle()
    {
        // 1. Get current date info in Malaysia Time
        $now = now()->timezone('Asia/Kuala_Lumpur');
        $todayDate = (int)$now->format('j'); // 1 to 31

        // 2. Map the 31 days into your 12 Groups
        $dateGroups = [
            1 => [1, 13, 25],
            2 => [2, 14, 26],
            3 => [3, 15, 27],
            4 => [4, 16, 28],
            5 => [5, 17, 29],
            6 => [6, 18, 30],
            7 => [7, 19, 31],
            8 => [8, 20],
            9 => [9, 21],
            10 => [10, 22],
            11 => [11, 23],
            12 => [12, 24]
        ];

        $baseGroup = 1;
        foreach ($dateGroups as $groupId => $dates) {
            if (in_array($todayDate, $dates)) {
                $baseGroup = $groupId;
                break;
            }
        }

        /**
         * 3. Logic for Month Transitions
         * We always look for the 0-series (1-12) as the "Live" data.
         * Prep data for next month should stay in 100+ until the 1st of that month.
         */
        $targetCycle = $baseGroup;

        $this->info("Date: " . $now->format('d M Y') . " | Group: $baseGroup | Deploying Cycle ID: $targetCycle");

        // 4. Wipe the live table
        DB::table('tv_schedules')->truncate();

        // 5. Fetch templates for this specific cycle
        $templates = DB::table('schedule_templates')
            ->where('day_cycle', $targetCycle)
            ->get();

        if ($templates->isEmpty()) {
            $this->error("ALERT: No templates found for Cycle ID $targetCycle. Monitoring will be IDLE.");
            return;
        }

        // 6. Bulk Insert for better performance
        $insertData = $templates->map(function ($item) {
            return [
                'channel_id' => $item->channel_id,
                'title'      => $item->title,
                'start_time' => $item->start_time,
                'end_time'   => $item->end_time,
                'duration_seconds' => $item->duration_seconds,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        })->toArray();

        foreach (array_chunk($insertData, 50) as $chunk) {
            DB::table('tv_schedules')->insert($chunk);
        }

        $this->info("Success! " . count($insertData) . " programs deployed to live NOC.");
    }
}
