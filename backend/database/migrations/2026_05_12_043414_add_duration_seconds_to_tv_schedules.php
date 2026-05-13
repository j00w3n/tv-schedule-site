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
        Schema::table('tv_schedules', function (Blueprint $table) {
            // Adding the missing column so the rotation can succeed
            $table->integer('duration_seconds')->nullable()->after('end_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tv_schedules', function (Blueprint $table) {
            //
        });
    }
};
