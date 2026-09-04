<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Bagage pesé et étiqueté au comptoir (EF-8.3).
 */
class BaggageItem extends Model
{
    use HasFactory;

    protected $fillable = ['check_in_id', 'numero_etiquette', 'poids_reel', 'pese_par'];

    protected function casts(): array
    {
        return ['poids_reel' => 'float'];
    }

    public function checkIn(): BelongsTo
    {
        return $this->belongsTo(CheckIn::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pese_par');
    }
}
