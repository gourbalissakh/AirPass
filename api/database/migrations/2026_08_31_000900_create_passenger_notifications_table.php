<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * EF-7.2, EF-7.3 — envois aux passagers.
 *
 * Table nommée « passenger_notifications » pour ne pas entrer en conflit
 * avec la table « notifications » du framework.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('passenger_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flight_event_id')->nullable()
                ->constrained()->cascadeOnDelete();
            $table->foreignId('check_in_id')->nullable()
                ->constrained()->cascadeOnDelete();
            $table->enum('canal', ['push', 'email', 'sms']);
            $table->string('destinataire');
            $table->string('sujet');
            $table->text('contenu');
            $table->enum('statut', ['en_attente', 'envoye', 'echoue'])
                ->default('en_attente');
            $table->dateTime('envoye_le')->nullable();
            $table->timestamps();

            $table->index(['statut', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('passenger_notifications');
    }
};
