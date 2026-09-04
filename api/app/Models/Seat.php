<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Siège matérialisé pour un vol donné (EF-4.2, EF-4.3).
 */
class Seat extends Model
{
    use HasFactory;

    protected $fillable = [
        'flight_id', 'code', 'rangee', 'lettre', 'classe', 'type',
        'statut', 'verrou_jeton', 'verrou_expire_le',
    ];

    protected function casts(): array
    {
        return ['verrou_expire_le' => 'datetime'];
    }

    public function flight(): BelongsTo
    {
        return $this->belongsTo(Flight::class);
    }

    /** Un verrou expiré ne bloque plus personne. */
    public function verrouExpire(): bool
    {
        return $this->statut === 'verrouille'
            && $this->verrou_expire_le !== null
            && $this->verrou_expire_le->isPast();
    }

    public function estDisponiblePour(?string $jeton = null): bool
    {
        return match ($this->statut) {
            'libre' => true,
            'verrouille' => $this->verrouExpire() || ($jeton !== null && $this->verrou_jeton === $jeton),
            default => false,
        };
    }
}
