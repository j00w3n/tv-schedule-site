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
        Schema::create('program_dictionaries', function (Blueprint $table) {
            $table->id();
            $table->string('title')->unique(); // Must be unique so we don't duplicate titles
            $table->text('description');
            $table->timestamps();

            // Optimize for lookups on the uppercase string
            $table->index('title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_dictionaries');
    }
};
