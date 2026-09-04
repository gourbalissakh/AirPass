<?php

namespace Tests\Feature;

use App\Models\CheckIn;

/**
 * Recette du module 6.8 — Vue agent au comptoir.
 */
class GuichetTest extends RecetteTestCase
{
    /** Un passager non authentifié n'accède pas à la vue guichet. */
    public function test_vue_guichet_protegee(): void
    {
        $this->getJson('/api/guichet/recherche?q=Traore')->assertUnauthorized();
    }

    /** Un passager authentifié sans rôle agent est refusé (EF-9.5). */
    public function test_role_passager_refuse(): void
    {
        $passager = \App\Models\User::create([
            'name' => 'Awa', 'email' => 'awa@example.com',
            'password' => bcrypt('password'), 'role' => 'passager',
        ]);

        $this->actingAs($passager)
            ->getJson('/api/guichet/recherche?q=Traore')
            ->assertForbidden();
    }

    /** EF-8.1, EF-8.2 — l'agent retrouve le dossier et voit siège et bagages. */
    public function test_ef_8_1_et_8_2_recherche_et_dossier(): void
    {
        $reference = $this->enregistrerPassager();

        $this->actingAs($this->agent())
            ->getJson('/api/guichet/recherche?q=Traoré')
            ->assertOk()
            ->assertJsonPath('enregistrements.0.reference', $reference)
            ->assertJsonPath('enregistrements.0.siege', '9C')
            ->assertJsonPath('enregistrements.0.bagages_nb', 2);
    }

    /** EF-8.1 — recherche par scan du QR code. */
    public function test_ef_8_1_recherche_par_scan_qr(): void
    {
        $reference = $this->enregistrerPassager();
        $qr = app(\App\Services\CarteEmbarquementService::class)
            ->contenuQr(CheckIn::where('reference', $reference)->first());

        $this->actingAs($this->agent())
            ->getJson('/api/guichet/recherche?q='.urlencode($qr))
            ->assertOk()
            ->assertJsonPath('enregistrements.0.reference', $reference);
    }

    /** EF-8.4 — chercher un vol liste aussi les passagers restant à enregistrer. */
    public function test_ef_8_4_recherche_par_vol_liste_les_non_enregistres(): void
    {
        $this->creerReservation($this->vol, [
            'nom' => 'Ouédraogo', 'numero_passeport' => 'BF3330000',
        ]);

        $this->actingAs($this->agent())
            ->getJson('/api/guichet/recherche?q='.$this->vol->numero_vol)
            ->assertOk()
            ->assertJsonPath('non_enregistres.0.enregistre', false)
            ->assertJsonCount(2, 'non_enregistres');
    }

    /** EF-8.3 — pesée du bagage puis admission à l'embarquement. */
    public function test_ef_8_3_pesee_et_embarquement(): void
    {
        $reference = $this->enregistrerPassager();
        $agent = $this->agent();

        $this->actingAs($agent)
            ->postJson("/api/guichet/$reference/bagage", ['poids_reel' => 24.5])
            ->assertCreated()
            ->assertJsonPath('poids_reel', 24.5);

        $this->actingAs($agent)
            ->postJson("/api/guichet/$reference/embarquer")
            ->assertOk();

        $this->assertSame('embarque', CheckIn::where('reference', $reference)->first()->statut);
    }

    /** EF-8.4 — l'agent peut changer le siège au comptoir. */
    public function test_ef_8_4_changement_de_siege(): void
    {
        $reference = $this->enregistrerPassager();

        $this->actingAs($this->agent())
            ->postJson("/api/guichet/$reference/siege", ['code' => '5D'])
            ->assertOk()
            ->assertJsonPath('siege', '5D');
    }

    /** EF-8.4 — enregistrement au comptoir d'un passager sans check-in en ligne. */
    public function test_ef_8_4_enregistrement_au_comptoir(): void
    {
        $this->actingAs($this->agent())
            ->postJson('/api/guichet/enregistrer', [
                'pnr' => $this->reservation->pnr,
                'numero_vol' => $this->vol->numero_vol,
            ])
            ->assertCreated()
            ->assertJsonPath('statut', 'enregistre');

        $this->assertSame('guichet', CheckIn::first()->canal);
    }

    /** Prépare un passager enregistré en ligne, siège 9C et 2 bagages. */
    private function enregistrerPassager(): string
    {
        $jeton = $this->demarrerEnregistrement();
        $this->patchJson("/api/enregistrement/$jeton/informations",
            ['securite_confirmee' => true])->assertOk();
        $this->postJson("/api/enregistrement/$jeton/bagages",
            ['nb' => 2, 'poids_estime' => 30])->assertOk();
        $this->postJson("/api/enregistrement/$jeton/siege", ['code' => '9C'])->assertOk();

        return $this->postJson("/api/enregistrement/$jeton/finaliser")
            ->assertOk()->json('reference');
    }
}
