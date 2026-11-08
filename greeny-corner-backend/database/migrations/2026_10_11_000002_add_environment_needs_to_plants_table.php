<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            // Per-species ideal light / humidity (JSON), looked up once per plant and cached.
            if (!Schema::hasColumn('plants', 'environment_needs')) {
                $table->text('environment_needs')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            $table->dropColumn('environment_needs');
        });
    }
};
