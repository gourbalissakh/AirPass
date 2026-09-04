<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * EF-4.2, EF-4.3 — sièges d'un vol et verrou temporaire de sélection.
 *
 * Les sièges sont matérialisés vol par vol (et non par type d'avion) : c'est
 * ce qui permet d'afficher la disponibilité réelle et de poser un verrou.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flight_id')->constrained()->cascadeOnDelete();
            $table->string('code', 4);                   // 12A
            $table->unsignedSmallInteger('rangee');
            $table->char('lettre', 1);
            $table->enum('classe', ['economique', 'affaires'])->default('economique');
            $table->enum('type', [
                'standard', 'issue_secours', 'espace_sup', 'premium',
            ])->default('standard');
            $table->enum('statut', ['libre', 'verrouille', 'occupe', 'bloque'])
                ->default('libre');

            // Verrou temporaire posé pendant la transaction de sélection.
            $table->string('verrou_jeton', 64)->nullable();
            $table->dateTime('verrou_expire_le')->nullable();

            $table->timestamps();

            $table->unique(['flight_id', 'code']);
            $table->index(['flight_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seats');
    }
};
