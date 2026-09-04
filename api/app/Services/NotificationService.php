<?php

namespace App\Services;

use App\Models\Flight;
use App\Models\FlightEvent;
use App\Models\PassengerNotification;

/**
 * EF-7.2 — notification des passagers lors d'un changement de vol.
 *
 * Le prototype enregistre les envois en base plutôt que de les émettre
 * réellement : brancher un fournisseur push / e-mail / SMS revient à
 * consommer la file « en_attente ».
 */
final class NotificationService
{
    /** Notifie tous les passagers enregistrés sur le vol concerné. */
    public function diffuser(FlightEvent $evenement): int
    {
        $vol = $evenement->flight;

        $destinataires = $vol->checkIns()
            ->whereIn('statut', ['en_cours', 'enregistre'])
            ->with('booking')
            ->get();

        $envois = 0;

        foreach ($destinataires as $enregistrement) {
            foreach ($this->canauxPour($enregistrement->booking) as $canal => $destinataire) {
                PassengerNotification::create([
                    'flight_event_id' => $evenement->id,
                    'check_in_id' => $enregistrement->id,
                    'canal' => $canal,
                    'destinataire' => $destinataire,
                    'sujet' => $this->sujet($vol, $evenement),
                    'contenu' => $evenement->message,
                    'statut' => 'en_attente',
                ]);
                $envois++;
            }
        }

        return $envois;
    }

    private function canauxPour($reservation): array
    {
        $canaux = [];

        if ($reservation->email) {
            $canaux['email'] = $reservation->email;
        }

        if ($reservation->telephone) {
            $canaux['sms'] = $reservation->telephone;
        }

        return $canaux ?: ['push' => 'appareil-'.$reservation->pnr];
    }

    private function sujet(Flight $vol, FlightEvent $evenement): string
    {
        $libelle = match ($evenement->type) {
            'retard' => 'Retard',
            'porte' => 'Changement de porte',
            'annulation' => 'Annulation',
            'horaire' => "Changement d'horaire",
        };

        return "$libelle — vol {$vol->numero_vol} ({$vol->trajet()})";
    }
}
