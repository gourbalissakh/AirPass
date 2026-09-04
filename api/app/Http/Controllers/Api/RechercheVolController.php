<?php

namespace App\Http\Controllers\Api;

use App\Services\Dcs\DcsGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Module 6.2 — retrouver sa réservation.
 *
 * EF-1.3 : aucune authentification n'est requise. Le passager s'identifie
 * par (numéro de vol + numéro de passeport) ou par (PNR + nom).
 */
class RechercheVolController extends ApiController
{
    public function __construct(private readonly DcsGateway $dcs) {}

    public function __invoke(Request $requete): JsonResponse
    {
        $donnees = $requete->validate([
            'numero_vol' => ['required_without:pnr', 'nullable', 'string', 'max:10'],
            'numero_passeport' => ['required_with:numero_vol', 'nullable', 'string', 'max:40'],
            'pnr' => ['required_without:numero_vol', 'nullable', 'string', 'size:6'],
            'nom' => ['required_with:pnr', 'nullable', 'string', 'max:120'],
        ]);

        // EF-2.2 — la vérification passe systématiquement par la passerelle DCS.
        $reservation = isset($donnees['pnr'])
            ? $this->dcs->trouverParPnrEtNom($donnees['pnr'], $donnees['nom'])
            : $this->dcs->trouverParVolEtPasseport(
                $donnees['numero_vol'],
                $donnees['numero_passeport']
            );

        if (! $reservation) {
            // EF-2.4 — message clair, sans révéler si c'est le vol ou
            // l'identifiant qui est en cause.
            return $this->erreur(
                "Aucune réservation ne correspond à ces informations. "
                ."Vérifiez votre numéro de vol et votre numéro de passeport, "
                ."ou contactez Air Burkina.",
                404
            );
        }

        $vol = $reservation->flight;
        $fenetre = $vol->fenetreEnregistrement();
        $enregistrement = $reservation->enregistrementActif();

        return response()->json([
            'reservation' => [
                'pnr' => $reservation->pnr,
                'passager' => $reservation->nomComplet(),
                'classe' => $reservation->classe,
                'franchise' => [
                    'nb' => $reservation->franchise_nb,
                    'kg' => $reservation->franchise_kg,
                ],
                'informations_manquantes' => $this->informationsManquantes($reservation),
            ],
            'vol' => [
                'numero' => $vol->numero_vol,
                'origine' => $vol->origine,
                'destination' => $vol->destination,
                'depart_prevu' => $vol->depart_prevu->toIso8601String(),
                'depart_effectif' => $vol->departEffectif()->toIso8601String(),
                'porte' => $vol->porte,
                'statut' => $vol->statut,
                'appareil' => $vol->aircraftType->nom,
            ],
            // EF-2.3 — état de la fenêtre d'enregistrement.
            'enregistrement' => $fenetre->toArray(),
            'dossier_existant' => $enregistrement ? [
                'reference' => $enregistrement->reference,
                'statut' => $enregistrement->statut,
                'jeton' => $enregistrement->qr_jeton,
            ] : null,
        ]);
    }

    /** EF-3.2 — champs que le passager devra compléter. */
    private function informationsManquantes($reservation): array
    {
        $manquantes = [];

        foreach ([
            'date_naissance' => 'date de naissance',
            'nationalite' => 'nationalité',
            'numero_passeport' => 'numéro de passeport',
            'passeport_expiration' => 'date d\'expiration du passeport',
        ] as $champ => $libelle) {
            if (! $reservation->$champ) {
                $manquantes[] = ['champ' => $champ, 'libelle' => $libelle];
            }
        }

        return $manquantes;
    }
}
