<?php

namespace App\Services;

use App\Models\CheckIn;

/**
 * EF-6.1 — carte d'embarquement numérique.
 *
 * Le contenu du QR code suit la logique du standard IATA BCBP (Bar Coded
 * Boarding Pass) sans en implémenter le format binaire complet : il porte
 * les données que l'agent doit pouvoir lire au comptoir (EF-8.1) et une
 * signature courte qui rend la carte non falsifiable.
 */
final class CarteEmbarquementService
{
    public function donnees(CheckIn $enregistrement): array
    {
        $enregistrement->loadMissing(['booking', 'flight.aircraftType', 'seat']);

        $vol = $enregistrement->flight;
        $reservation = $enregistrement->booking;

        return [
            'reference' => $enregistrement->reference,
            'statut' => $enregistrement->statut,
            'passager' => [
                'nom' => $reservation->nom,
                'prenom' => $reservation->prenom,
                'nom_complet' => $reservation->nomComplet(),
            ],
            'vol' => [
                'numero' => $vol->numero_vol,
                'origine' => $vol->origine,
                'destination' => $vol->destination,
                'depart_prevu' => $vol->depart_prevu->toIso8601String(),
                'depart_effectif' => $vol->departEffectif()->toIso8601String(),
                'porte' => $vol->porte,
                'statut' => $vol->statut,
                'embarquement' => $vol->departEffectif()->copy()->subMinutes(45)->toIso8601String(),
            ],
            'siege' => $enregistrement->seat?->code,
            'classe' => $reservation->classe,
            'pnr' => $reservation->pnr,
            'bagages' => [
                'nb' => $enregistrement->bagages_nb,
                'poids_estime' => $enregistrement->bagages_poids_estime,
            ],
            'qr' => $this->contenuQr($enregistrement),
        ];
    }

    /**
     * Chaîne encodée dans le QR code. Elle est volontairement lisible :
     * l'agent au comptoir peut la saisir à la main si le scan échoue.
     */
    public function contenuQr(CheckIn $enregistrement): string
    {
        return implode('|', [
            'ENVOL',
            $enregistrement->reference,
            $enregistrement->flight->numero_vol,
            $enregistrement->flight->depart_prevu->format('dMy'),
            $enregistrement->seat?->code ?? '---',
            substr($enregistrement->qr_jeton, 0, 12),
        ]);
    }
}
