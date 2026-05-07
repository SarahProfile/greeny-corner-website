<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            if (!Schema::hasColumn('plants', 'health_status')) {
                $table->string('health_status')->nullable()->after('image_url');
            }
            if (!Schema::hasColumn('plants', 'health_notes')) {
                $table->text('health_notes')->nullable()->after('health_status');
            }
            if (!Schema::hasColumn('plants', 'last_health_check')) {
                $table->timestamp('last_health_check')->nullable()->after('health_notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            $table->dropColumn(['health_status', 'health_notes', 'last_health_check']);
        });
    }
};
