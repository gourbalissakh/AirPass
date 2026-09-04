<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Comptes de démonstration : un par acteur du §4 du cahier des charges.
 */
class UtilisateurSeeder extends Seeder
{
    public function run(): void
    {
        $comptes = [
            ['name' => 'Administration Air Burkina', 'email' => 'admin@airburkina.bf', 'role' => 'admin'],
            ['name' => 'Agent comptoir Ouagadougou', 'email' => 'agent@airburkina.bf', 'role' => 'agent'],
            ['name' => 'Awa Traoré', 'email' => 'passager@example.com', 'role' => 'passager'],
        ];

        foreach ($comptes as $compte) {
            User::updateOrCreate(
                ['email' => $compte['email']],
                [...$compte, 'password' => Hash::make('password'), 'actif' => true],
            );
        }
    }
}
