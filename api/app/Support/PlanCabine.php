<?php

namespace App\Support;

use App\Models\AircraftType;
use App\Models\Flight;
use App\Models\Seat;

/**
 * EF-4.1 — matérialise, pour un vol, les sièges décrits par le plan de
 * cabine de son type d'appareil.
 *
 * Format attendu de aircraft_types.plan_cabine :
 *
 *   {
 *     "lettres": ["A","C","D","F"],
 *     "couloir_apres": "C",
 *     "blocs": [
 *       {"de":1,"a":2,"classe":"affaires","type":"premium"},
 *       {"de":3,"a":10,"classe":"economique","type":"standard"},
 *       {"de":11,"a":12,"classe":"economique","type":"issue_secours"}
 *     ],
 *     "bloques": ["19A","19F"]
 *   }
 */
final class PlanCabine
{
    public function __construct(private readonly AircraftType $type) {}

    public function definition(): array
    {
        return $this->type->plan_cabine;
    }

    /**
     * Crée en base les sièges du vol. Idempotent : ne fait rien si les
     * sièges existent déjà.
     *
     * @return int nombre de sièges créés
     */
    public function materialiserPour(Flight $vol): int
    {
        if ($vol->seats()->exists()) {
            return 0;
        }

        $plan = $this->definition();
        $lettres = $plan['lettres'];
        $bloques = $plan['bloques'] ?? [];
        $lignes = [];
        $maintenant = now();

        foreach ($plan['blocs'] as $bloc) {
            for ($rangee = $bloc['de']; $rangee <= $bloc['a']; $rangee++) {
                foreach ($lettres as $lettre) {
                    $code = $rangee.$lettre;

                    $lignes[] = [
                        'flight_id' => $vol->id,
                        'code' => $code,
                        'rangee' => $rangee,
                        'lettre' => $lettre,
                        'classe' => $bloc['classe'],
                        'type' => $bloc['type'],
                        'statut' => in_array($code, $bloques, true) ? 'bloque' : 'libre',
                        'created_at' => $maintenant,
                        'updated_at' => $maintenant,
                    ];
                }
            }
        }

        foreach (array_chunk($lignes, 200) as $paquet) {
            Seat::insert($paquet);
        }

        return count($lignes);
    }
}
