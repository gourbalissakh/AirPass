<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Profil voyageur rattaché à un compte (EF-1.4).
 */
class TravelerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'nom', 'prenom', 'date_naissance', 'nationalite',
        'numero_passeport', 'passeport_expiration',
    ];

    protected function casts(): array
    {
        return [
            'date_naissance' => 'date',
            'passeport_expiration' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
