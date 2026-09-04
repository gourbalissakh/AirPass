<?php

namespace Database\Seeders;

use App\Models\AircraftType;
use Illuminate\Database\Seeder;

/**
 * EF-4.1 — flotte et plans de cabine.
 *
 * Le plan est décrit par blocs de rangées, ce qui permet d'ajouter un
 * appareil sans écrire une ligne de code : seule cette donnée change.
 */
class FlotteSeeder extends Seeder
{
    public function run(): void
    {
        AircraftType::updateOrCreate(['code' => 'E170'], [
            'nom' => 'Embraer 170',
            'nb_sieges' => 76,
            'plan_cabine' => [
                'lettres' => ['A', 'C', 'D', 'F'],
                'couloir_apres' => 'C',
                'blocs' => [
                    ['de' => 1, 'a' => 2, 'classe' => 'affaires', 'type' => 'premium'],
                    ['de' => 3, 'a' => 10, 'classe' => 'economique', 'type' => 'standard'],
                    ['de' => 11, 'a' => 12, 'classe' => 'economique', 'type' => 'issue_secours'],
                    ['de' => 13, 'a' => 19, 'classe' => 'economique', 'type' => 'standard'],
                ],
                // Dernière rangée non inclinable, laissée à l'équipage.
                'bloques' => ['19A', '19F'],
            ],
        ]);

        AircraftType::updateOrCreate(['code' => 'E195'], [
            'nom' => 'Embraer 195',
            'nb_sieges' => 116,
            'plan_cabine' => [
                'lettres' => ['A', 'C', 'D', 'F'],
                'couloir_apres' => 'C',
                'blocs' => [
                    ['de' => 1, 'a' => 3, 'classe' => 'affaires', 'type' => 'premium'],
                    ['de' => 4, 'a' => 14, 'classe' => 'economique', 'type' => 'standard'],
                    ['de' => 15, 'a' => 16, 'classe' => 'economique', 'type' => 'issue_secours'],
                    ['de' => 17, 'a' => 29, 'classe' => 'economique', 'type' => 'standard'],
                ],
                'bloques' => ['29A', '29F'],
            ],
        ]);
    }
}
