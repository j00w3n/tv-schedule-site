<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('schedule_templates', function (Blueprint $table) {
            $table->id();
            $table->integer('channel_id'); // 1 to 11
            $table->integer('day_cycle'); // 1 to 12
            $table->string('title');
            $table->string('episode')->nullable();
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('duration_seconds'); // For filtering fillers
            $table->string('file_path');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_templates');
    }
};
