<?php

namespace Tests\Feature;

use App\Models\CheckIn;

/**
 * Recette du module 6.3 — Enregistrement en ligne.
 */
class EnregistrementTest extends RecetteTestCase
{
    /** EF-3.1 — hors fenêtre, l'enregistrement est refusé. */
    public function test_ef_3_1_refus_hors_fenetre(): void
    {
        $vol = $this->creerVol(heuresAvantDepart: 1);
        $reservation = $this->creerReservation($vol);

        $this->postJson('/api/enregistrement/demarrer', [
            'numero_vol' => $vol->numero_vol,
            'numero_passeport' => $reservation->numero_passeport,
        ])->assertStatus(409);
    }

    /** EF-1.3 — aucun compte n'est nécessaire pour s'enregistrer. */
    public function test_ef_1_3_mode_invite(): void
    {
        $this->postJson('/api/enregistrement/demarrer', [
            'numero_vol' => $this->vol->numero_vol,
            'numero_passeport' => $this->reservation->numero_passeport,
        ])
            ->assertCreated()
            ->assertJsonStructure(['reference', 'jeton', 'statut']);

        $this->assertGuest();
    }

    /** EF-3.2, EF-3.3 — informations passager et questions de sûreté. */
    public function test_ef_3_2_et_3_3_informations_et_surete(): void
    {
        $jeton = $this->demarrerEnregistrement();

        $this->patchJson("/api/enregistrement/$jeton/informations", [
            'nationalite' => 'BFA',
            'securite_confirmee' => true,
        ])->assertOk();

        $this->assertTrue(CheckIn::first()->securite_confirmee);
    }

    /** EF-3.4 — pas de double enregistrement sur un même vol. */
    public function test_ef_3_4_pas_de_double_enregistrement(): void
    {
        $premier = $this->demarrerEnregistrement();
        $second = $this->demarrerEnregistrement();

        $this->assertSame($premier, $second);
        $this->assertSame(1, CheckIn::where('booking_id', $this->reservation->id)->count());
    }

    /** EF-3.5 — annulation possible tant que le vol n'est pas clôturé. */
    public function test_ef_3_5_annulation(): void
    {
        $jeton = $this->demarrerEnregistrement();
        $this->patchJson("/api/enregistrement/$jeton/informations",
            ['securite_confirmee' => true])->assertOk();
        $this->postJson("/api/enregistrement/$jeton/finaliser")->assertOk();

        $this->deleteJson("/api/enregistrement/$jeton")->assertOk();

        $enregistrement = CheckIn::first();
        $this->assertSame('annule', $enregistrement->statut);
        $this->assertNull($enregistrement->actif);
        // Le siège est rendu au stock.
        $this->assertNull($enregistrement->seat_id);
    }

    /** EF-3.5 — après annulation, le passager peut se réenregistrer. */
    public function test_ef_3_5_reenregistrement_apres_annulation(): void
    {
        $jeton = $this->demarrerEnregistrement();
        $this->deleteJson("/api/enregistrement/$jeton")->assertOk();

        $this->postJson('/api/enregistrement/demarrer', [
            'numero_vol' => $this->vol->numero_vol,
            'numero_passeport' => $this->reservation->numero_passeport,
        ])->assertCreated();
    }

    /** La finalisation exige la confirmation de sûreté. */
    public function test_finalisation_refusee_sans_confirmation_de_surete(): void
    {
        $jeton = $this->demarrerEnregistrement();

        $this->postJson("/api/enregistrement/$jeton/finaliser")->assertStatus(409);
    }
}
