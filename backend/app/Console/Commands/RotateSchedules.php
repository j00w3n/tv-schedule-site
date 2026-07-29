<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RotateSchedules extends Command
{
    protected $signature = 'app:rotate-schedules {--date= : Simulate a specific date (YYYY-MM-DD)}';
    protected $description = 'Deploys grouped templates to the live broadcast table based on the date.';

    public function handle()
    {
        $dateStr = $this->option('date');
        $now = $dateStr ? \Carbon\Carbon::parse($dateStr)->timezone('Asia/Kuala_Lumpur') : now()->timezone('Asia/Kuala_Lumpur');
        $todayDate = (int)$now->format('j'); // 25

        // 1. Calculate rotation index day (Evaluates to 1 today)
        $rotationDay = (($todayDate - 1) % 12) + 1;

        // Calculate absolute month offset since May 2026 (Anchor)
        $anchorYear = 2026;
        $anchorMonth = 5; // May

        $currentYear = (int)$now->format('Y');
        $currentMonth = (int)$now->format('n');

        $diffMonths = ($currentYear - $anchorYear) * 12 + ($currentMonth - $anchorMonth);
        $monthOffset = $diffMonths * 100;

        $targetDayCycle = $rotationDay + $monthOffset;

        $this->info("Date: " . $now->format('d M Y') . " | Target Rotation Template Day: $targetDayCycle (Base rotation: $rotationDay, Month offset: $monthOffset)");

        // 2. Wipe the live monitor table clear
        DB::table('tv_schedules')->truncate();

        // 3. Query templates pool matching the target offset day
        $templates = DB::table('schedule_templates')
            ->where('day_cycle', $targetDayCycle)
            ->get();

        // Fallback: If current month has no templates, fall back to base rotation (offset 0)
        if ($templates->isEmpty() && $monthOffset > 0) {
            $this->warn("No templates found for Day $targetDayCycle. Falling back to base rotation Day $rotationDay.");
            $templates = DB::table('schedule_templates')
                ->where('day_cycle', $rotationDay)
                ->get();
        }

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
