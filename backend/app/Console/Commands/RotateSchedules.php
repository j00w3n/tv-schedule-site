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
        $now = now()->timezone('Asia/Kuala_Lumpur');
        $todayDate = (int)$now->format('j'); // 25

        // 1. Calculate rotation index day (Evaluates to 1 today)
        $rotationDay = (($todayDate - 1) % 12) + 1;

        $this->info("Date: " . $now->format('d M Y') . " | Executing Rotation Template Day: $rotationDay");

        // 2. Wipe the live monitor table clear
        DB::table('tv_schedules')->truncate();

        // 3. Query your master 1-12 templates pool directly
        $templates = DB::table('schedule_templates')
            ->where('day_cycle', $rotationDay)
            ->get();

        if ($templates->isEmpty()) {
            $this->error("ALERT: No templates found for Rotation Day $rotationDay.");
            return;
        }

        // 4. Ingest dataset entries
        $insertData = $templates->map(function ($item) {
            return [
                'channel_id'       => $item->channel_id,
                'title'            => $item->title,
                'start_time'       => $item->start_time,
                'end_time'         => $item->end_time,
                'duration_seconds' => $item->duration_seconds,
                'created_at'       => now(),
                'updated_at'       => now(),
            ];
        })->toArray();

        foreach (array_chunk($insertData, 50) as $chunk) {
            DB::table('tv_schedules')->insert($chunk);
        }

        $this->info("Success! " . count($insertData) . " programs deployed to live NOC.");
    }
}
