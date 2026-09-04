<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Enregistrement d'un passager sur un vol (module 6.3 du cahier des charges).
 */
class CheckIn extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id', 'flight_id', 'seat_id', 'statut', 'actif', 'canal',
        'securite_confirmee', 'bagages_nb', 'bagages_poids_estime',
        'reference', 'qr_jeton', 'enregistre_le', 'embarque_le',
    ];

    protected $hidden = ['qr_jeton'];

    protected function casts(): array
    {
        return [
            'securite_confirmee' => 'boolean',
            'bagages_poids_estime' => 'float',
            'enregistre_le' => 'datetime',
            'embarque_le' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function flight(): BelongsTo
    {
        return $this->belongsTo(Flight::class);
    }

    public function seat(): BelongsTo
    {
        return $this->belongsTo(Seat::class);
    }

    public function baggageItems(): HasMany
    {
        return $this->hasMany(BaggageItem::class);
    }

    public function estFinalise(): bool
    {
        return in_array($this->statut, ['enregistre', 'embarque'], true);
    }
}
