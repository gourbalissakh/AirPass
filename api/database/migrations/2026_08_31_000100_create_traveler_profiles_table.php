<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * EF-1.4 — un compte peut porter plusieurs profils voyageurs (famille).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('traveler_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('prenom');
            $table->date('date_naissance')->nullable();
            $table->string('nationalite', 3)->nullable();
            $table->string('numero_passeport')->nullable();
            $table->date('passeport_expiration')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'nom']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('traveler_profiles');
    }
};
