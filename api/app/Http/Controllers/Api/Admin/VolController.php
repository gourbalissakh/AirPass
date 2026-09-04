<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\AircraftType;
use App\Models\Flight;
use App\Support\Journal;
use App\Support\PlanCabine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * EF-9.1, EF-9.2 — création, paramétrage et publication des vols.
 */
class VolController extends ApiController
{
    public function index(Request $requete): JsonResponse
    {
        $vols = Flight::with('aircraftType')
            ->withCount([
                'checkIns as enregistres_count' => fn ($q) => $q
                    ->whereIn('statut', ['enregistre', 'embarque']),
                'bookings as reservations_count',
            ])
            ->orderBy('depart_prevu')
            ->paginate(25);

        return response()->json($vols);
    }

    public function store(Request $requete): JsonResponse
    {
        $donnees = $this->valider($requete);

        $vol = Flight::create($donnees);

        // EF-4.1 — les sièges du vol sont dérivés du plan de cabine du type.
        $crees = (new PlanCabine($vol->aircraftType))->materialiserPour($vol);

        Journal::ecrire('vol.cree', $vol, ['sieges_crees' => $crees]);

        return response()->json([
            'vol' => $vol->load('aircraftType'),
            'sieges_crees' => $crees,
        ], 201);
    }

    public function update(Request $requete, Flight $vol): JsonResponse
    {
        $vol->update($this->valider($requete, $vol));

        Journal::ecrire('vol.modifie', $vol);

        return response()->json($vol->load('aircraftType'));
    }

    /** Un vol non publié reste invisible des passagers. */
    public function publier(Flight $vol): JsonResponse
    {
        (new PlanCabine($vol->aircraftType))->materialiserPour($vol);

        $vol->update(['publie' => true]);

        Journal::ecrire('vol.publie', $vol);

        return response()->json(['message' => "Vol {$vol->numero_vol} publié."]);
    }

    public function typesAppareil(): JsonResponse
    {
        return response()->json(AircraftType::orderBy('code')->get());
    }

    private function valider(Request $requete, ?Flight $vol = null): array
    {
        return $requete->validate([
            'numero_vol' => [$vol ? 'sometimes' : 'required', 'string', 'max:10'],
            'aircraft_type_id' => [$vol ? 'sometimes' : 'required', 'exists:aircraft_types,id'],
            'origine' => [$vol ? 'sometimes' : 'required', 'string', 'size:3'],
            'destination' => [$vol ? 'sometimes' : 'required', 'string', 'size:3'],
            'depart_prevu' => [$vol ? 'sometimes' : 'required', 'date'],
            'arrivee_prevue' => [$vol ? 'sometimes' : 'required', 'date', 'after:depart_prevu'],
            'porte' => ['nullable', 'string', 'max:10'],
            'checkin_ouverture_h' => ['nullable', 'integer', 'min:1', 'max:168'],
            'checkin_fermeture_h' => ['nullable', 'integer', 'min:0', 'max:24'],
        ]);
    }
}
