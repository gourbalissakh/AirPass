<?php

namespace App\Services\Dcs;

use App\Models\Booking;
use App\Models\CheckIn;

/**
 * Exigence non fonctionnelle « Interopérabilité » et §8.2 du cahier des
 * charges.
 *
 * Toute la lecture des réservations et la remontée du statut
 * d'enregistrement passe par cette interface. En version 1 elle est
 * implémentée localement (DcsLocal) ; brancher le DCS réel d'Air Burkina ou
 * de son prestataire d'escale ne demandera qu'une nouvelle implémentation,
 * sans toucher aux contrôleurs ni aux services métier.
 */
interface DcsGateway
{
    /** EF-2.1 — recherche par numéro de vol et numéro de passeport. */
    public function trouverParVolEtPasseport(string $numeroVol, string $passeport): ?Booking;

    /** EF-2.1 — recherche par PNR et nom de famille. */
    public function trouverParPnrEtNom(string $pnr, string $nom): ?Booking;

    /** Remonte au DCS le statut d'enregistrement d'un passager. */
    public function remonterEnregistrement(CheckIn $enregistrement): void;

    /** Remonte au DCS l'annulation d'un enregistrement (EF-3.5). */
    public function remonterAnnulation(CheckIn $enregistrement): void;
}
