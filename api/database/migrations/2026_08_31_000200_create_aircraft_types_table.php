<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * EF-4.1 et §8.2 du cahier des charges — le plan de cabine est stocké par
 * type d'avion, afin de s'adapter à la flotte sans redéveloppement.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aircraft_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();            // E170, E195...
            $table->string('nom');                       // « Embraer 170 »
            $table->unsignedSmallInteger('nb_sieges');
            // Rangées, lettres, classes et rangées d'issue de secours.
            $table->json('plan_cabine');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aircraft_types');
    }
};
