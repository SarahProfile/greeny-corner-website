<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plant_encyclopedia', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('scientific_name')->nullable()->index();
            $table->string('family')->nullable()->index();
            $table->string('genus')->nullable()->index();
            $table->text('origin')->nullable();
            $table->longText('description')->nullable();
            $table->longText('description_ar')->nullable();
            $table->json('common_names')->nullable();
            $table->json('care_info')->nullable();
            $table->json('growth_info')->nullable();
            $table->json('benefits')->nullable();
            $table->json('interesting_facts')->nullable();
            $table->text('toxicity')->nullable();
            $table->json('images')->nullable();
            $table->unsignedInteger('perenual_id')->nullable()->unique();
            $table->unsignedBigInteger('gbif_id')->nullable()->unique();
            $table->string('wikipedia_url', 500)->nullable();
            $table->json('sources')->nullable();
            $table->boolean('is_featured')->default(false)->index();
            $table->unsignedInteger('view_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plant_encyclopedia');
    }
};
