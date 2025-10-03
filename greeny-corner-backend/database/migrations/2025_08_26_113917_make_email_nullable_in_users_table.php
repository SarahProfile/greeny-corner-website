<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the existing unique constraint first
            $table->dropUnique(['email']);
            
            // Make email nullable
            $table->string('email')->nullable()->change();
        });
        
        // For MySQL, we'll handle uniqueness at the application level since MySQL doesn't support partial indexes
        // The unique constraint will be handled by validation in the User model
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No custom index to drop in MySQL version
        
        Schema::table('users', function (Blueprint $table) {
            // Make email required again and add unique constraint
            $table->string('email')->nullable(false)->unique()->change();
        });
    }
};
