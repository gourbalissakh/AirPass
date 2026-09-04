<?php

namespace App\Http\Controllers\Api;

use App\Models\BaggageItem;
use App\Models\Booking;
use App\Models\CheckIn;
use App\Services\CarteEmbarquementService;
use App\Services\EnregistrementService;
use App\Services\SiegeService;
use App\Support\FranchiseBagage;
use App\Support\Journal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Module 6.8 — vue de l'agent au comptoir.
 *
 * L'objectif du cahier des charges est explicite : retrouver « instantanément »
 * le dossier d'un passager déjà enregistré, pour accélérer la remise des
 * bagages et l'accès à l'embarquement.
 */
class GuichetController extends ApiController
{
    public function __construct(
        private readonly SiegeService $sieges,
        private readonly EnregistrementService $enregistrements,
        private readonly CarteEmbarquementService $cartes,
    ) {}

    /** EF-8.1 — recherche par nom, vol, référence de dossier ou scan QR. */
    public function recherche(Request $requete): JsonResponse
    {
        $donnees = $requete->validate([
            'q' => ['required', 'string', 'min:2', 'max:120'],
        ]);

        $terme = trim($donnees['q']);

        // Scan du QR code : « ENVOL|ENXXXXXX|2J201|... »
        if (Str::startsWith($terme, 'ENVOL|')) {
            $terme = explode('|', $terme)[1] ?? $terme;
        }

        $resultats = CheckIn::query()
            ->with(['booking', 'flight', 'seat'])
            ->whereIn('statut', ['en_cours', 'enregistre', 'embarque'])
            ->where(function ($q) use ($terme) {
                $q->where('reference', strtoupper($terme))
                    ->orWhereHas('booking', fn ($b) => $b
                        ->where('pnr', strtoupper($terme))
                        ->orWhere('nom', 'like', "%$terme%")
                        ->orWhere('numero_passeport', strtoupper($terme)))
                    ->orWhereHas('flight', fn ($f) => $f
                        ->where('numero_vol', strtoupper($terme)));
            })
            ->orderByDesc('enregistre_le')
            ->limit(25)
            ->get()
            ->map(fn (CheckIn $c) => $this->resume($c))
            ->all();

        // EF-8.4 — un passager non enregistré en ligne doit aussi être trouvable.
        $sansEnregistrement = Booking::query()
            ->with('flight')
            ->whereDoesntHave('checkIns', fn ($q) => $q->where('actif', 1))
            ->whereHas('flight', fn ($f) => $f->where('depart_prevu', '>', now()->subDay()))
            ->where(fn ($q) => $q
                ->where('pnr', strtoupper($terme))
                ->orWhere('nom', 'like', "%$terme%")
                ->orWhere('numero_passeport', strtoupper($terme))
                // Un agent qui cherche un numéro de vol veut aussi voir qui
                // reste à enregistrer sur ce vol.
                ->orWhereHas('flight', fn ($f) => $f
                    ->where('numero_vol', strtoupper($terme))))
            ->limit(25)
            ->get()
            ->map(fn (Booking $b) => [
                'type' => 'reservation',
                'pnr' => $b->pnr,
                'passager' => $b->nomComplet(),
                'vol' => $b->flight->numero_vol,
                'depart' => $b->flight->depart_prevu->toIso8601String(),
                'enregistre' => false,
            ])
            ->all();

        return response()->json([
            'enregistrements' => $resultats,
            'non_enregistres' => $sansEnregistrement,
        ]);
    }

    /** EF-8.2 — dossier complet d'un passager enregistré. */
    public function dossier(string $reference): JsonResponse
    {
        $enregistrement = $this->parReference($reference);

        if (! $enregistrement) {
            return $this->erreur('Dossier introuvable.', 404);
        }

        $franchise = FranchiseBagage::pourReservation($enregistrement->booking);

        return response()->json([
            'carte' => $this->cartes->donnees($enregistrement),
            'franchise' => $franchise->toArray(),
            'depassement' => $franchise->depassement(
                $enregistrement->bagages_nb,
                $enregistrement->bagages_poids_estime,
            ),
            'bagages_peses' => $enregistrement->baggageItems()->get()->map(fn ($b) => [
                'etiquette' => $b->numero_etiquette,
                'poids_reel' => $b->poids_reel,
            ]),
        ]);
    }

    /** EF-8.3 — enregistrement du poids réel d'un bagage. */
    public function peserBagage(Request $requete, string $reference): JsonResponse
    {
        $enregistrement = $this->parReference($reference);

        if (! $enregistrement) {
            return $this->erreur('Dossier introuvable.', 404);
        }

        $donnees = $requete->validate([
            'poids_reel' => ['required', 'numeric', 'min:0', 'max:200'],
        ]);

        $bagage = BaggageItem::create([
            'check_in_id' => $enregistrement->id,
            'numero_etiquette' => $this->genererEtiquette($enregistrement),
            'poids_reel' => $donnees['poids_reel'],
            'pese_par' => $requete->user()->id,
        ]);

        Journal::ecrire('guichet.bagage_pese', $enregistrement, [
            'etiquette' => $bagage->numero_etiquette,
            'poids' => $bagage->poids_reel,
        ]);

        return response()->json([
            'etiquette' => $bagage->numero_etiquette,
            'poids_reel' => $bagage->poids_reel,
        ], 201);
    }

    /** EF-8.3 — validation de l'accès à l'embarquement. */
    public function embarquer(Request $requete, string $reference): JsonResponse
    {
        $enregistrement = $this->parReference($reference);

        if (! $enregistrement) {
            return $this->erreur('Dossier introuvable.', 404);
        }

        if ($enregistrement->statut !== 'enregistre') {
            return $this->erreur(
                'Seul un passager enregistré peut être admis à '
                ."l'embarquement (statut actuel : {$enregistrement->statut}).",
                409
            );
        }

        $enregistrement->update([
            'statut' => 'embarque',
            'embarque_le' => now(),
        ]);

        Journal::ecrire('guichet.embarquement', $enregistrement,
            acteur: $requete->user()->email);

        return response()->json(['message' => 'Passager admis à l\'embarquement.']);
    }

    /** EF-8.4 — changement de siège décidé au comptoir. */
    public function changerSiege(Request $requete, string $reference): JsonResponse
    {
        $enregistrement = $this->parReference($reference);

        if (! $enregistrement) {
            return $this->erreur('Dossier introuvable.', 404);
        }

        $donnees = $requete->validate(['code' => ['required', 'string', 'max:4']]);

        try {
            $siege = $this->sieges->verrouiller($enregistrement, $donnees['code']);
            $this->sieges->confirmer($enregistrement->fresh());
        } catch (RuntimeException $e) {
            return $this->erreur($e->getMessage(), 409);
        }

        Journal::ecrire('guichet.siege_change', $enregistrement,
            ['siege' => $siege->code], acteur: $requete->user()->email);

        return response()->json(['siege' => $siege->code]);
    }

    /** EF-8.4 — enregistrement au comptoir d'un passager non enregistré. */
    public function enregistrerAuComptoir(Request $requete): JsonResponse
    {
        $donnees = $requete->validate([
            'pnr' => ['required', 'string', 'size:6'],
            'numero_vol' => ['required', 'string', 'max:10'],
        ]);

        $reservation = Booking::whereHas('flight',
            fn ($f) => $f->where('numero_vol', strtoupper($donnees['numero_vol'])))
            ->where('pnr', strtoupper($donnees['pnr']))
            ->first();

        if (! $reservation) {
            return $this->erreur('Réservation introuvable.', 404);
        }

        try {
            $enregistrement = $this->enregistrements->demarrer($reservation, 'guichet');
            $enregistrement->update(['securite_confirmee' => true]);
            $enregistrement = $this->enregistrements->finaliser($enregistrement->fresh());
        } catch (RuntimeException $e) {
            return $this->erreur($e->getMessage(), 409);
        }

        Journal::ecrire('guichet.enregistrement', $enregistrement,
            acteur: $requete->user()->email);

        return response()->json($this->cartes->donnees($enregistrement), 201);
    }

    private function parReference(string $reference): ?CheckIn
    {
        return CheckIn::with(['booking', 'flight.aircraftType', 'seat'])
            ->where('reference', strtoupper($reference))
            ->first();
    }

    private function resume(CheckIn $enregistrement): array
    {
        return [
            'type' => 'enregistrement',
            'reference' => $enregistrement->reference,
            'passager' => $enregistrement->booking->nomComplet(),
            'pnr' => $enregistrement->booking->pnr,
            'vol' => $enregistrement->flight->numero_vol,
            'depart' => $enregistrement->flight->depart_prevu->toIso8601String(),
            'siege' => $enregistrement->seat?->code,
            'bagages_nb' => $enregistrement->bagages_nb,
            'bagages_poids_estime' => $enregistrement->bagages_poids_estime,
            'statut' => $enregistrement->statut,
            'canal' => $enregistrement->canal,
            'enregistre' => $enregistrement->estFinalise(),
        ];
    }

    private function genererEtiquette(CheckIn $enregistrement): string
    {
        $rang = $enregistrement->baggageItems()->count() + 1;

        return '2J'.str_pad((string) $enregistrement->id, 6, '0', STR_PAD_LEFT).$rang;
    }
}
