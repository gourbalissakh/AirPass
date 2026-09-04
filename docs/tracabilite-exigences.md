# AirPass — Matrice de traçabilité des exigences

Chaque exigence du cahier des charges v1.0 (§6 et §7) est reliée à son
implémentation et à son test de recette. C'est le livrable « Plan de
recette » du §11.

**État du prototype au 31/08/2026 : 46 tests automatisés, 46 passés.**

Lancer la recette : `cd api && php artisan test`

Colonne **État** : `fait` · `V2` (renvoyé à une version ultérieure).

## 6.1 Compte & Authentification

| Code | Exigence | Prio. | Implémentation | Test | État |
|---|---|---|---|---|---|
| EF-1.1 | Création de compte | Haute | `AuthController@inscription` | `CompteTest::test_ef_1_1_inscription` | fait |
| EF-1.2 | Connexion / déconnexion | Haute | `AuthController@connexion`, `@deconnexion` | `CompteTest::test_ef_1_2_*` | fait |
| EF-1.3 | Mode invité (vol + passeport) | Haute | `RechercheVolController`, dossier adressé par `qr_jeton` | `EnregistrementTest::test_ef_1_3_mode_invite` | fait |
| EF-1.4 | Profils voyageurs multiples | Moyenne | table `traveler_profiles`, modèle `TravelerProfile` | — | V2 |

La réinitialisation du mot de passe (EF-1.2) repose sur le mécanisme natif de
Laravel (table `password_reset_tokens`) ; l'envoi du courriel demande un
fournisseur SMTP, hors périmètre du prototype.

## 6.2 Recherche de vol

| Code | Exigence | Prio. | Implémentation | Test | État |
|---|---|---|---|---|---|
| EF-2.1 | Recherche vol+passeport ou PNR+nom | Haute | `RechercheVolController` | `RechercheVolTest::test_ef_2_1_*` | fait |
| EF-2.2 | Vérification auprès du DCS | Haute | interface `DcsGateway` → `DcsLocal` | idem | fait |
| EF-2.3 | État de la fenêtre + date d'ouverture | Haute | `FenetreEnregistrement` | `RechercheVolTest::test_ef_2_3_*` (3 cas) | fait |
| EF-2.4 | Message clair si vol introuvable | Moyenne | réponse 404 typée, sans fuite d'information | `RechercheVolTest::test_ef_2_4_*` | fait |

## 6.3 Enregistrement en ligne

| Code | Exigence | Prio. | Implémentation | Test | État |
|---|---|---|---|---|---|
| EF-3.1 | Seulement dans la fenêtre autorisée | Haute | `EnregistrementService::demarrer()` | `EnregistrementTest::test_ef_3_1_*` | fait |
| EF-3.2 | Informations passager (API/PNR) | Haute | `EnregistrementController@informations` | `EnregistrementTest::test_ef_3_2_et_3_3_*` | fait |
| EF-3.3 | Questions de sûreté | Moyenne | `check_ins.securite_confirmee`, bloquant à la finalisation | idem | fait |
| EF-3.4 | Pas de double enregistrement | Haute | index unique `(booking_id, actif)` + reprise du dossier | `EnregistrementTest::test_ef_3_4_*` | fait |
| EF-3.5 | Annulation avant clôture | Moyenne | `EnregistrementService::annuler()`, libère le siège | `EnregistrementTest::test_ef_3_5_*` (2 cas) | fait |

## 6.4 Choix de siège

| Code | Exigence | Prio. | Implémentation | Test | État |
|---|---|---|---|---|---|
| EF-4.1 | Plan interactif selon l'appareil | Haute | `PlanCabine`, `aircraft_types.plan_cabine`, composant `PlanCabine.jsx` | `SiegeTest::test_ef_4_1_*` | fait |
| EF-4.2 | Statut temps réel des sièges | Haute | `SiegeService::etatCabine()` | `SiegeTest::test_ef_4_2_*` | fait |
| EF-4.3 | Verrou temporaire du siège | Haute | `SiegeService::verrouiller()`, `SELECT … FOR UPDATE` | `SiegeTest::test_ef_4_3_*` (3 cas : pose, conflit, expiration) | fait |
| EF-4.4 | Attribution automatique | Moyenne | `SiegeService::attribuerAutomatiquement()` | `SiegeTest::test_ef_4_4_*` | fait |
| EF-4.5 | Éligibilité issues de secours | Moyenne | `SiegeService::verifierEligibilite()`, âge minimum 15 ans | `SiegeTest::test_ef_4_5_*` | fait |

## 6.5 Bagages

| Code | Exigence | Prio. | Implémentation | Test | État |
|---|---|---|---|---|---|
| EF-5.1 | Franchise applicable affichée | Haute | `FranchiseBagage` | `BagagesEtCarteTest::test_ef_5_1_et_5_2_*` | fait |
| EF-5.2 | Déclaration nombre + poids estimé | Haute | `EnregistrementService::declarerBagages()` | idem | fait |
| EF-5.3 | Alerte dépassement (paiement au comptoir) | Moyenne | `FranchiseBagage::depassement()` | `BagagesEtCarteTest::test_ef_5_3_*` | fait |
| EF-5.4 | Bagages déclarés visibles au guichet | Haute | vue agent `GuichetController@dossier` | `BagagesEtCarteTest::test_ef_5_4_*`, `GuichetTest::test_ef_8_1_et_8_2_*` | fait |

## 6.6 Carte d'embarquement

| Code | Exigence | Prio. | Implémentation | Test | État |
|---|---|---|---|---|---|
| EF-6.1 | Carte numérique avec QR | Haute | `CarteEmbarquementService`, composant `CarteEmbarquement.jsx` | `BagagesEtCarteTest::test_ef_6_1_*` | fait |
| EF-6.2 | Consultation hors-ligne | Moyenne | copie locale dans `localStorage`, bandeau « hors ligne » | — | fait (web) |
| EF-6.3 | Envoi e-mail / Apple ou Google Wallet | Basse | — | — | V2 |
| EF-6.4 | Impression depuis le web | Moyenne | feuille de style `@media print`, classe `carte-imprimable` | — | fait |

## 6.7 Suivi de vol & Notifications

| Code | Exigence | Prio. | Implémentation | Test | État |
|---|---|---|---|---|---|
| EF-7.1 | Consultation du statut du vol | Haute | `VolController@statut`, page `StatutVol.jsx` | `BackOfficeTest::test_ef_7_1_*` | fait |
| EF-7.2 | Notification en cas de changement | Haute | `NotificationService::diffuser()` → `passenger_notifications` | `BackOfficeTest::test_ef_9_3_et_7_2_*` | fait |
| EF-7.3 | Activation / désactivation des rappels | Moyenne | — | — | V2 |

Les notifications sont **produites et mises en file** (canal e-mail / SMS / push
selon les coordonnées du passager) mais pas émises : brancher un fournisseur
revient à consommer les lignes au statut `en_attente`.

## 6.8 Vue agent (guichet)

| Code | Exigence | Prio. | Implémentation | Test | État |
|---|---|---|---|---|---|
| EF-8.1 | Recherche nom / vol / dossier / scan QR | Haute | `GuichetController@recherche`, une seule zone de saisie | `GuichetTest::test_ef_8_1_*` (2 cas) | fait |
| EF-8.2 | Dossier visible immédiatement | Haute | `GuichetController@dossier` | `GuichetTest::test_ef_8_1_et_8_2_*` | fait |
| EF-8.3 | Remise des bagages + embarquement | Haute | `@peserBagage`, `@embarquer`, table `baggage_items` | `GuichetTest::test_ef_8_3_*` | fait |
| EF-8.4 | Modifier un siège / enregistrer au comptoir | Moyenne | `@changerSiege`, `@enregistrerAuComptoir` | `GuichetTest::test_ef_8_4_*` (3 cas) | fait |

## 6.9 Back-office administrateur

| Code | Exigence | Prio. | Implémentation | Test | État |
|---|---|---|---|---|---|
| EF-9.1 | CRUD et publication des vols | Haute | `Admin\VolController`, sièges générés du plan de cabine | `BackOfficeTest::test_ef_9_1_*` | fait |
| EF-9.2 | Fenêtre d'enregistrement paramétrable | Haute | `checkin_ouverture_h` / `checkin_fermeture_h` par vol | `BackOfficeTest::test_ef_9_2_*` | fait |
| EF-9.3 | Publication d'un changement de vol | Haute | `Admin\ChangementVolController` | `BackOfficeTest::test_ef_9_3_*` (2 cas) | fait |
| EF-9.4 | Tableau de bord statistiques | Moyenne | `Admin\TableauBordController` | `BackOfficeTest::test_ef_9_4_*` | fait |
| EF-9.5 | Gestion des droits agents / admins | Moyenne | `users.role`, middleware `VerifierRole` | `BackOfficeTest::test_ef_9_5_*`, `GuichetTest::test_role_passager_refuse` | fait |

## 7. Exigences non fonctionnelles

| Exigence | Traitement dans le prototype |
|---|---|
| **Plateformes** | Web responsive (React + Tailwind), utilisable du mobile au poste fixe. L'application mobile native reste à produire : l'API étant déjà partagée, elle consommera les mêmes points d'entrée. |
| **Performance (< 3 s)** | Index sur `(flight_id, statut)`, `(flight_id, code)`, `(depart_prevu, statut)` ; le plan de cabine est servi en une requête. |
| **Disponibilité 99,5 %** | Relève de l'exploitation ; le point de santé `/up` est exposé pour la supervision. |
| **Sécurité** | Mots de passe hachés (bcrypt), jetons Sanctum, `qr_jeton` de 64 caractères aléatoires jamais renvoyé dans les listes, dossiers non énumérables. HTTPS à assurer au déploiement. |
| **Scalabilité** | Aucun état en mémoire : le verrou de siège vit en base, dans une transaction avec verrouillage de ligne. L'API peut être répliquée. |
| **Interopérabilité** | Interface `DcsGateway` — implémentation `DcsLocal` en V1, à remplacer par l'implémentation du DCS réel sans toucher au reste. |
| **Ergonomie** | Parcours en 5 étapes (recherche, informations, bagages, siège, confirmation), tout en français, libellés explicites. |
| **Connectivité limitée** | La carte d'embarquement est conservée en local et réaffichée avec un bandeau d'avertissement quand l'API est injoignable. |
| **Journalisation** | Table `audit_logs` alimentée par `Journal::ecrire()` sur toute action sensible ; les 20 dernières entrées sont visibles dans le back-office. |
| **Maintenabilité** | Découpage par module métier calqué sur les sections 6.x du cahier des charges. |

## Écarts assumés

1. **Application mobile native** — hors périmètre du prototype. L'API et le
   modèle de données sont conçus pour la servir sans modification.
2. **EF-1.4, EF-6.3, EF-7.3** — priorités Moyenne et Basse, renvoyées à une
   version ultérieure ; le schéma les anticipe (`traveler_profiles` existe).
3. **Émission réelle des notifications** — les envois sont mis en file, pas
   transmis : cela demande un contrat avec un fournisseur SMS/push.
4. **DCS réel** — conformément au §8.2 du cahier des charges, le prototype
   fonctionne sur une base de vols et réservations gérée par AirPass.
