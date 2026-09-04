<?php

namespace Tests\Feature;

use App\Models\Seat;
use Illuminate\Support\Carbon;

/**
 * Recette du module 6.4 — Choix de siège.
 */
class SiegeTest extends RecetteTestCase
{
    /** EF-4.1 — le plan de cabine correspond au type d'appareil. */
    public function test_ef_4_1_plan_de_cabine(): void
    {
        $jeton = $this->demarrerEnregistrement();

        $reponse = $this->getJson("/api/enregistrement/$jeton/cabine")->assertOk();

        $this->assertSame('E170', $reponse->json('avion.code'));
        // 19 rangées x 4 sièges = 76 sièges.
        $this->assertCount(76, $reponse->json('sieges'));
    }

    /** EF-4.2 — les sièges bloqués sont signalés comme tels. */
    public function test_ef_4_2_sieges_bloques(): void
    {
        $jeton = $this->demarrerEnregistrement();

        $sieges = collect($this->getJson("/api/enregistrement/$jeton/cabine")->json('sieges'));

        $this->assertSame('bloque', $sieges->firstWhere('code', '19A')['statut']);
    }

    /** EF-4.3 — la sélection pose un verrou temporaire. */
    public function test_ef_4_3_verrou_temporaire(): void
    {
        $jeton = $this->demarrerEnregistrement();

        $this->postJson("/api/enregistrement/$jeton/siege", ['code' => '14A'])
            ->assertOk()
            ->assertJsonPath('siege', '14A');

        $siege = Seat::where('flight_id', $this->vol->id)->where('code', '14A')->first();
        $this->assertSame('verrouille', $siege->statut);
        $this->assertTrue($siege->verrou_expire_le->isFuture());
    }

    /** EF-4.3 — un second passager ne peut pas prendre le siège verrouillé. */
    public function test_ef_4_3_conflit_entre_deux_passagers(): void
    {
        $jetonA = $this->demarrerEnregistrement();
        $this->postJson("/api/enregistrement/$jetonA/siege", ['code' => '14A'])->assertOk();

        $autre = $this->creerReservation($this->vol, ['numero_passeport' => 'BF5550000']);
        $jetonB = $this->demarrerEnregistrement($autre);

        $this->postJson("/api/enregistrement/$jetonB/siege", ['code' => '14A'])
            ->assertStatus(409)
            ->assertJsonPath('message', fn ($m) => str_contains($m, 'autre passager'));
    }

    /** EF-4.3 — un verrou expiré libère le siège. */
    public function test_ef_4_3_verrou_expire_libere_le_siege(): void
    {
        $jetonA = $this->demarrerEnregistrement();
        $this->postJson("/api/enregistrement/$jetonA/siege", ['code' => '14A'])->assertOk();

        Carbon::setTestNow(Carbon::now()->addMinutes(30));

        $autre = $this->creerReservation($this->vol, ['numero_passeport' => 'BF5550001']);
        $jetonB = $this->demarrerEnregistrement($autre);

        $this->postJson("/api/enregistrement/$jetonB/siege", ['code' => '14A'])->assertOk();

        Carbon::setTestNow();
    }

    /** EF-4.4 — sans choix, un siège est attribué automatiquement. */
    public function test_ef_4_4_attribution_automatique(): void
    {
        $jeton = $this->demarrerEnregistrement();
        $this->patchJson("/api/enregistrement/$jeton/informations",
            ['securite_confirmee' => true])->assertOk();

        $reponse = $this->postJson("/api/enregistrement/$jeton/finaliser")->assertOk();

        $this->assertNotNull($reponse->json('siege'));
    }

    /** EF-4.5 — issue de secours interdite à un passager mineur. */
    public function test_ef_4_5_eligibilite_issue_de_secours(): void
    {
        $mineur = $this->creerReservation($this->vol, [
            'numero_passeport' => 'BF4440000',
            'date_naissance' => Carbon::now()->subYears(10),
        ]);

        $jeton = $this->demarrerEnregistrement($mineur);

        $this->postJson("/api/enregistrement/$jeton/siege", ['code' => '11A'])
            ->assertStatus(409)
            ->assertJsonPath('message', fn ($m) => str_contains($m, 'issues de secours'));
    }
}
