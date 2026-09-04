<?php

namespace Tests\Feature;

use App\Models\AircraftType;
use App\Models\PassengerNotification;
use Illuminate\Support\Carbon;

/**
 * Recette des modules 6.7 (Suivi de vol) et 6.9 (Back-office).
 */
class BackOfficeTest extends RecetteTestCase
{
    /** EF-7.1 — le passager consulte le statut de son vol. */
    public function test_ef_7_1_statut_du_vol(): void
    {
        $this->getJson("/api/vols/{$this->vol->numero_vol}/statut")
            ->assertOk()
            ->assertJsonPath('statut', 'a_lheure')
            ->assertJsonPath('porte', 'B3');
    }

    /** EF-9.1 — création d'un vol : les sièges sont générés depuis le plan. */
    public function test_ef_9_1_creation_de_vol(): void
    {
        $type = AircraftType::where('code', 'E195')->firstOrFail();
        $depart = Carbon::now()->addDays(2);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/vols', [
                'numero_vol' => '2J777',
                'aircraft_type_id' => $type->id,
                'origine' => 'OUA',
                'destination' => 'ABJ',
                'depart_prevu' => $depart->toIso8601String(),
                'arrivee_prevue' => $depart->copy()->addHours(2)->toIso8601String(),
            ])
            ->assertCreated()
            // 29 rangées x 4 sièges.
            ->assertJsonPath('sieges_crees', 116);
    }

    /** EF-9.2 — la fenêtre d'enregistrement est paramétrable par vol. */
    public function test_ef_9_2_fenetre_parametrable(): void
    {
        $this->actingAs($this->admin())
            ->patchJson("/api/admin/vols/{$this->vol->id}", [
                'checkin_ouverture_h' => 4,
            ])->assertOk();

        // Le vol part dans 8 h : avec une ouverture à H-4, c'est trop tôt.
        $this->postJson('/api/recherche-vol', [
            'numero_vol' => $this->vol->numero_vol,
            'numero_passeport' => $this->reservation->numero_passeport,
        ])->assertJsonPath('enregistrement.etat', 'pas_encore_ouvert');
    }

    /** EF-9.3, EF-7.2 — publier un retard notifie les passagers enregistrés. */
    public function test_ef_9_3_et_7_2_changement_notifie_les_passagers(): void
    {
        $jeton = $this->demarrerEnregistrement();
        $this->patchJson("/api/enregistrement/$jeton/informations",
            ['securite_confirmee' => true])->assertOk();
        $this->postJson("/api/enregistrement/$jeton/finaliser")->assertOk();

        $nouveauDepart = $this->vol->depart_prevu->copy()->addHours(2);

        $this->actingAs($this->admin())
            ->postJson("/api/admin/vols/{$this->vol->id}/changement", [
                'type' => 'retard',
                'nouvelle_valeur' => $nouveauDepart->toIso8601String(),
            ])
            ->assertCreated()
            ->assertJsonPath('evenement.type', 'retard');

        $this->assertSame('retarde', $this->vol->fresh()->statut);
        $this->assertGreaterThan(0, PassengerNotification::count());

        // EF-7.1 : le passager voit le nouvel horaire.
        $this->getJson("/api/vols/{$this->vol->numero_vol}/statut")
            ->assertJsonPath('statut', 'retarde');
    }

    /** EF-9.3 — changement de porte. */
    public function test_ef_9_3_changement_de_porte(): void
    {
        $this->actingAs($this->admin())
            ->postJson("/api/admin/vols/{$this->vol->id}/changement", [
                'type' => 'porte',
                'nouvelle_valeur' => 'C7',
            ])->assertCreated();

        $this->assertSame('C7', $this->vol->fresh()->porte);
    }

    /** EF-9.4 — le tableau de bord expose le taux d'enregistrement en ligne. */
    public function test_ef_9_4_tableau_de_bord(): void
    {
        $jeton = $this->demarrerEnregistrement();
        $this->patchJson("/api/enregistrement/$jeton/informations",
            ['securite_confirmee' => true])->assertOk();
        $this->postJson("/api/enregistrement/$jeton/finaliser")->assertOk();

        $this->actingAs($this->admin())
            ->getJson('/api/admin/tableau-de-bord')
            ->assertOk()
            ->assertJsonPath('synthese.enregistrements_total', 1)
            ->assertJsonPath('synthese.enregistrements_en_ligne', 1)
            ->assertJsonPath('synthese.taux_en_ligne', 100);
    }

    /** EF-9.5 — un agent n'accède pas au back-office administrateur. */
    public function test_ef_9_5_agent_refuse_en_back_office(): void
    {
        $this->actingAs($this->agent())
            ->getJson('/api/admin/tableau-de-bord')
            ->assertForbidden();
    }

    /** EF-9.5 — l'administrateur crée un compte agent. */
    public function test_ef_9_5_creation_d_un_agent(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/utilisateurs', [
                'name' => 'Nouvel Agent',
                'email' => 'nouvel.agent@airburkina.bf',
                'role' => 'agent',
                'password' => 'motdepasse123',
            ])
            ->assertCreated()
            ->assertJsonPath('role', 'agent');
    }
}
