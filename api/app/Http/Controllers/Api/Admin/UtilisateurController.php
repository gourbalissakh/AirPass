<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\User;
use App\Support\Journal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

/**
 * EF-9.5 — gestion des droits des agents et des administrateurs.
 */
class UtilisateurController extends ApiController
{
    public function index(): JsonResponse
    {
        return response()->json(
            User::whereIn('role', ['agent', 'admin'])
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'telephone', 'role', 'actif'])
        );
    }

    public function store(Request $requete): JsonResponse
    {
        $donnees = $requete->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', 'in:agent,admin'],
            'password' => ['required', Password::min(8)],
        ]);

        $utilisateur = User::create([
            ...$donnees,
            'password' => Hash::make($donnees['password']),
        ]);

        Journal::ecrire('utilisateur.cree', $utilisateur,
            ['role' => $utilisateur->role], acteur: $requete->user()->email);

        return response()->json($utilisateur->only(['id', 'name', 'email', 'role']), 201);
    }

    public function update(Request $requete, User $utilisateur): JsonResponse
    {
        $donnees = $requete->validate([
            'role' => ['sometimes', 'in:passager,agent,admin'],
            'actif' => ['sometimes', 'boolean'],
        ]);

        $utilisateur->update($donnees);

        Journal::ecrire('utilisateur.modifie', $utilisateur, $donnees,
            acteur: $requete->user()->email);

        return response()->json($utilisateur->only(['id', 'name', 'email', 'role', 'actif']));
    }
}
