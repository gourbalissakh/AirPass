<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\AuditLog;
use App\Models\CheckIn;
use App\Models\Flight;
use Illuminate\Http\JsonResponse;

/**
 * EF-9.4 — indicateurs d'usage.
 *
 * Ces chiffres alimentent directement les critères de réussite du §13 du
 * cahier des charges : taux d'adoption de l'enregistrement en ligne et
 * répartition par canal.
 */
class TableauBordController extends ApiController
{
    public function __invoke(): JsonResponse
    {
        $volsAVenir = Flight::publie()
            ->where('depart_prevu', '>', now())
            ->orderBy('depart_prevu')
            ->withCount([
                'bookings as reservations_count',
                'checkIns as enregistres_count' => fn ($q) => $q
                    ->whereIn('statut', ['enregistre', 'embarque']),
                'checkIns as en_ligne_count' => fn ($q) => $q
                    ->whereIn('statut', ['enregistre', 'embarque'])
                    ->whereIn('canal', ['web', 'mobile']),
            ])
            ->limit(20)
            ->get()
            ->map(function (Flight $v) {
                $fenetre = $v->fenetreEnregistrement();

                return [
                    'numero' => $v->numero_vol,
                    'trajet' => $v->trajet(),
                    'origine' => $v->origine,
                    'destination' => $v->destination,
                    'depart' => $v->depart_prevu->toIso8601String(),
                    'depart_effectif' => $v->departEffectif()->toIso8601String(),
                    'porte' => $v->porte,
                    'statut' => $v->statut,
                    'reservations' => $v->reservations_count,
                    'enregistres' => $v->enregistres_count,
                    'en_ligne' => $v->en_ligne_count,
                    'taux_en_ligne' => $v->reservations_count > 0
                        ? round($v->en_ligne_count / $v->reservations_count * 100, 1)
                        : 0.0,
                    // Permet de dessiner la fenêtre d'enregistrement sur une
                    // frise, et de voir d'un coup d'œil ce qui va se clôturer.
                    'enregistrement' => $fenetre->toArray(),
                ];
            });

        $total = CheckIn::whereIn('statut', ['enregistre', 'embarque'])->count();
        $enLigne = CheckIn::whereIn('statut', ['enregistre', 'embarque'])
            ->whereIn('canal', ['web', 'mobile'])->count();

        return response()->json([
            'synthese' => [
                'enregistrements_total' => $total,
                'enregistrements_en_ligne' => $enLigne,
                'enregistrements_guichet' => $total - $enLigne,
                'taux_en_ligne' => $total > 0 ? round($enLigne / $total * 100, 1) : 0.0,
                'vols_publies' => Flight::publie()->where('depart_prevu', '>', now())->count(),
            ],
            'vols' => $volsAVenir,
            'journal' => AuditLog::latest('created_at')->limit(20)->get()
                ->map(fn (AuditLog $l) => [
                    'horodatage' => $l->created_at?->toIso8601String(),
                    'acteur' => $l->acteur,
                    'action' => $l->action,
                    'entite' => $l->entite,
                    'entite_id' => $l->entite_id,
                ]),
        ]);
    }
}
