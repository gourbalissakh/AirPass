<?php

namespace App\Http\Controllers\Api;

use App\Models\CheckIn;
use App\Services\CarteEmbarquementService;
use App\Services\Dcs\DcsGateway;
use App\Services\EnregistrementService;
use App\Services\SiegeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Modules 6.3 à 6.6 — parcours d'enregistrement du passager.
 *
 * Le dossier est manipulé via son « jeton » (qr_jeton), remis au passager
 * au démarrage : c'est ce qui permet le mode invité sans compte (EF-1.3)
 * tout en gardant la référence publique (AP-XXXXXX) courte et lisible.
 */
class EnregistrementController extends ApiController
{
    public function __construct(
        private readonly EnregistrementService $enregistrements,
        private readonly SiegeService $sieges,
        private readonly CarteEmbarquementService $cartes,
        private readonly DcsGateway $dcs,
    ) {}

    /** Ouvre le parcours d'enregistrement pour une réservation. */
    public function demarrer(Request $requete): JsonResponse
    {
        $donnees = $requete->validate([
            'numero_vol' => ['required_without:pnr', 'nullable', 'string', 'max:10'],
            'numero_passeport' => ['required_with:numero_vol', 'nullable', 'string', 'max:40'],
            'pnr' => ['required_without:numero_vol', 'nullable', 'string', 'size:6'],
            'nom' => ['required_with:pnr', 'nullable', 'string', 'max:120'],
            'canal' => ['nullable', 'in:web,mobile'],
        ]);

        $reservation = isset($donnees['pnr'])
            ? $this->dcs->trouverParPnrEtNom($donnees['pnr'], $donnees['nom'])
            : $this->dcs->trouverParVolEtPasseport(
                $donnees['numero_vol'],
                $donnees['numero_passeport']
            );

        if (! $reservation) {
            return $this->erreur('Réservation introuvable.', 404);
        }

        try {
            $enregistrement = $this->enregistrements->demarrer(
                $reservation,
                $donnees['canal'] ?? 'web'
            );
        } catch (RuntimeException $e) {
            return $this->erreur($e->getMessage(), 409);
        }

        return response()->json([
            'reference' => $enregistrement->reference,
            'jeton' => $enregistrement->qr_jeton,
            'statut' => $enregistrement->statut,
        ], 201);
    }

    /** Récapitulatif du dossier en cours. */
    public function afficher(CheckIn $enregistrement): JsonResponse
    {
        return response()->json($this->cartes->donnees($enregistrement));
    }

    /** EF-3.2, EF-3.3 — informations passager et questions de sûreté. */
    public function informations(Request $requete, CheckIn $enregistrement): JsonResponse
    {
        if ($enregistrement->estFinalise()) {
            return $this->erreur('Ce dossier est déjà finalisé.', 409);
        }

        $donnees = $requete->validate([
            'date_naissance' => ['nullable', 'date', 'before:today'],
            'nationalite' => ['nullable', 'string', 'size:3'],
            'numero_passeport' => ['nullable', 'string', 'max:40'],
            'passeport_expiration' => ['nullable', 'date', 'after:today'],
            'email' => ['nullable', 'email'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'securite_confirmee' => ['nullable', 'boolean'],
        ]);

        $enregistrement = $this->enregistrements->completerInformations($enregistrement, $donnees);

        return response()->json($this->cartes->donnees($enregistrement));
    }

    /** EF-5.2, EF-5.3 — déclaration des bagages en soute. */
    public function bagages(Request $requete, CheckIn $enregistrement): JsonResponse
    {
        if ($enregistrement->estFinalise()) {
            return $this->erreur('Ce dossier est déjà finalisé.', 409);
        }

        $donnees = $requete->validate([
            'nb' => ['required', 'integer', 'min:0', 'max:9'],
            'poids_estime' => ['required', 'numeric', 'min:0', 'max:200'],
        ]);

        $resultat = $this->enregistrements->declarerBagages(
            $enregistrement,
            (int) $donnees['nb'],
            (float) $donnees['poids_estime'],
        );

        return response()->json($resultat);
    }

    /** EF-4.1, EF-4.2 — plan de cabine et disponibilité des sièges. */
    public function cabine(CheckIn $enregistrement): JsonResponse
    {
        return response()->json(
            $this->sieges->etatCabine($enregistrement->flight, $enregistrement)
        );
    }

    /** EF-4.3, EF-4.5 — sélection d'un siège. */
    public function choisirSiege(Request $requete, CheckIn $enregistrement): JsonResponse
    {
        if ($enregistrement->estFinalise()) {
            return $this->erreur('Ce dossier est déjà finalisé.', 409);
        }

        $donnees = $requete->validate([
            'code' => ['required', 'string', 'max:4'],
        ]);

        try {
            $siege = $this->sieges->verrouiller($enregistrement, $donnees['code']);
        } catch (RuntimeException $e) {
            return $this->erreur($e->getMessage(), 409);
        }

        return response()->json([
            'siege' => $siege->code,
            'expire_le' => $siege->verrou_expire_le->toIso8601String(),
        ]);
    }

    /** EF-6.1 — finalisation et émission de la carte d'embarquement. */
    public function finaliser(CheckIn $enregistrement): JsonResponse
    {
        try {
            $enregistrement = $this->enregistrements->finaliser($enregistrement);
        } catch (RuntimeException $e) {
            return $this->erreur($e->getMessage(), 409);
        }

        return response()->json($this->cartes->donnees($enregistrement));
    }

    /** EF-3.5 — annulation de l'enregistrement. */
    public function annuler(CheckIn $enregistrement): JsonResponse
    {
        try {
            $this->enregistrements->annuler($enregistrement);
        } catch (RuntimeException $e) {
            return $this->erreur($e->getMessage(), 409);
        }

        return response()->json(['message' => 'Enregistrement annulé.']);
    }
}
