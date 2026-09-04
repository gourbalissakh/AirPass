<?php

namespace Tests\Feature;

/**
 * Recette des modules 6.5 (Bagages) et 6.6 (Carte d'embarquement).
 */
class BagagesEtCarteTest extends RecetteTestCase
{
    /** EF-5.1, EF-5.2 — franchise annoncée et bagages déclarés. */
    public function test_ef_5_1_et_5_2_declaration_dans_la_franchise(): void
    {
        $jeton = $this->demarrerEnregistrement();

        $this->postJson("/api/enregistrement/$jeton/bagages",
            ['nb' => 1, 'poids_estime' => 20])
            ->assertOk()
            ->assertJsonPath('franchise.nb_autorise', 1)
            ->assertJsonPath('franchise.poids_total_autorise', 23)
            ->assertJsonPath('depassement', null);
    }

    /** EF-5.3 — le dépassement de franchise est signalé au passager. */
    public function test_ef_5_3_depassement_de_franchise(): void
    {
        $jeton = $this->demarrerEnregistrement();

        $this->postJson("/api/enregistrement/$jeton/bagages",
            ['nb' => 3, 'poids_estime' => 60])
            ->assertOk()
            ->assertJsonPath('depassement.pieces_en_trop', 2)
            ->assertJsonPath('depassement.kg_en_trop', 37);
    }

    /** EF-6.1 — la carte d'embarquement porte vol, siège, porte et QR. */
    public function test_ef_6_1_carte_d_embarquement(): void
    {
        $jeton = $this->demarrerEnregistrement();
        $this->patchJson("/api/enregistrement/$jeton/informations",
            ['securite_confirmee' => true])->assertOk();
        $this->postJson("/api/enregistrement/$jeton/siege", ['code' => '9C'])->assertOk();

        $reponse = $this->postJson("/api/enregistrement/$jeton/finaliser")->assertOk();

        $reponse->assertJsonPath('siege', '9C')
            ->assertJsonPath('vol.numero', $this->vol->numero_vol)
            ->assertJsonPath('vol.porte', 'B3')
            ->assertJsonPath('statut', 'enregistre');

        $this->assertStringStartsWith('AIRPASS|', $reponse->json('qr'));
        $this->assertStringStartsWith('AP', $reponse->json('reference'));
    }

    /** EF-5.4 — les bagages déclarés en ligne suivent jusqu'à la carte. */
    public function test_ef_5_4_bagages_reportes_sur_le_dossier(): void
    {
        $jeton = $this->demarrerEnregistrement();
        $this->postJson("/api/enregistrement/$jeton/bagages",
            ['nb' => 2, 'poids_estime' => 30])->assertOk();

        $this->getJson("/api/enregistrement/$jeton")
            ->assertOk()
            ->assertJsonPath('bagages.nb', 2);
    }
}
