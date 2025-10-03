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
            $table->string('health_status')->default('unknown')->after('image_url');
            $table->text('health_notes')->nullable()->after('health_status');
            $table->timestamp('last_health_check')->nullable()->after('health_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            $table->dropColumn(['health_status', 'health_notes', 'last_health_check']);
        });
    }
};
