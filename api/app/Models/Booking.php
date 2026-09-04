<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Réservation (PNR). En version 1 cette table tient lieu de DCS local.
 */
class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'pnr', 'flight_id', 'nom', 'prenom', 'date_naissance', 'nationalite',
        'numero_passeport', 'passeport_expiration', 'email', 'telephone',
        'classe', 'franchise_nb', 'franchise_kg',
    ];

    protected function casts(): array
    {
        return [
            'date_naissance' => 'date',
            'passeport_expiration' => 'date',
        ];
    }

    public function flight(): BelongsTo
    {
        return $this->belongsTo(Flight::class);
    }

    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    public function enregistrementActif(): ?CheckIn
    {
        return $this->checkIns()->where('actif', 1)->first();
    }

    public function nomComplet(): string
    {
        return trim($this->prenom.' '.$this->nom);
    }

    /** Âge du passager le jour du vol, ou null si la date est inconnue. */
    public function age(): ?int
    {
        if (! $this->date_naissance) {
            return null;
        }

        return (int) $this->date_naissance->diffInYears($this->flight->depart_prevu);
    }
}
