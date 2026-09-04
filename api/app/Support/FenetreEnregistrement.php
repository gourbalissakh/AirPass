<?php

namespace App\Support;

use App\Models\Flight;
use Illuminate\Support\Carbon;

/**
 * EF-3.1, EF-2.3 — fenêtre pendant laquelle l'enregistrement en ligne est
 * possible pour un vol donné.
 *
 * Les bornes sont calculées à partir du départ prévu et des deux réglages
 * du vol (ouverture / fermeture, en heures), eux-mêmes initialisés depuis
 * config/envol.php.
 */
final class FenetreEnregistrement
{
    public const PAS_ENCORE_OUVERT = 'pas_encore_ouvert';
    public const OUVERT = 'ouvert';
    public const FERME = 'ferme';

    private function __construct(
        public readonly Carbon $ouverture,
        public readonly Carbon $fermeture,
    ) {}

    public static function pourVol(Flight $vol): self
    {
        $depart = $vol->depart_prevu;

        return new self(
            ouverture: $depart->copy()->subHours($vol->checkin_ouverture_h),
            fermeture: $depart->copy()->subHours($vol->checkin_fermeture_h),
        );
    }

    public function etat(?Carbon $a = null): string
    {
        $a ??= Carbon::now();

        return match (true) {
            $a->lt($this->ouverture) => self::PAS_ENCORE_OUVERT,
            $a->gt($this->fermeture) => self::FERME,
            default => self::OUVERT,
        };
    }

    public function estOuverte(?Carbon $a = null): bool
    {
        return $this->etat($a) === self::OUVERT;
    }

    /** Message destiné au passager (EF-2.3, EF-2.4). */
    public function message(?Carbon $a = null): string
    {
        return match ($this->etat($a)) {
            self::PAS_ENCORE_OUVERT => "L'enregistrement en ligne ouvrira le "
                .$this->ouverture->translatedFormat('d/m/Y à H:i').'.',
            self::FERME => "L'enregistrement en ligne pour ce vol est clôturé "
                .'depuis le '.$this->fermeture->translatedFormat('d/m/Y à H:i')
                .". Présentez-vous au comptoir d'Air Burkina.",
            default => "L'enregistrement en ligne est ouvert jusqu'au "
                .$this->fermeture->translatedFormat('d/m/Y à H:i').'.',
        };
    }

    public function toArray(?Carbon $a = null): array
    {
        return [
            'etat' => $this->etat($a),
            'ouverture' => $this->ouverture->toIso8601String(),
            'fermeture' => $this->fermeture->toIso8601String(),
            'message' => $this->message($a),
        ];
    }
}
