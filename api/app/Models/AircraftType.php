<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Type d'appareil de la flotte, porteur de son plan de cabine (EF-4.1).
 */
class AircraftType extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'nom', 'nb_sieges', 'plan_cabine'];

    protected function casts(): array
    {
        return ['plan_cabine' => 'array'];
    }

    public function flights(): HasMany
    {
        return $this->hasMany(Flight::class);
    }
}
