<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * EF-9.1, EF-9.2 — vols et fenêtre d'enregistrement paramétrable.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->string('numero_vol', 10);            // 2J201
            $table->foreignId('aircraft_type_id')->constrained();
            $table->char('origine', 3);                  // OUA
            $table->char('destination', 3);              // DSS
            $table->dateTime('depart_prevu');
            $table->dateTime('arrivee_prevue');
            $table->dateTime('depart_estime')->nullable();
            $table->string('porte', 10)->nullable();
            $table->enum('statut', [
                'programme', 'a_lheure', 'retarde', 'embarquement', 'parti', 'annule',
            ])->default('programme');
            // Fenêtre d'enregistrement en ligne, en heures avant le départ (EF-3.1).
            $table->unsignedSmallInteger('checkin_ouverture_h')->default(24);
            $table->unsignedSmallInteger('checkin_fermeture_h')->default(3);
            $table->boolean('publie')->default(false);
            $table->timestamps();

            $table->unique(['numero_vol', 'depart_prevu']);
            $table->index(['depart_prevu', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flights');
    }
};
