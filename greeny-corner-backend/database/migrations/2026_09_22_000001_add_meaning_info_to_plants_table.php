<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            if (!Schema::hasColumn('plants', 'meaning_info')) {
                $table->text('meaning_info')->nullable()->after('fertilizer_info');
            }
        });
    }

    public function down(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            $table->dropColumn('meaning_info');
        });
    }
};
