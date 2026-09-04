<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Flight;
use App\Models\FlightEvent;
use App\Services\NotificationService;
use App\Support\Journal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * EF-9.3 — publication d'un changement de vol, qui déclenche les
 * notifications aux passagers concernés (EF-7.2).
 */
class ChangementVolController extends ApiController
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function store(Request $requete, Flight $vol): JsonResponse
    {
        $donnees = $requete->validate([
            'type' => ['required', 'in:retard,porte,annulation,horaire'],
            'nouvelle_valeur' => ['nullable', 'string', 'max:120'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        [$ancienne, $nouvelle] = $this->appliquer($vol, $donnees);

        $evenement = FlightEvent::create([
            'flight_id' => $vol->id,
            'type' => $donnees['type'],
            'ancienne_valeur' => $ancienne,
            'nouvelle_valeur' => $nouvelle,
            'message' => $donnees['message'] ?? $this->messageParDefaut($vol, $donnees['type'], $nouvelle),
            'publie_par' => $requete->user()->id,
            'publie_le' => now(),
        ]);

        $envois = $this->notifications->diffuser($evenement);

        Journal::ecrire('vol.changement_publie', $vol, [
            'type' => $donnees['type'],
            'notifications' => $envois,
        ], acteur: $requete->user()->email);

        return response()->json([
            'evenement' => $evenement,
            'notifications_envoyees' => $envois,
        ], 201);
    }

    /** Applique le changement au vol et renvoie [ancienne, nouvelle] valeur. */
    private function appliquer(Flight $vol, array $donnees): array
    {
        return match ($donnees['type']) {
            'porte' => [
                $vol->porte,
                tap($donnees['nouvelle_valeur'], fn ($v) => $vol->update(['porte' => $v])),
            ],
            'retard', 'horaire' => [
                $vol->departEffectif()->toIso8601String(),
                tap($donnees['nouvelle_valeur'], fn ($v) => $vol->update([
                    'depart_estime' => $v,
                    'statut' => $donnees['type'] === 'retard' ? 'retarde' : $vol->statut,
                ])),
            ],
            'annulation' => [
                $vol->statut,
                tap('annule', fn () => $vol->update(['statut' => 'annule'])),
            ],
        };
    }

    private function messageParDefaut(Flight $vol, string $type, ?string $valeur): string
    {
        $numero = $vol->numero_vol;

        return match ($type) {
            'porte' => "Votre vol $numero embarquera porte $valeur.",
            'retard' => "Votre vol $numero est retardé. Nouveau départ estimé : "
                .\Illuminate\Support\Carbon::parse($valeur)->translatedFormat('d/m/Y à H:i').'.',
            'horaire' => "L'horaire de votre vol $numero a changé. Nouveau départ : "
                .\Illuminate\Support\Carbon::parse($valeur)->translatedFormat('d/m/Y à H:i').'.',
            'annulation' => "Votre vol $numero est annulé. Les équipes Air Burkina "
                .'vous recontactent pour un réacheminement.',
        };
    }
}
