# Envol — application mobile

Application Flutter du service **Envol**, l'enregistrement en ligne des
passagers **Air Burkina**. Périmètre V1 : le parcours passager complet.

Elle consomme la même API que le site web ; aucun point d'entrée ne lui est
propre. Seul le canal déclaré change — `mobile` au lieu de `web` — pour que
le back-office distingue les deux dans ses statistiques d'adoption.

## Ce que fait l'application

| Écran | Exigences |
|---|---|
| Accueil et recherche de réservation | EF-1.3, EF-2.1, EF-2.4 |
| Enregistrement — informations et sûreté | EF-3.2, EF-3.3 |
| Enregistrement — bagages en soute | EF-5.2, EF-5.3 |
| Enregistrement — plan de cabine et siège | EF-4.1 à EF-4.5 |
| Carte d'embarquement, QR, mode hors ligne | EF-6.1, EF-6.2, EF-6.4 |
| Statut d'un vol | EF-7.1 |

Hors périmètre V1 : le module comptoir (scan par l'agent, pesée,
embarquement), qui reste sur la console web.

## Démarrage

L'API doit tourner. Depuis la racine du dépôt :

```bash
cd api && php artisan serve --port=8001
```

Puis, selon la cible :

```bash
cd mobile

# Émulateur Android — 10.0.2.2 est l'alias de la machine hôte.
flutter run

# Téléphone réel sur le même Wi-Fi : donnez l'IP du poste de développement.
flutter run --dart-define=ENVOL_API=http://192.168.1.20:8001/api
```

Sur un téléphone réel, il faut **deux** changements concordants :

1. l'adresse ci-dessus, via `dart-define` ;
2. cette même adresse ajoutée dans
   `android/app/src/main/res/xml/network_security_config.xml`.

Sans le second, Android bloque la connexion : la politique réseau du projet
refuse le trafic en clair par défaut, et n'autorise que les adresses de
développement connues. C'est volontaire — l'API de production devra être
servie en HTTPS, comme l'exige la section « Sécurité » du cahier des charges.

## Compilation Android

```bash
flutter build apk --release                  # APK universel  (~51 Mo)
flutter build apk --release --split-per-abi  # arm64 ~19 Mo, armeabi-v7a ~16 Mo
```

Les APK sortent dans `build/app/outputs/flutter-apk/`. Pour un téléphone
récent, `app-arm64-v8a-release.apk` suffit.

## iOS

Le code Dart est partagé : il n'y a rien de spécifique à écrire. Le projet
Xcode est dans `ios/`, l'application s'appelle « Envol » et vise iOS 13
minimum.

En revanche, **compiler pour iOS exige macOS**. Xcode et la signature de
code n'existent que sur Mac ; ce n'est pas une limite du projet mais une
contrainte d'Apple. Sur un Mac :

```bash
cd mobile
flutter run                                    # simulateur iOS
flutter run --dart-define=ENVOL_API=http://192.168.1.20:8001/api   # iPhone réel
flutter build ipa --release                    # archive pour distribution
```

Sur le **simulateur**, l'API est joignable par `localhost` : le simulateur
tourne sur le Mac lui-même, contrairement à l'émulateur Android qui impose
l'alias `10.0.2.2`. Sur un **iPhone réel**, il faut, comme sous Android,
deux changements concordants :

1. l'adresse du poste en `dart-define` ;
2. cette même adresse déclarée dans `NSExceptionDomains`, au sein de la clé
   `NSAppTransportSecurity` de `ios/Runner/Info.plist`.

Sans le second, iOS bloque la connexion. La politique du projet refuse le
trafic en clair par défaut (`NSAllowsArbitraryLoads` à `false`) et n'ouvre
que les adresses de développement connues — le pendant exact du
`network_security_config.xml` d'Android.

Pour installer sur un iPhone il faut un identifiant Apple : gratuit, la
signature vaut 7 jours et doit être renouvelée ; avec un compte Apple
Developer, elle vaut un an. Sans Mac sous la main, un service
d'intégration continue avec des agents macOS (Codemagic, GitHub Actions,
Bitrise) produit l'archive sans en posséder un.

## Vérifications

```bash
flutter analyze   # 0 problème
flutter test      # 28 tests
```

Les tests couvrent trois choses : le formatage des dates en français, le
contrat du client d'API face à un faux serveur (chemins, corps envoyés,
traduction des erreurs Laravel), et les règles visibles du plan de cabine —
un siège occupé ou non attribuable ne doit pas répondre au toucher.

## Organisation

```
lib/
  main.dart                     application, thème persistant
  format.dart                   dates et libellés en français
  api/client.dart               client de l'API, erreurs traduites
  theme/palette.dart            jetons de couleur, clair et sombre
  theme/theme_envol.dart        thèmes Material 3
  composants/                   marque, briques d'interface, plan de cabine,
                                carte d'embarquement
  ecrans/                       accueil, enregistrement, carte, statut de vol
```

## Choix à connaître

**Les polices sont embarquées** dans l'APK plutôt que téléchargées à
l'exécution. Une carte d'embarquement consultée en salle d'embarquement, sans
réseau, ne doit dépendre de rien. C'est aussi pourquoi le dossier est
recopié dans le stockage local à chaque consultation réussie.

**Les dates sont formatées à la main**, sans `intl`. Ce dernier exige
`initializeDateFormatting('fr_FR')` avant tout usage et lève une exception si
on l'oublie — un piège pour dix mots de vocabulaire.

**Les jetons de couleur voyagent dans une extension de thème.** Material ne
connaît qu'une poignée de rôles ; Envol utilise trois niveaux de surface et
trois niveaux de texte. On les lit partout par `context.palette`.

**Le thème clair n'est pas le négatif du sombre** : fond ivoire plutôt que
blanc, encre brune plutôt que noir, et teintes d'accent assombries pour tenir
le contraste AA. Les mêmes valeurs que le web, portées en Dart.
