# Envol — Modèle de données (V1)

Source : `AirPass_Cahier_des_charges.docx` v1.0.

## Vue d'ensemble

```
aircraft_types 1─n flights 1─n seats ◄── check_ins.seat_id
                     ├─n bookings 1─1 check_ins 1─n baggage_items
                     └─n flight_events 1─n passenger_notifications
users 1─n traveler_profiles
users 1─n audit_logs
```

## Tables

### `users` — comptes (EF-1.1, EF-1.2, EF-9.5)

| Colonne | Type | Note |
|---|---|---|
| id | bigint PK | |
| name | string | nom complet |
| email | string unique | identifiant de connexion |
| telephone | string null | |
| password | string | hashé (bcrypt) |
| role | enum | `passager` \| `agent` \| `admin` |
| actif | bool | désactivation sans suppression (EF-9.5) |

Le **mode invité** (EF-1.3) ne crée aucune ligne ici : l'accès se fait par
`numero_vol + numero_passeport`, et le dossier ouvert est ensuite adressé
par son `qr_jeton` (64 caractères aléatoires).

### `traveler_profiles` — profils voyageurs (EF-1.4)

`user_id`, `nom`, `prenom`, `date_naissance`, `nationalite`,
`numero_passeport`, `passeport_expiration`. Permet à un compte de gérer
les membres de sa famille.

### `aircraft_types` — flotte et plans de cabine (EF-4.1, §8.2)

| Colonne | Type | Note |
|---|---|---|
| code | string unique | ex. `E170`, `E195` |
| nom | string | ex. « Embraer 170 » |
| plan_cabine | json | rangées, lettres, classes, rangées d'issue de secours, sièges bloqués |

Le plan est **paramétrable par type d'avion** : ajouter un appareil à la flotte
ne demande aucun développement.

### `flights` — vols (EF-9.1, EF-9.2)

| Colonne | Type | Note |
|---|---|---|
| numero_vol | string | ex. `2J201` |
| aircraft_type_id | FK | détermine le plan de cabine |
| origine, destination | char(3) | codes IATA |
| depart_prevu, arrivee_prevue | datetime | horaire programmé |
| depart_estime | datetime null | horaire réel après retard (EF-9.3) |
| porte | string null | |
| statut | enum | `programme` \| `a_lheure` \| `retarde` \| `embarquement` \| `parti` \| `annule` |
| checkin_ouverture_h | int | défaut 24 — fenêtre paramétrable (EF-3.1, EF-9.2) |
| checkin_fermeture_h | int | défaut 3 |
| publie | bool | un vol non publié n'est pas visible des passagers |

### `bookings` — réservations / PNR (EF-2.1, EF-2.2)

`pnr` (6 caractères), `flight_id`, identité du passager (`nom`, `prenom`,
`date_naissance`, `nationalite`, `numero_passeport`, `passeport_expiration`),
`email`, `telephone`, `classe`, franchise bagages (`franchise_nb`,
`franchise_kg`) (EF-5.1).

En V1 cette table **tient lieu de DCS local** (§8.2 du CDC : version
intermédiaire alimentée par import). L'interface `DcsGateway` permet de
basculer vers le DCS réel d'Air Burkina sans toucher au reste du code.

### `seats` — sièges d'un vol (EF-4.2, EF-4.3)

`flight_id`, `code` (ex. `12A`), `rangee`, `lettre`, `classe`,
`type` (`standard` \| `issue_secours` \| `espace_sup` \| `premium`),
`statut` (`libre` \| `verrouille` \| `occupe` \| `bloque`),
`verrou_jeton`, `verrou_expire_le`.

L'occupant d'un siège n'est pas stocké ici mais lu depuis
`check_ins.seat_id` : une seule direction de référence, donc aucun risque de
désynchronisation entre les deux tables.

Le verrou temporaire (EF-4.3) empêche deux passagers de prendre le même
siège : posé à la sélection, il expire au bout de N minutes s'il n'est pas
confirmé.

### `check_ins` — enregistrements (module 6.3)

`booking_id`, `flight_id`, `seat_id` null, `statut`
(`en_cours` \| `enregistre` \| `annule` \| `embarque`), `enregistre_le`, `canal`
(`web` \| `mobile` \| `guichet`), `securite_confirmee` (EF-3.3),
`bagages_nb`, `bagages_poids_estime` (EF-5.2),
`reference` + `qr_jeton` pour la carte d'embarquement (EF-6.1).

Le double enregistrement (EF-3.4) est interdit par l'index unique
`(booking_id, actif)` : la colonne `actif` vaut 1 tant que l'enregistrement
est valide et NULL une fois annulé. MySQL comme SQLite autorisant plusieurs
NULL dans un index unique, un passager peut annuler puis se réenregistrer,
mais jamais avoir deux enregistrements actifs sur le même vol.

Le statut `en_cours` couvre le parcours entamé mais non finalisé : la carte
d'embarquement n'est émise qu'au passage à `enregistre`.

### `baggage_items` — bagages pesés au comptoir (EF-8.3)

`check_in_id`, `numero_etiquette`, `poids_reel`, `pese_par` (user agent).

### `flight_events` — changements publiés (EF-9.3, EF-7.2)

`flight_id`, `type` (`retard` \| `porte` \| `annulation` \| `horaire`),
`ancienne_valeur`, `nouvelle_valeur`, `message`, `publie_par`, `publie_le`.

### `passenger_notifications` — envois aux passagers (EF-7.2, EF-7.3)

`flight_event_id`, `check_in_id`, `canal` (`push` \| `email` \| `sms`),
`destinataire`, `sujet`, `contenu`, `statut`, `envoye_le`.

### `audit_logs` — journalisation (NF Traçabilité)

`user_id` null, `acteur` (description si invité), `action`, `entite`,
`entite_id`, `payload` json, `ip`, `created_at`.
Toute action sensible y passe : enregistrement, changement de siège,
publication d'un changement de vol.
