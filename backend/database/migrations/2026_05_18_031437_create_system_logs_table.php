<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_logs', function (Blueprint $table) {
            $table->id();
            $table->string('log_type')->default('SYS'); // UPLINK, MOD, AUTH, SYS
            $table->text('message');
            $table->string('channel_name')->nullable();
            $table->integer('day_cycle')->nullable();
            $table->string('status_level')->default('info'); // info, success, warning, critical
            $table->timestamps(); // Automatically creates created_at and updated_at

            // Indexing for faster telemetry feed queries
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_logs');
    }
};
