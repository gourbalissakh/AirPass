<?php

namespace App\Models;

use App\Support\FenetreEnregistrement;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Un vol commercial. Porte sa propre fenêtre d'enregistrement (EF-9.2).
 */
class Flight extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero_vol', 'aircraft_type_id', 'origine', 'destination',
        'depart_prevu', 'arrivee_prevue', 'depart_estime', 'porte',
        'statut', 'checkin_ouverture_h', 'checkin_fermeture_h', 'publie',
    ];

    protected function casts(): array
    {
        return [
            'depart_prevu' => 'datetime',
            'arrivee_prevue' => 'datetime',
            'depart_estime' => 'datetime',
            'publie' => 'boolean',
        ];
    }

    public function aircraftType(): BelongsTo
    {
        return $this->belongsTo(AircraftType::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function seats(): HasMany
    {
        return $this->hasMany(Seat::class);
    }

    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(FlightEvent::class);
    }

    public function scopePublie(Builder $query): Builder
    {
        return $query->where('publie', true);
    }

    public function fenetreEnregistrement(): FenetreEnregistrement
    {
        return FenetreEnregistrement::pourVol($this);
    }

    /** Horaire de départ effectif : l'estimé s'il existe, sinon le prévu. */
    public function departEffectif(): \Illuminate\Support\Carbon
    {
        return $this->depart_estime ?? $this->depart_prevu;
    }

    public function trajet(): string
    {
        return $this->origine.' → '.$this->destination;
    }
}
