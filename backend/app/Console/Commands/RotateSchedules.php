<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;


class RotateSchedules extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:rotate-schedules';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Today is May 12, so this will be 12
        $cycleDay = ((now()->day - 1) % 12) + 1;

        $this->info("Starting rotation for Cycle Day: $cycleDay");

        // 1. Wipe the live table
        DB::table('tv_schedules')->truncate();

        // 2. Fetch the 90 rows you confirmed in Workbench
        $templates = DB::table('schedule_templates')
            ->where('day_cycle', $cycleDay)
            ->get();

        $this->info("Found " . $templates->count() . " templates to deploy.");

        if ($templates->isEmpty()) {
            $this->error("No templates found for day $cycleDay. Check your database!");
            return;
        }

        // 3. Insert into tv_schedules
        foreach ($templates as $item) {
            DB::table('tv_schedules')->insert([
                'channel_id' => $item->channel_id, // Map the channel from template to live
                'title'      => $item->title,
                'start_time' => $item->start_time,
                'end_time'   => $item->end_time,
                'duration_seconds' => $item->duration_seconds,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->info("Success! 90 rows deployed to tv_schedules.");
    }
}
