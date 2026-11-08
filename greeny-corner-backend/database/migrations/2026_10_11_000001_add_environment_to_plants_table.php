<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            // What the plant actually gets where it lives (user-reported or camera-measured).
            // Compared in the app against the light / humidity the species prefers.
            if (!Schema::hasColumn('plants', 'light_level')) {
                $table->string('light_level', 16)->nullable();
            }
            if (!Schema::hasColumn('plants', 'humidity_level')) {
                $table->string('humidity_level', 16)->nullable();
            }
            if (!Schema::hasColumn('plants', 'environment_updated_at')) {
                $table->timestamp('environment_updated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            $table->dropColumn(['light_level', 'humidity_level', 'environment_updated_at']);
        });
    }
};
