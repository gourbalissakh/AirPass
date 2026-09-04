<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Changement de vol publié par l'administrateur (EF-9.3).
 */
class FlightEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'flight_id', 'type', 'ancienne_valeur', 'nouvelle_valeur',
        'message', 'publie_par', 'publie_le',
    ];

    protected function casts(): array
    {
        return ['publie_le' => 'datetime'];
    }

    public function flight(): BelongsTo
    {
        return $this->belongsTo(Flight::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(PassengerNotification::class);
    }
}
