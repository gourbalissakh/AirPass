<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\Flight;
use App\Models\Seat;
use App\Support\Journal;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Module 6.4 — choix de siège.
 *
 * Le point délicat est EF-4.3 : deux passagers peuvent viser le même siège
 * au même instant. La sélection pose donc un verrou en base, à l'intérieur
 * d'une transaction et sur une ligne verrouillée (SELECT ... FOR UPDATE),
 * ce qui rend l'attribution correcte même avec plusieurs instances de l'API.
 */
final class SiegeService
{
    /**
     * EF-4.3 — verrouille temporairement un siège au profit d'un
     * enregistrement en cours.
     *
     * @throws RuntimeException si le siège est indisponible ou non éligible
     */
    public function verrouiller(CheckIn $enregistrement, string $code): Seat
    {
        return DB::transaction(function () use ($enregistrement, $code) {
            $siege = Seat::query()
                ->where('flight_id', $enregistrement->flight_id)
                ->where('code', strtoupper($code))
                ->lockForUpdate()
                ->first();

            if (! $siege) {
                throw new RuntimeException("Ce siège n'existe pas sur ce vol.");
            }

            $jetonCourant = $this->jeton($enregistrement);

            if (! $siege->estDisponiblePour($jetonCourant)) {
                throw new RuntimeException(
                    'Ce siège vient d\'être pris par un autre passager. '
                    .'Choisissez-en un autre.'
                );
            }

            $this->verifierEligibilite($siege, $enregistrement->booking);

            // Libère le siège précédemment retenu par ce même passager.
            $this->libererPour($enregistrement);

            $siege->update([
                'statut' => 'verrouille',
                'verrou_jeton' => $jetonCourant,
                'verrou_expire_le' => now()->addMinutes(
                    config('airpass.verrou_siege_minutes')
                ),
            ]);

            $enregistrement->update(['seat_id' => $siege->id]);

            Journal::ecrire('siege.verrouille', $enregistrement, ['siege' => $siege->code]);

            return $siege;
        });
    }

    /**
     * EF-4.5 — règles d'éligibilité aux sièges d'issue de secours.
     *
     * @throws RuntimeException
     */
    public function verifierEligibilite(Seat $siege, Booking $reservation): void
    {
        if ($siege->type !== 'issue_secours') {
            return;
        }

        $age = $reservation->age();
        $ageMin = config('airpass.issue_secours_age_min');

        if ($age !== null && $age < $ageMin) {
            throw new RuntimeException(
                "Les sièges situés aux issues de secours sont réservés aux "
                ."passagers de $ageMin ans et plus."
            );
        }
    }

    /**
     * EF-4.4 — attribution automatique quand le passager ne choisit pas.
     * On privilégie un siège de la classe du billet, hors issues de secours.
     */
    public function attribuerAutomatiquement(CheckIn $enregistrement): ?Seat
    {
        return DB::transaction(function () use ($enregistrement) {
            $siege = Seat::query()
                ->where('flight_id', $enregistrement->flight_id)
                ->where('classe', $enregistrement->booking->classe)
                ->where('type', '!=', 'issue_secours')
                ->where(fn ($q) => $q
                    ->where('statut', 'libre')
                    ->orWhere(fn ($q2) => $q2
                        ->where('statut', 'verrouille')
                        ->where('verrou_expire_le', '<', now())))
                ->orderBy('rangee')
                ->orderBy('lettre')
                ->lockForUpdate()
                ->first();

            if (! $siege) {
                return null;
            }

            $siege->update([
                'statut' => 'verrouille',
                'verrou_jeton' => $this->jeton($enregistrement),
                'verrou_expire_le' => now()->addMinutes(
                    config('airpass.verrou_siege_minutes')
                ),
            ]);

            $enregistrement->update(['seat_id' => $siege->id]);

            Journal::ecrire('siege.attribue_auto', $enregistrement, ['siege' => $siege->code]);

            return $siege;
        });
    }

    /** Confirme définitivement le siège à la finalisation de l'enregistrement. */
    public function confirmer(CheckIn $enregistrement): void
    {
        $enregistrement->seat?->update([
            'statut' => 'occupe',
            'verrou_jeton' => null,
            'verrou_expire_le' => null,
        ]);
    }

    /** Rend le siège au stock (annulation, ou changement de siège). */
    public function libererPour(CheckIn $enregistrement): void
    {
        $siege = $enregistrement->seat;

        if (! $siege) {
            return;
        }

        $siege->update([
            'statut' => 'libre',
            'verrou_jeton' => null,
            'verrou_expire_le' => null,
        ]);
    }

    /**
     * EF-4.2 — état de la cabine tel qu'affiché au passager. Le jeton du
     * passager courant lui permet de reconnaître « son » siège en cours de
     * sélection.
     */
    public function etatCabine(Flight $vol, ?CheckIn $enregistrement = null): array
    {
        $jeton = $enregistrement ? $this->jeton($enregistrement) : null;

        $sieges = $vol->seats()->orderBy('rangee')->orderBy('lettre')->get()
            ->map(fn (Seat $s) => [
                'code' => $s->code,
                'rangee' => $s->rangee,
                'lettre' => $s->lettre,
                'classe' => $s->classe,
                'type' => $s->type,
                'statut' => match (true) {
                    $jeton !== null && $s->verrou_jeton === $jeton => 'selectionne',
                    $s->statut === 'verrouille' && $s->verrouExpire() => 'libre',
                    $s->statut === 'verrouille' => 'occupe',
                    default => $s->statut,
                },
            ])->values()->all();

        return [
            'avion' => [
                'code' => $vol->aircraftType->code,
                'nom' => $vol->aircraftType->nom,
            ],
            'plan' => $vol->aircraftType->plan_cabine,
            'sieges' => $sieges,
        ];
    }

    /** Jeton de verrou propre à un enregistrement. */
    private function jeton(CheckIn $enregistrement): string
    {
        return 'ci-'.$enregistrement->id;
    }
}
