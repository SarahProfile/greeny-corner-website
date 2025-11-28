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
        Schema::table('plants', function (Blueprint $table) {
            // English fields
            $table->json('plant_data_en')->nullable()->after('api_data');

            // Arabic fields
            $table->json('plant_data_ar')->nullable()->after('plant_data_en');

            // Add flag to track if Gemini data has been fetched
            $table->boolean('gemini_data_fetched')->default(false)->after('plant_data_ar');

            // Store the last time Gemini was called (to avoid re-fetching)
            $table->timestamp('gemini_fetched_at')->nullable()->after('gemini_data_fetched');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            $table->dropColumn(['plant_data_en', 'plant_data_ar', 'gemini_data_fetched', 'gemini_fetched_at']);
        });
    }
};
