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
            $table->string('scientific_name')->nullable()->after('name');
            $table->integer('perenual_id')->nullable()->after('scientific_name');
            $table->index('scientific_name');
            $table->index('perenual_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            $table->dropIndex(['scientific_name']);
            $table->dropIndex(['perenual_id']);
            $table->dropColumn(['scientific_name', 'perenual_id']);
        });
    }
};
