<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * EF-9.3 — changements de vol publiés par l'administrateur, qui déclenchent
 * les notifications aux passagers concernés (EF-7.2).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flight_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flight_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['retard', 'porte', 'annulation', 'horaire']);
            $table->string('ancienne_valeur')->nullable();
            $table->string('nouvelle_valeur')->nullable();
            $table->text('message');
            $table->foreignId('publie_par')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('publie_le');
            $table->timestamps();

            $table->index(['flight_id', 'publie_le']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flight_events');
    }
};
