<?php

return [

    /*
     |----------------------------------------------------------------------
     | Fenêtre d'enregistrement en ligne (EF-3.1, EF-9.2)
     |----------------------------------------------------------------------
     | Valeurs par défaut, en heures avant le départ. Chaque vol peut les
     | surcharger via ses colonnes checkin_ouverture_h / checkin_fermeture_h.
     */
    'ouverture_h' => (int) env('ENVOL_OUVERTURE_H', 24),
    'fermeture_h' => (int) env('ENVOL_FERMETURE_H', 3),

    /*
     |----------------------------------------------------------------------
     | Verrou de siège (EF-4.3)
     |----------------------------------------------------------------------
     | Durée pendant laquelle un siège sélectionné reste réservé au passager
     | avant d'être remis à la disposition des autres.
     */
    'verrou_siege_minutes' => (int) env('ENVOL_VERROU_SIEGE_MINUTES', 10),

    /*
     |----------------------------------------------------------------------
     | Règles d'éligibilité aux sièges d'issue de secours (EF-4.5)
     |----------------------------------------------------------------------
     */
    'issue_secours_age_min' => 15,

    'compagnie' => [
        'nom' => 'Air Burkina',
        'code' => '2J',
    ],
];
