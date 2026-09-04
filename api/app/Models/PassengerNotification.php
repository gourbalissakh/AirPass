<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Notification envoyée à un passager (EF-7.2).
 */
class PassengerNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'flight_event_id', 'check_in_id', 'canal', 'destinataire',
        'sujet', 'contenu', 'statut', 'envoye_le',
    ];

    protected function casts(): array
    {
        return ['envoye_le' => 'datetime'];
    }

    public function flightEvent(): BelongsTo
    {
        return $this->belongsTo(FlightEvent::class);
    }

    public function checkIn(): BelongsTo
    {
        return $this->belongsTo(CheckIn::class);
    }
}
