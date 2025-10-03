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
        Schema::table('care_schedules', function (Blueprint $table) {
            // Add fertilizing schedule fields
            $table->integer('fertilizing_interval_days')->nullable()->default(30);
            $table->timestamp('next_fertilizing_date')->nullable();
            
            // Add tilling schedule fields
            $table->integer('tilling_interval_days')->nullable()->default(90);
            $table->timestamp('next_tilling_date')->nullable();
            
            // Add last activity timestamps for tracking
            $table->timestamp('last_watered_date')->nullable();
            $table->timestamp('last_fertilized_date')->nullable();
            $table->timestamp('last_tilled_date')->nullable();
            
            // Add notification preferences
            $table->boolean('watering_notifications_enabled')->default(true);
            $table->boolean('fertilizing_notifications_enabled')->default(true);
            $table->boolean('tilling_notifications_enabled')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('care_schedules', function (Blueprint $table) {
            $table->dropColumn([
                'fertilizing_interval_days',
                'next_fertilizing_date',
                'tilling_interval_days', 
                'next_tilling_date',
                'last_watered_date',
                'last_fertilized_date',
                'last_tilled_date',
                'watering_notifications_enabled',
                'fertilizing_notifications_enabled',
                'tilling_notifications_enabled'
            ]);
        });
    }
};
