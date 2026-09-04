<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Support\Journal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

/**
 * Module 6.1 — comptes et authentification.
 *
 * Le mode invité (EF-1.3) ne passe pas par ici : il est traité par
 * RechercheVolController, qui n'exige aucun compte.
 */
class AuthController extends ApiController
{
    /** EF-1.1 — création de compte. */
    public function inscription(Request $requete): JsonResponse
    {
        $donnees = $requete->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $utilisateur = User::create([
            'name' => $donnees['name'],
            'email' => $donnees['email'],
            'telephone' => $donnees['telephone'] ?? null,
            'password' => Hash::make($donnees['password']),
            'role' => 'passager',
        ]);

        Journal::ecrire('compte.cree', $utilisateur, acteur: $utilisateur->email);

        return response()->json([
            'utilisateur' => $this->profil($utilisateur),
            'jeton' => $utilisateur->createToken('envol')->plainTextToken,
        ], 201);
    }

    /** EF-1.2 — connexion. */
    public function connexion(Request $requete): JsonResponse
    {
        $donnees = $requete->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $utilisateur = User::where('email', $donnees['email'])->first();

        if (! $utilisateur || ! Hash::check($donnees['password'], $utilisateur->password)) {
            return $this->erreur('Identifiants incorrects.', 401);
        }

        if (! $utilisateur->actif) {
            return $this->erreur('Ce compte est désactivé.', 403);
        }

        Journal::ecrire('compte.connexion', $utilisateur, acteur: $utilisateur->email);

        return response()->json([
            'utilisateur' => $this->profil($utilisateur),
            'jeton' => $utilisateur->createToken('envol')->plainTextToken,
        ]);
    }

    /** EF-1.2 — déconnexion (révoque le jeton courant). */
    public function deconnexion(Request $requete): JsonResponse
    {
        $requete->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }

    public function moi(Request $requete): JsonResponse
    {
        return response()->json(['utilisateur' => $this->profil($requete->user())]);
    }

    private function profil(User $utilisateur): array
    {
        return [
            'id' => $utilisateur->id,
            'nom' => $utilisateur->name,
            'email' => $utilisateur->email,
            'telephone' => $utilisateur->telephone,
            'role' => $utilisateur->role,
        ];
    }
}
