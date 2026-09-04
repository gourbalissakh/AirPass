<?php

namespace Tests\Feature;

/**
 * Recette du module 6.2 — Recherche de vol.
 */
class RechercheVolTest extends RecetteTestCase
{
    /** EF-2.1 — retrouver sa réservation par numéro de vol et passeport. */
    public function test_ef_2_1_recherche_par_vol_et_passeport(): void
    {
        $this->postJson('/api/recherche-vol', [
            'numero_vol' => $this->vol->numero_vol,
            'numero_passeport' => $this->reservation->numero_passeport,
        ])
            ->assertOk()
            ->assertJsonPath('reservation.pnr', $this->reservation->pnr)
            ->assertJsonPath('vol.numero', $this->vol->numero_vol);
    }

    /** EF-2.1 — variante PNR + nom. */
    public function test_ef_2_1_recherche_par_pnr_et_nom(): void
    {
        $this->postJson('/api/recherche-vol', [
            'pnr' => $this->reservation->pnr,
            'nom' => $this->reservation->nom,
        ])
            ->assertOk()
            ->assertJsonPath('reservation.passager', 'Awa Traoré');
    }

    /** EF-2.3 — l'état de la fenêtre d'enregistrement est annoncé. */
    public function test_ef_2_3_fenetre_ouverte(): void
    {
        $this->postJson('/api/recherche-vol', [
            'numero_vol' => $this->vol->numero_vol,
            'numero_passeport' => $this->reservation->numero_passeport,
        ])->assertJsonPath('enregistrement.etat', 'ouvert');
    }

    /** EF-2.3 — un vol à J-3 n'est pas encore ouvert à l'enregistrement. */
    public function test_ef_2_3_fenetre_pas_encore_ouverte(): void
    {
        $vol = $this->creerVol(heuresAvantDepart: 72);
        $reservation = $this->creerReservation($vol);

        $this->postJson('/api/recherche-vol', [
            'numero_vol' => $vol->numero_vol,
            'numero_passeport' => $reservation->numero_passeport,
        ])
            ->assertOk()
            ->assertJsonPath('enregistrement.etat', 'pas_encore_ouvert');
    }

    /** EF-2.3 — à H-1 l'enregistrement en ligne est clôturé. */
    public function test_ef_2_3_fenetre_fermee(): void
    {
        $vol = $this->creerVol(heuresAvantDepart: 1);
        $reservation = $this->creerReservation($vol);

        $this->postJson('/api/recherche-vol', [
            'numero_vol' => $vol->numero_vol,
            'numero_passeport' => $reservation->numero_passeport,
        ])
            ->assertOk()
            ->assertJsonPath('enregistrement.etat', 'ferme');
    }

    /** EF-2.4 — message clair et sans fuite d'information si vol introuvable. */
    public function test_ef_2_4_message_clair_si_introuvable(): void
    {
        $this->postJson('/api/recherche-vol', [
            'numero_vol' => '2J999',
            'numero_passeport' => 'XX0000000',
        ])
            ->assertNotFound()
            ->assertJsonPath('message', fn ($m) => str_contains($m, 'Aucune réservation'));
    }
}
