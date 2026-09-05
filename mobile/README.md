# Envol — application mobile

Application Flutter du service **Envol**, l'enregistrement en ligne des
passagers **Air Burkina**. Périmètre V1 : le parcours passager complet.

Elle consomme la même API que le site web ; aucun point d'entrée ne lui est
propre. Seul le canal déclaré change — `mobile` au lieu de `web` — pour que
le back-office distingue les deux dans ses statistiques d'adoption.

---

## Sommaire

1. [Ce que fait l'application](#ce-que-fait-lapplication)
2. [De quoi vous avez besoin](#de-quoi-vous-avez-besoin)
3. [Travailler dans VS Code](#travailler-dans-vs-code)
4. [Lancer l'application](#lancer-lapplication)
5. [Réseau — la règle des deux changements](#réseau--la-règle-des-deux-changements)
6. [Compiler](#compiler)
7. [Tests](#tests)
8. [Organisation du code](#organisation-du-code)
9. [Choix techniques](#choix-techniques)
10. [Dépannage](#dépannage)

---

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
embarquement). Il suppose un lecteur de code-barres et un grand écran, et
reste sur la console web.

---

## De quoi vous avez besoin

Le strict minimum, sur les trois systèmes, est le **SDK Flutter** et un
éditeur. Tout le reste dépend de la cible sur laquelle vous voulez voir
l'application tourner.

| Ce que vous voulez faire | Ce qu'il faut en plus | Xcode ? |
|---|---|---|
| Éditer, analyser, lancer les tests | rien | non |
| Lancer dans un navigateur | Chrome | non |
| Lancer sur émulateur Android | SDK Android (via Android Studio ou les *command-line tools*) | non |
| Lancer sur un téléphone Android | SDK Android + débogage USB activé | non |
| Lancer sur simulateur iOS | macOS | **oui** |
| Lancer sur un iPhone réel | macOS + identifiant Apple | **oui** |
| Produire un `.ipa` | macOS | **oui** |

### Sur un Mac qui n'a que VS Code

C'est un cas courant, et il fonctionne — à une exception près.

**Ce qui marche sans Xcode :** éditer le code, `flutter analyze`,
`flutter test`, et lancer l'application **dans Chrome**. Si le SDK Android
est installé, l'émulateur et les téléphones Android marchent aussi.

**Ce qui ne marche pas sans Xcode : tout iOS.** Le simulateur iOS est
livré *dans* Xcode, et la compilation passe par `xcodebuild`. VS Code n'est
qu'un éditeur : l'extension Flutter appelle les mêmes outils en dessous.
Installer seulement les *Command Line Tools* ne suffit pas non plus — elles
n'apportent ni simulateur ni chaîne de compilation iOS complète.

Installation minimale sur ce Mac :

```bash
# 1. SDK Flutter (Homebrew, ou téléchargement depuis flutter.dev)
brew install --cask flutter

# 2. Vérification — les lignes iOS seront en rouge, c'est normal et sans
#    conséquence tant que vous ne visez pas iOS.
flutter doctor

# 3. Dépendances du projet
cd mobile
flutter pub get

# 4. Lancement dans Chrome
flutter run -d chrome --dart-define=ENVOL_API=http://localhost:8001/api
```

`flutter doctor` signalera « Xcode not installed ». Ce n'est pas une erreur
à corriger : c'est l'état attendu de ce poste. Les cibles web et Android
restent pleinement utilisables.

**Si vous devez vraiment produire une application iOS sans Mac équipé**, un
service d'intégration continue avec des agents macOS (Codemagic, GitHub
Actions, Bitrise) compile l'archive à votre place. L'installer sur un
iPhone demande ensuite un identifiant Apple : gratuit, la signature vaut
7 jours ; avec un compte Apple Developer, un an.

---

## Travailler dans VS Code

Le dossier `mobile/.vscode/` est versionné et contient tout le nécessaire.

**Extensions** — à l'ouverture du dossier, VS Code proposera `Dart` et
`Flutter` (voir `.vscode/extensions.json`). Ces deux-là suffisent :
complétion, analyse, points d'arrêt, rechargement à chaud, DevTools.

**Ouvrez le dossier `mobile/`, pas la racine du dépôt.** L'extension
Flutter cherche un `pubspec.yaml` à la racine du dossier ouvert ; depuis la
racine du projet elle ne trouverait rien et resterait inactive.

**Lancer** — touche `F5`, puis choisissez une configuration :

| Configuration | Cible | Xcode ? |
|---|---|---|
| Envol — navigateur (Chrome) | Chrome, API sur `localhost` | non |
| Envol — navigateur, API sur le réseau | Chrome, API sur une autre machine | non |
| Envol — émulateur Android | émulateur, API sur `10.0.2.2` | non |
| Envol — simulateur iOS | simulateur, API sur `localhost` | oui |
| Envol — appareil réel (adresse à saisir) | téléphone ou iPhone branché | selon la cible |
| Envol — release sur appareil réel | version compilée, pour juger les performances | selon la cible |

Trois d'entre elles **demandent l'adresse IP du poste** au lancement, plutôt
que de la coder en dur : chaque machine a la sienne, et VS Code retient la
dernière valeur saisie.

La configuration « navigateur, API sur le réseau » couvre un cas fréquent :
un poste de développement qui n'héberge pas l'API — un Mac sans PHP, par
exemple — alors que le serveur tourne sur une autre machine du réseau. Le
navigateur peut l'appeler directement, sans relais : l'API renvoie
`Access-Control-Allow-Origin: *` sur `/api/*`, donc CORS ne bloque pas.

**Pendant le développement** : `r` dans la console recharge à chaud (l'état
de l'écran est conservé), `R` redémarre l'application. Le panneau
*Flutter DevTools* s'ouvre automatiquement et donne l'inspecteur de
widgets — précieux pour comprendre une mise en page qui déborde.

---

## Lancer l'application

L'API doit tourner. Depuis la racine du dépôt :

```bash
cd api
php artisan serve --port=8001                 # pour l'émulateur et le web
php artisan serve --host=0.0.0.0 --port=8001  # pour un appareil réel du réseau
```

`--host=0.0.0.0` est nécessaire pour qu'un téléphone atteigne l'API : par
défaut le serveur n'écoute que sur la boucle locale. Il devient alors
visible de tout votre réseau local — à ne faire que sur un réseau de
confiance.

Puis, selon la cible :

```bash
cd mobile

# Navigateur — ne demande ni Xcode ni SDK Android.
flutter run -d chrome --dart-define=ENVOL_API=http://localhost:8001/api

# Émulateur Android — 10.0.2.2 est l'alias de la machine hôte.
flutter run

# Simulateur iOS — le simulateur tourne sur le Mac, localhost convient.
flutter run --dart-define=ENVOL_API=http://localhost:8001/api

# Appareil réel — l'adresse IP du poste de développement.
flutter run --dart-define=ENVOL_API=http://192.168.1.20:8001/api
```

L'adresse par défaut, si vous ne passez rien, est
`http://10.0.2.2:8001/api` : elle vise l'émulateur Android, le cas le plus
fréquent en développement.

---

## Réseau — la règle des deux changements

C'est le piège numéro un du projet, et il se présente de la même façon sur
les deux plateformes.

Android et iOS **refusent tous deux le trafic HTTP en clair** par défaut.
L'API de développement étant servie en HTTP, il faut l'autoriser
explicitement — et l'autorisation ne suffit pas seule : l'application doit
aussi savoir où appeler.

**Sur un appareil réel, il faut donc deux changements concordants :**

| # | Quoi | Où |
|---|---|---|
| 1 | L'adresse que l'application appelle | `--dart-define=ENVOL_API=http://VOTRE_IP:8001/api` |
| 2 | L'autorisation du trafic en clair vers cette adresse | Android : `android/app/src/main/res/xml/network_security_config.xml`<br>iOS : clé `NSAppTransportSecurity` de `ios/Runner/Info.plist` |

Si vous n'en faites qu'un, l'application affichera « Le serveur Envol est
injoignable » sans autre explication — le système bloque avant que la
requête ne parte.

Les adresses déjà autorisées : `10.0.2.2` et `10.0.3.2` (alias de l'hôte
depuis les émulateurs Android), `localhost`, `127.0.0.1`, et `192.168.1.10`
(le poste ayant servi au développement). Ajoutez la vôtre à côté.

Les deux fichiers refusent le clair par défaut — `cleartextTrafficPermitted`
à `false`, `NSAllowsArbitraryLoads` à `false` — et n'ouvrent que ces
adresses nommées. La production devra être servie en HTTPS, comme l'exige
la section « Sécurité » du cahier des charges.

Pour trouver votre adresse IP :

```bash
# macOS / Linux
ipconfig getifaddr en0        # macOS, Wi-Fi
hostname -I                   # Linux

# Windows
ipconfig                      # ligne « Adresse IPv4 » de la carte Wi-Fi
```

---

## Compiler

### Android

```bash
flutter build apk --release                  # APK universel  (~51 Mo)
flutter build apk --release --split-per-abi  # arm64 ~19 Mo, armeabi-v7a ~16 Mo
```

Les APK sortent dans `build/app/outputs/flutter-apk/`. Pour un téléphone
récent, `app-arm64-v8a-release.apk` suffit ; l'APK universel n'a d'intérêt
que si vous ne savez pas sur quel appareil il sera installé.

Pour un APK destiné à un test réseau, figez l'adresse à la compilation :

```bash
flutter build apk --release --split-per-abi \
  --dart-define=ENVOL_API=http://192.168.1.20:8001/api
```

L'installation se fait par `adb install <fichier>.apk`, ou en copiant le
fichier sur le téléphone et en l'ouvrant depuis le gestionnaire de fichiers
— cette seconde voie ne demande aucun débogage USB.

### iOS

```bash
flutter build ipa --release
```

Exige macOS et Xcode. L'archive est produite dans `build/ios/ipa/`.

---

## Tests

```bash
flutter analyze   # analyse statique — doit rendre « No issues found! »
flutter test      # 28 tests
```

Les tests couvrent trois choses :

- **`test/format_test.dart`** — le formatage des dates en français, écrit à
  la main : mois abrégés, minuit, durées restantes, codes OACI inconnus.
- **`test/client_test.dart`** — le contrat du client d'API face à un faux
  serveur : chemins appelés, corps envoyés, déclaration du canal `mobile`,
  et traduction des erreurs Laravel (message simple comme dictionnaire de
  validation) en une phrase affichable.
- **`test/plan_cabine_test.dart`** — les règles visibles du plan de cabine :
  un siège occupé ou non attribuable ne doit pas répondre au toucher, les
  rangées sont ordonnées même si l'API les envoie en désordre, et chaque
  siège porte une description pour les lecteurs d'écran.

Aucun de ces tests n'a besoin d'un serveur : le client d'API est branché sur
un `MockClient`. Ils tournent donc partout, y compris sur un Mac sans Xcode.

---

## Organisation du code

```
lib/
  main.dart                     application, thème persistant
  format.dart                   dates et libellés en français
  api/client.dart               client de l'API, erreurs traduites
  theme/palette.dart            jetons de couleur, clair et sombre
  theme/theme_envol.dart        thèmes Material 3
  composants/
    marque.dart                 logo et mot-symbole
    blocs.dart                  alertes, étiquettes, cartes, fil d'étapes
    plan_cabine.dart            plan interactif des sièges
    carte_embarquement.dart     carte, QR, souche
  ecrans/
    accueil.dart                héros et recherche de réservation
    enregistrement.dart         parcours en quatre étapes
    carte.dart                  carte d'embarquement et mode hors ligne
    statut_vol.dart             consultation d'un vol
assets/
  polices/                      Sora, Inter, JetBrains Mono
  images/                       héros et cabine
```

---

## Choix techniques

**Les polices sont embarquées** dans l'application plutôt que téléchargées à
l'exécution. Une carte d'embarquement consultée en salle d'embarquement,
sans réseau, ne doit dépendre de rien. C'est aussi pourquoi le dossier est
recopié dans le stockage local à chaque consultation réussie, et réaffiché
avec un bandeau d'avertissement quand l'API est injoignable.

**Les dates sont formatées à la main**, sans `intl`. Ce dernier exige
`initializeDateFormatting('fr_FR')` avant tout usage et lève une exception
si on l'oublie — un piège à l'exécution pour dix mots de vocabulaire.

**Les jetons de couleur voyagent dans une extension de thème.** Material ne
connaît qu'une poignée de rôles (`primary`, `surface`, `error`…) ; Envol en
utilise davantage — trois niveaux de surface, trois niveaux de texte, une
couleur or. On les lit partout par `context.palette`.

**Le thème clair n'est pas le négatif du sombre** : fond ivoire plutôt que
blanc, encre brune plutôt que noir, et teintes d'accent assombries pour
tenir le contraste AA. Les mêmes valeurs que le web, portées en Dart.

**Le QR est toujours tracé en noir sur blanc**, même en thème sombre : un
lecteur optique attend ce contraste, et l'écran d'un téléphone en pleine
lumière ne pardonne rien.

---

## Dépannage

### « Le serveur Envol est injoignable »

Dans l'ordre :

1. L'API tourne-t-elle ? `curl http://VOTRE_IP:8001/api/recherche-vol`
   depuis le poste doit répondre autre chose qu'une erreur de connexion.
2. A-t-elle été lancée avec `--host=0.0.0.0` ? Sans cela elle n'écoute que
   sur la boucle locale et reste invisible du téléphone.
3. Les deux changements de la section « Réseau » ont-ils bien été faits
   *tous les deux* ?
4. Le téléphone est-il sur le même Wi-Fi ? Certaines box isolent les
   clients entre eux (« AP isolation ») : les appareils ne se voient alors
   pas, même sur le même réseau.

### Le téléphone Android n'apparaît pas dans `flutter devices`

Le débogage USB doit être actif *et* le téléphone doit avoir ré-énuméré :

1. **Paramètres → À propos du téléphone** → tapez 7 fois sur **Numéro de
   build**.
2. **Options pour les développeurs** → vérifiez que l'interrupteur du haut,
   celui du menu lui-même, est activé — sinon les réglages en dessous
   restent inertes bien que cochés — puis activez **Débogage USB**.
3. **Débranchez et rebranchez** le câble, écran déverrouillé. Une fenêtre
   « Autoriser le débogage USB ? » doit apparaître.
4. Basculez la notification USB sur **Transférer des fichiers**.

Pour vérifier côté poste : `adb devices` doit lister l'appareil. S'il reste
vide alors que le téléphone est visible dans l'explorateur de fichiers,
c'est que sa configuration USB n'a pas changé — le débogage n'est pas
réellement actif.

Sans débogage USB, l'installation par copie de l'APK reste possible et
suffit à tester.

### Le build de release Android échoue sur les caches Kotlin

Message du type *« Could not close incremental caches »*. La compilation
incrémentale de Kotlin échoue à libérer ses fichiers sous Windows. Le
projet la désactive déjà dans `android/gradle.properties`
(`kotlin.incremental=false`). Si le problème revient :

```bash
flutter clean && flutter pub get
```

### `flutter doctor` signale Xcode en rouge sur Mac

Attendu si Xcode n'est pas installé. Cela n'empêche ni les tests, ni le
web, ni Android. Seules les cibles iOS sont concernées.

### L'émulateur Android refuse de démarrer

Vérifiez l'espace disque. Les images système et les AVD occupent
facilement plusieurs dizaines de gigaoctets, et l'émulateur refuse de
démarrer sous un certain seuil — le message le dit explicitement dans sa
sortie.
