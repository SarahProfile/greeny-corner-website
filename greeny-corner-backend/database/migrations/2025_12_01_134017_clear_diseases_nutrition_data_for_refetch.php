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
        // Clear existing diseases_info and nutrition_info data
        // This allows the system to re-fetch data in both languages
        \DB::table('plants')->update([
            'diseases_info' => null,
            'nutrition_info' => null,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
