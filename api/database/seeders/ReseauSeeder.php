<?php

namespace Database\Seeders;

use App\Models\AircraftType;
use App\Models\Booking;
use App\Models\Flight;
use App\Support\PlanCabine;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Réseau régional Air Burkina et réservations de démonstration.
 *
 * Les vols sont positionnés relativement à « maintenant » pour que la
 * démonstration tombe toujours dans la bonne fenêtre d'enregistrement :
 *   - un vol à H+8   : enregistrement OUVERT
 *   - un vol à H+40  : enregistrement PAS ENCORE OUVERT
 *   - un vol à H+2   : enregistrement CLÔTURÉ
 */
class ReseauSeeder extends Seeder
{
    /** Réseau : Ouagadougou est le hub (§ analyse de l'existant). */
    private const LIGNES = [
        ['2J201', 'OUA', 'DSS', 'E170', 8,  3.0],   // Ouagadougou → Dakar
        ['2J202', 'DSS', 'OUA', 'E170', 40, 3.0],
        ['2J310', 'OUA', 'ABJ', 'E170', 2,  1.5],   // Ouagadougou → Abidjan
        ['2J420', 'OUA', 'BKO', 'E195', 26, 1.5],   // Ouagadougou → Bamako
        ['2J530', 'OUA', 'LFW', 'E170', 12, 1.75],  // Ouagadougou → Lomé
    ];

    private const PRENOMS = [
        'Awa', 'Ibrahim', 'Fatoumata', 'Souleymane', 'Aminata', 'Moussa',
        'Kadiatou', 'Boubacar', 'Mariam', 'Adama', 'Salif', 'Rokia',
        'Issa', 'Bintou', 'Ousmane', 'Djeneba', 'Hamidou', 'Nafissatou',
    ];

    private const NOMS = [
        'Traoré', 'Ouédraogo', 'Sawadogo', 'Compaoré', 'Diallo', 'Kaboré',
        'Sanogo', 'Zongo', 'Konaté', 'Barry', 'Nikiema', 'Bamba',
    ];

    public function run(): void
    {
        $maintenant = Carbon::now();

        foreach (self::LIGNES as [$numero, $origine, $destination, $codeAvion, $heures, $duree]) {
            $type = AircraftType::where('code', $codeAvion)->firstOrFail();
            $depart = $maintenant->copy()->addHours($heures)->setSeconds(0)->setMinutes(30);

            $vol = Flight::updateOrCreate(
                ['numero_vol' => $numero, 'depart_prevu' => $depart],
                [
                    'aircraft_type_id' => $type->id,
                    'origine' => $origine,
                    'destination' => $destination,
                    'arrivee_prevue' => $depart->copy()->addMinutes((int) ($duree * 60)),
                    'porte' => 'B'.random_int(1, 6),
                    'statut' => 'a_lheure',
                    'checkin_ouverture_h' => 24,
                    'checkin_fermeture_h' => 3,
                    'publie' => true,
                ],
            );

            (new PlanCabine($type))->materialiserPour($vol);

            $this->reservationsPour($vol);
        }
    }

    /** Une trentaine de réservations par vol, dont trois nominatives. */
    private function reservationsPour(Flight $vol): void
    {
        if ($vol->bookings()->exists()) {
            return;
        }

        // Passagers repères, faciles à retrouver pendant une démonstration.
        $reperes = [
            ['Awa', 'Traoré', 'BF1234567', 'passager@example.com'],
            ['Ibrahim', 'Ouédraogo', 'BF7654321', null],
            ['Fatoumata', 'Diallo', 'SN9988776', null],
        ];

        foreach ($reperes as $i => [$prenom, $nom, $passeport, $email]) {
            Booking::create([
                'pnr' => $this->pnr(),
                'flight_id' => $vol->id,
                'nom' => $nom,
                'prenom' => $prenom,
                'date_naissance' => Carbon::now()->subYears(28 + $i)->subDays(120),
                'nationalite' => 'BFA',
                'numero_passeport' => $passeport,
                'passeport_expiration' => Carbon::now()->addYears(4),
                'email' => $email,
                'telephone' => '+2267'.random_int(1000000, 9999999),
                'classe' => $i === 0 ? 'affaires' : 'economique',
                'franchise_nb' => $i === 0 ? 2 : 1,
                'franchise_kg' => 23,
            ]);
        }

        foreach (range(1, 27) as $n) {
            Booking::create([
                'pnr' => $this->pnr(),
                'flight_id' => $vol->id,
                'nom' => self::NOMS[array_rand(self::NOMS)],
                'prenom' => self::PRENOMS[array_rand(self::PRENOMS)],
                'date_naissance' => Carbon::now()->subYears(random_int(19, 64)),
                'nationalite' => 'BFA',
                'numero_passeport' => 'BF'.random_int(1000000, 9999999),
                'passeport_expiration' => Carbon::now()->addYears(random_int(2, 8)),
                'telephone' => '+2267'.random_int(1000000, 9999999),
                'classe' => 'economique',
                'franchise_nb' => 1,
                'franchise_kg' => 23,
            ]);
        }
    }

    private function pnr(): string
    {
        do {
            $pnr = strtoupper(Str::random(6));
        } while (Booking::where('pnr', $pnr)->exists());

        return $pnr;
    }
}
