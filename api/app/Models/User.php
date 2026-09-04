<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Compte Envol : passager, agent de comptoir ou administrateur (EF-9.5).
 *
 * Le mode invité (EF-1.3) ne crée aucun compte : un passager peut mener tout
 * son enregistrement sans jamais apparaître dans cette table.
 */
#[Fillable(['name', 'email', 'telephone', 'password', 'role', 'actif'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Valeurs par défaut portées par le modèle et non seulement par le
     * schéma : sans cela, une instance fraîchement créée n'a pas encore
     * « actif » en mémoire et le contrôle de rôle la rejetterait.
     */
    protected $attributes = [
        'role' => 'passager',
        'actif' => true,
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'actif' => 'boolean',
        ];
    }

    /** EF-1.4 — profils voyageurs rattachés au compte. */
    public function travelerProfiles(): HasMany
    {
        return $this->hasMany(TravelerProfile::class);
    }

    public function estAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function estAgent(): bool
    {
        return in_array($this->role, ['agent', 'admin'], true);
    }
}
