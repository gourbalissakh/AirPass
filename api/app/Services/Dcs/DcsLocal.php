<?php

namespace App\Services\Dcs;

use App\Models\Booking;
use App\Models\CheckIn;
use App\Support\Journal;

/**
 * Implémentation locale de la passerelle DCS (§8.2 du cahier des charges).
 *
 * L'accès au système de réservation réel d'Air Burkina n'étant pas
 * disponible, les réservations sont tenues dans la table « bookings »,
 * alimentée par import. Les remontées de statut sont journalisées : elles
 * deviendront des appels d'API le jour où le DCS réel sera raccordé.
 */
final class DcsLocal implements DcsGateway
{
    public function trouverParVolEtPasseport(string $numeroVol, string $passeport): ?Booking
    {
        return Booking::query()
            ->whereHas('flight', fn ($q) => $q
                ->where('numero_vol', strtoupper($numeroVol))
                ->where('publie', true)
                ->where('depart_prevu', '>', now()->subDay()))
            ->where('numero_passeport', strtoupper($passeport))
            ->with('flight.aircraftType')
            ->first();
    }

    public function trouverParPnrEtNom(string $pnr, string $nom): ?Booking
    {
        return Booking::query()
            ->where('pnr', strtoupper($pnr))
            // Comparaison en minuscules : contrairement à UPPER, LOWER laisse
            // les caractères accentués intacts aussi bien côté SQL que côté
            // PHP, ce qui fait correspondre « Traoré » et « traoré ».
            ->whereRaw('LOWER(nom) = ?', [mb_strtolower($nom)])
            ->whereHas('flight', fn ($q) => $q
                ->where('publie', true)
                ->where('depart_prevu', '>', now()->subDay()))
            ->with('flight.aircraftType')
            ->first();
    }

    public function remonterEnregistrement(CheckIn $enregistrement): void
    {
        Journal::ecrire('dcs.enregistrement_remonte', $enregistrement, [
            'reference' => $enregistrement->reference,
            'siege' => $enregistrement->seat?->code,
        ]);
    }

    public function remonterAnnulation(CheckIn $enregistrement): void
    {
        Journal::ecrire('dcs.annulation_remontee', $enregistrement, [
            'reference' => $enregistrement->reference,
        ]);
    }
}
