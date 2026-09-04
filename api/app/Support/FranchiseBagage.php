<?php

namespace App\Support;

use App\Models\Booking;

/**
 * EF-5.1, EF-5.3 — franchise bagages du billet et détection du dépassement.
 *
 * Le paiement en ligne des excédents est explicitement hors périmètre de la
 * version 1 (§3.2 du cahier des charges) : on se contente d'informer le
 * passager qu'un supplément sera à régler au comptoir.
 */
final class FranchiseBagage
{
    public function __construct(
        public readonly int $nbAutorise,
        public readonly int $kgParPiece,
    ) {}

    public static function pourReservation(Booking $reservation): self
    {
        return new self($reservation->franchise_nb, $reservation->franchise_kg);
    }

    public function poidsTotalAutorise(): int
    {
        return $this->nbAutorise * $this->kgParPiece;
    }

    public function depassement(int $nbDeclare, float $poidsDeclare): ?array
    {
        $piecesEnTrop = max(0, $nbDeclare - $this->nbAutorise);
        $kgEnTrop = max(0, $poidsDeclare - $this->poidsTotalAutorise());

        if ($piecesEnTrop === 0 && $kgEnTrop <= 0) {
            return null;
        }

        return [
            'pieces_en_trop' => $piecesEnTrop,
            'kg_en_trop' => round($kgEnTrop, 1),
            'message' => 'Votre déclaration dépasse la franchise incluse dans '
                .'votre billet. Un supplément vous sera demandé au comptoir '
                ."d'enregistrement.",
        ];
    }

    public function toArray(): array
    {
        return [
            'nb_autorise' => $this->nbAutorise,
            'kg_par_piece' => $this->kgParPiece,
            'poids_total_autorise' => $this->poidsTotalAutorise(),
        ];
    }
}
