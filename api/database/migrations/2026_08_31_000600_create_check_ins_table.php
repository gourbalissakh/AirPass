<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 6.3 — enregistrements.
 *
 * EF-3.4 (pas de double enregistrement) est garanti par l'index unique
 * (booking_id, actif) : « actif » vaut 1 tant que l'enregistrement est
 * valide et NULL une fois annulé. MySQL autorisant plusieurs NULL dans un
 * index unique, un passager peut annuler puis se réenregistrer, mais jamais
 * avoir deux enregistrements actifs sur le même vol.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('check_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('flight_id')->constrained()->cascadeOnDelete();
            $table->foreignId('seat_id')->nullable()->constrained()->nullOnDelete();

            // « en_cours » = parcours entamé mais carte pas encore émise.
            $table->enum('statut', ['en_cours', 'enregistre', 'annule', 'embarque'])
                ->default('en_cours');
            $table->unsignedTinyInteger('actif')->nullable()->default(1);

            $table->enum('canal', ['web', 'mobile', 'guichet'])->default('web');
            $table->boolean('securite_confirmee')->default(false);   // EF-3.3

            // Bagages déclarés en ligne (EF-5.2, EF-5.4).
            $table->unsignedTinyInteger('bagages_nb')->default(0);
            $table->decimal('bagages_poids_estime', 5, 1)->default(0);

            // Carte d'embarquement (EF-6.1).
            $table->string('reference', 12)->unique();
            $table->string('qr_jeton', 64)->unique();

            $table->dateTime('enregistre_le')->nullable();
            $table->dateTime('embarque_le')->nullable();
            $table->timestamps();

            $table->unique(['booking_id', 'actif']);
            $table->index(['flight_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('check_ins');
    }
};
