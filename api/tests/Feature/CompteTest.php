<?php

namespace Tests\Feature;

/**
 * Recette du module 6.1 — Compte & authentification.
 */
class CompteTest extends RecetteTestCase
{
    /** EF-1.1 — création de compte. */
    public function test_ef_1_1_inscription(): void
    {
        $this->postJson('/api/auth/inscription', [
            'name' => 'Awa Traoré',
            'email' => 'awa.traore@example.com',
            'telephone' => '+22670112233',
            'password' => 'motdepasse123',
            'password_confirmation' => 'motdepasse123',
        ])
            ->assertCreated()
            ->assertJsonPath('utilisateur.role', 'passager')
            ->assertJsonStructure(['jeton']);
    }

    /** EF-1.2 — connexion et déconnexion. */
    public function test_ef_1_2_connexion_et_deconnexion(): void
    {
        $utilisateur = \App\Models\User::create([
            'name' => 'Awa', 'email' => 'awa@example.com',
            'password' => bcrypt('motdepasse123'), 'role' => 'passager',
        ]);

        $jeton = $this->postJson('/api/auth/connexion', [
            'email' => 'awa@example.com',
            'password' => 'motdepasse123',
        ])->assertOk()->json('jeton');

        $this->withHeader('Authorization', "Bearer $jeton")
            ->getJson('/api/auth/moi')
            ->assertOk()
            ->assertJsonPath('utilisateur.email', 'awa@example.com');

        $this->withHeader('Authorization', "Bearer $jeton")
            ->postJson('/api/auth/deconnexion')
            ->assertOk();
    }

    /** EF-1.2 — mauvais mot de passe refusé. */
    public function test_ef_1_2_identifiants_incorrects(): void
    {
        \App\Models\User::create([
            'name' => 'Awa', 'email' => 'awa@example.com',
            'password' => bcrypt('motdepasse123'), 'role' => 'passager',
        ]);

        $this->postJson('/api/auth/connexion', [
            'email' => 'awa@example.com',
            'password' => 'mauvais',
        ])->assertUnauthorized();
    }

    /** EF-9.5 — un compte désactivé ne peut plus se connecter. */
    public function test_ef_9_5_compte_desactive(): void
    {
        \App\Models\User::create([
            'name' => 'Ancien agent', 'email' => 'ancien@airburkina.bf',
            'password' => bcrypt('motdepasse123'), 'role' => 'agent', 'actif' => false,
        ]);

        $this->postJson('/api/auth/connexion', [
            'email' => 'ancien@airburkina.bf',
            'password' => 'motdepasse123',
        ])->assertForbidden();
    }
}
