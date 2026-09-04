<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\CheckIn;
use App\Services\Dcs\DcsGateway;
use App\Support\FranchiseBagage;
use App\Support\Journal;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Module 6.3 — orchestration de l'enregistrement en ligne.
 *
 * Un enregistrement naît au statut « en_cours » dès que le passager entre
 * dans le parcours, puis passe à « enregistre » à la finalisation. La
 * colonne « actif » porte la contrainte d'unicité qui interdit le double
 * enregistrement (EF-3.4).
 */
final class EnregistrementService
{
    public function __construct(
        private readonly SiegeService $sieges,
        private readonly DcsGateway $dcs,
    ) {}

    /**
     * Ouvre (ou reprend) l'enregistrement d'une réservation.
     *
     * @throws RuntimeException si la fenêtre n'est pas ouverte (EF-3.1)
     */
    public function demarrer(Booking $reservation, string $canal = 'web'): CheckIn
    {
        $fenetre = $reservation->flight->fenetreEnregistrement();

        if (! $fenetre->estOuverte()) {
            throw new RuntimeException($fenetre->message());
        }

        $existant = $reservation->enregistrementActif();

        if ($existant) {
            // EF-3.4 : un passager déjà enregistré ne recommence pas, il
            // retrouve son dossier.
            return $existant;
        }

        $enregistrement = CheckIn::create([
            'booking_id' => $reservation->id,
            'flight_id' => $reservation->flight_id,
            'statut' => 'en_cours',
            'actif' => 1,
            'canal' => $canal,
            'reference' => $this->genererReference(),
            'qr_jeton' => Str::random(64),
        ]);

        Journal::ecrire('enregistrement.demarre', $enregistrement, [
            'pnr' => $reservation->pnr,
            'vol' => $reservation->flight->numero_vol,
        ], acteur: 'invité — PNR '.$reservation->pnr);

        return $enregistrement;
    }

    /** EF-3.2 — complète les informations passager exigées pour le vol. */
    public function completerInformations(CheckIn $enregistrement, array $donnees): CheckIn
    {
        $enregistrement->booking->update(array_filter([
            'date_naissance' => $donnees['date_naissance'] ?? null,
            'nationalite' => $donnees['nationalite'] ?? null,
            'numero_passeport' => $donnees['numero_passeport'] ?? null,
            'passeport_expiration' => $donnees['passeport_expiration'] ?? null,
            'email' => $donnees['email'] ?? null,
            'telephone' => $donnees['telephone'] ?? null,
        ], fn ($v) => $v !== null));

        if (array_key_exists('securite_confirmee', $donnees)) {
            $enregistrement->update([
                'securite_confirmee' => (bool) $donnees['securite_confirmee'],
            ]);
        }

        Journal::ecrire('enregistrement.informations', $enregistrement);

        return $enregistrement->fresh(['booking']);
    }

    /** EF-5.2, EF-5.3 — déclaration des bagages en soute. */
    public function declarerBagages(CheckIn $enregistrement, int $nb, float $poids): array
    {
        $enregistrement->update([
            'bagages_nb' => $nb,
            'bagages_poids_estime' => $poids,
        ]);

        $franchise = FranchiseBagage::pourReservation($enregistrement->booking);

        Journal::ecrire('enregistrement.bagages', $enregistrement, [
            'nb' => $nb, 'poids' => $poids,
        ]);

        return [
            'franchise' => $franchise->toArray(),
            'depassement' => $franchise->depassement($nb, $poids),
        ];
    }

    /**
     * Finalise l'enregistrement et rend la carte d'embarquement disponible.
     *
     * @throws RuntimeException
     */
    public function finaliser(CheckIn $enregistrement): CheckIn
    {
        $fenetre = $enregistrement->flight->fenetreEnregistrement();

        if (! $fenetre->estOuverte()) {
            throw new RuntimeException($fenetre->message());
        }

        if (! $enregistrement->securite_confirmee) {
            throw new RuntimeException(
                'Vous devez confirmer les questions de sûreté avant de '
                ."finaliser votre enregistrement."
            );
        }

        // EF-4.4 : pas de choix de siège = attribution automatique.
        if (! $enregistrement->seat_id) {
            $this->sieges->attribuerAutomatiquement($enregistrement);
            $enregistrement->refresh();
        }

        $this->sieges->confirmer($enregistrement);

        $enregistrement->update([
            'statut' => 'enregistre',
            'enregistre_le' => now(),
        ]);

        $this->dcs->remonterEnregistrement($enregistrement);

        Journal::ecrire('enregistrement.finalise', $enregistrement, [
            'siege' => $enregistrement->seat?->code,
        ]);

        return $enregistrement->fresh(['booking', 'flight.aircraftType', 'seat']);
    }

    /**
     * EF-3.5 — annulation de l'enregistrement avant la clôture du vol.
     *
     * @throws RuntimeException
     */
    public function annuler(CheckIn $enregistrement): CheckIn
    {
        if ($enregistrement->statut === 'embarque') {
            throw new RuntimeException(
                "Ce passager est déjà embarqué : l'enregistrement ne peut "
                .'plus être annulé.'
            );
        }

        if (! $enregistrement->flight->fenetreEnregistrement()->estOuverte()) {
            throw new RuntimeException(
                "L'enregistrement est clôturé pour ce vol. Adressez-vous au "
                .'comptoir Air Burkina.'
            );
        }

        $this->sieges->libererPour($enregistrement);

        $enregistrement->update([
            'statut' => 'annule',
            'actif' => null,          // libère la contrainte d'unicité EF-3.4
            'seat_id' => null,
        ]);

        $this->dcs->remonterAnnulation($enregistrement);

        Journal::ecrire('enregistrement.annule', $enregistrement);

        return $enregistrement;
    }

    /** Référence à six caractères affichée au passager et à l'agent. */
    private function genererReference(): string
    {
        do {
            $reference = 'EN'.strtoupper(Str::random(6));
        } while (CheckIn::where('reference', $reference)->exists());

        return $reference;
    }
}
