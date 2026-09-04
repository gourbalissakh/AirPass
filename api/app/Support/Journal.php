<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * Exigence non fonctionnelle « Journalisation / Traçabilité » : toute action
 * sensible est horodatée avec l'identifiant de son auteur.
 *
 * Le passager en mode invité n'a pas de compte : on journalise alors une
 * description lisible (« invité — PNR ABC123 »).
 */
final class Journal
{
    public static function ecrire(
        string $action,
        ?Model $entite = null,
        array $payload = [],
        ?string $acteur = null,
    ): AuditLog {
        $utilisateur = Auth::user();

        return AuditLog::create([
            'user_id' => $utilisateur?->id,
            'acteur' => $acteur ?? ($utilisateur?->email ?? 'invité'),
            'action' => $action,
            'entite' => $entite ? class_basename($entite) : null,
            'entite_id' => $entite?->getKey(),
            'payload' => $payload ?: null,
            'ip' => Request::ip(),
            'created_at' => now(),
        ]);
    }
}
