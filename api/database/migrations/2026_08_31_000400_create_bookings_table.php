<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * EF-2.1, EF-2.2, EF-5.1 — réservations (PNR).
 *
 * En version 1 cette table tient lieu de DCS local (§8.2 du cahier des
 * charges) : elle est alimentée par import en attendant l'accès au système
 * de réservation réel d'Air Burkina.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('pnr', 6);
            $table->foreignId('flight_id')->constrained()->cascadeOnDelete();

            // Identité du passager telle qu'enregistrée à la réservation.
            $table->string('nom');
            $table->string('prenom');
            $table->date('date_naissance')->nullable();
            $table->string('nationalite', 3)->nullable();
            $table->string('numero_passeport')->nullable();
            $table->date('passeport_expiration')->nullable();
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();

            $table->enum('classe', ['economique', 'affaires'])->default('economique');

            // Franchise bagages applicable au billet (EF-5.1).
            $table->unsignedTinyInteger('franchise_nb')->default(1);
            $table->unsignedSmallInteger('franchise_kg')->default(23);

            $table->timestamps();

            $table->unique(['pnr', 'flight_id']);
            $table->index(['flight_id', 'nom']);
            $table->index('numero_passeport');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
