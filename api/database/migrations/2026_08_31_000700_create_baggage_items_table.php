<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * EF-8.3 — bagages effectivement pesés et étiquetés au comptoir.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('baggage_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('check_in_id')->constrained()->cascadeOnDelete();
            $table->string('numero_etiquette', 20)->unique();
            $table->decimal('poids_reel', 5, 1);
            $table->foreignId('pese_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('baggage_items');
    }
};
