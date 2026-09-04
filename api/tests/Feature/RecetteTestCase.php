<?php

namespace Tests\Feature;

use App\Models\AircraftType;
use App\Models\Booking;
use App\Models\Flight;
use App\Models\User;
use App\Support\PlanCabine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Socle commun aux tests de recette : un vol Air Burkina, ses sièges, et
 * une réservation exploitable.
 */
abstract class RecetteTestCase extends TestCase
{
    use RefreshDatabase;

    protected Flight $vol;

    protected Booking $reservation;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\FlotteSeeder::class);

        $this->vol = $this->creerVol(heuresAvantDepart: 8);
        $this->reservation = $this->creerReservation($this->vol);
    }

    protected function creerVol(int $heuresAvantDepart, string $codeAvion = 'E170'): Flight
    {
        $type = AircraftType::where('code', $codeAvion)->firstOrFail();
        $depart = Carbon::now()->addHours($heuresAvantDepart);

        $vol = Flight::create([
            'numero_vol' => '2J'.random_int(100, 999),
            'aircraft_type_id' => $type->id,
            'origine' => 'OUA',
            'destination' => 'DSS',
            'depart_prevu' => $depart,
            'arrivee_prevue' => $depart->copy()->addHours(3),
            'porte' => 'B3',
            'statut' => 'a_lheure',
            'publie' => true,
        ]);

        (new PlanCabine($type))->materialiserPour($vol);

        return $vol;
    }

    protected function creerReservation(Flight $vol, array $attributs = []): Booking
    {
        return Booking::create([
            'pnr' => strtoupper(\Illuminate\Support\Str::random(6)),
            'flight_id' => $vol->id,
            'nom' => 'Traoré',
            'prenom' => 'Awa',
            'date_naissance' => Carbon::now()->subYears(31),
            'nationalite' => 'BFA',
            'numero_passeport' => 'BF'.random_int(1000000, 9999999),
            'passeport_expiration' => Carbon::now()->addYears(5),
            'email' => 'awa@example.com',
            'telephone' => '+22670000000',
            'classe' => 'economique',
            'franchise_nb' => 1,
            'franchise_kg' => 23,
            ...$attributs,
        ]);
    }

    /** Ouvre un dossier d'enregistrement et renvoie son jeton. */
    protected function demarrerEnregistrement(?Booking $reservation = null): string
    {
        $reservation ??= $this->reservation;

        return $this->postJson('/api/enregistrement/demarrer', [
            'numero_vol' => $reservation->flight->numero_vol,
            'numero_passeport' => $reservation->numero_passeport,
        ])->assertCreated()->json('jeton');
    }

    protected function agent(): User
    {
        return User::create([
            'name' => 'Agent Test',
            'email' => 'agent'.random_int(1, 99999).'@airburkina.bf',
            'password' => Hash::make('password'),
            'role' => 'agent',
        ]);
    }

    protected function admin(): User
    {
        return User::create([
            'name' => 'Admin Test',
            'email' => 'admin'.random_int(1, 99999).'@airburkina.bf',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);
    }
}
