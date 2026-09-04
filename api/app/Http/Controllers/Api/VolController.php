<?php

namespace App\Http\Controllers\Api;

use App\Models\Flight;
use Illuminate\Http\JsonResponse;

/**
 * EF-7.1 — consultation du statut d'un vol par le passager.
 */
class VolController extends ApiController
{
    public function statut(string $numero): JsonResponse
    {
        $vol = Flight::publie()
            ->where('numero_vol', strtoupper($numero))
            ->where('depart_prevu', '>', now()->subDay())
            ->orderBy('depart_prevu')
            ->with('aircraftType')
            ->first();

        if (! $vol) {
            return $this->erreur("Vol introuvable pour aujourd'hui.", 404);
        }

        $dernier = $vol->events()->latest('publie_le')->first();

        return response()->json([
            'numero' => $vol->numero_vol,
            'origine' => $vol->origine,
            'destination' => $vol->destination,
            'depart_prevu' => $vol->depart_prevu->toIso8601String(),
            'depart_effectif' => $vol->departEffectif()->toIso8601String(),
            'porte' => $vol->porte,
            'statut' => $vol->statut,
            'appareil' => $vol->aircraftType->nom,
            'enregistrement' => $vol->fenetreEnregistrement()->toArray(),
            'dernier_changement' => $dernier ? [
                'type' => $dernier->type,
                'message' => $dernier->message,
                'publie_le' => $dernier->publie_le->toIso8601String(),
            ] : null,
        ]);
    }
}
