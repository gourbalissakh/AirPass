<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EF-9.5 — restreint une route aux rôles indiqués : middleware('role:admin').
 */
class VerifierRole
{
    public function handle(Request $requete, Closure $suivant, string ...$roles): Response
    {
        $utilisateur = $requete->user();

        if (! $utilisateur || ! $utilisateur->actif || ! in_array($utilisateur->role, $roles, true)) {
            return response()->json(
                ['message' => "Vous n'avez pas les droits nécessaires."],
                403
            );
        }

        return $suivant($requete);
    }
}
