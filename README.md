# Envol — plateforme d'enregistrement en ligne

**Envol** est le nom du service ; **Air Burkina** est la compagnie qui
l'opère. Le prototype répond au cahier des charges *AirPass* v1.0
(enregistrement en ligne, choix de siège, déclaration de bagages, carte
d'embarquement numérique, vue guichet, back-office) — « AirPass » était le
nom de travail du cahier des charges, « Envol » est celui du produit.

## Contenu

| Dossier | Rôle |
|---|---|
| `api/` | Back-end Laravel — API REST, logique métier, base de données |
| `web/` | Front-end React (passager, agent guichet, back-office) |
| `docs/` | Modèle de données, traçabilité des exigences, crédits médias |

## Démarrage

### Avec Docker (recommandé)

```bash
docker compose up -d --build
```

- API : http://localhost:8001
- Web : http://localhost:5174

### En local

```bash
# API
cd api
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8001

# Web
cd web
npm install
npm run dev
```

## Comptes de démonstration

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Administrateur | admin@airburkina.bf | password |
| Agent guichet | agent@airburkina.bf | password |
| Passager | passager@example.com | password |

Le **mode invité** (EF-1.3) ne demande aucun compte : numéro de vol +
numéro de passeport suffisent.

## Identité visuelle

Le système de design vit dans un seul fichier, `web/src/index.css`. Deux
thèmes complets y sont définis en variables CSS, exposées à Tailwind par
`@theme inline` — on bascule de l'un à l'autre sans recompiler.

| | Sombre | Clair |
|---|---|---|
| Fond | `#0a0f1f` | `#fbf8f3` (ivoire chaud) |
| Texte | `#edf2ff` | `#1c1710` (encre brune) |
| Terre cuite | `#f26b3a` | `#c2451a` |
| Or | `#ffc24b` | `#a8730b` |

Le thème clair n'est pas le négatif du sombre : fond ivoire plutôt que
blanc, encre brune plutôt que noir, ombres teintées de terre, et teintes
d'accent assombries pour tenir le contraste AA (terre cuite 5,6:1 · or
4,6:1 · vert 5,2:1 · rouge 6,1:1).

Polices : **Sora** pour les titres — grotesque géométrique, large, qui tient
le très grand corps sans maniérisme ; **Inter** pour le texte courant et les
écrans denses, avec ses chiffres alignés indispensables aux tableaux du
back-office ; **JetBrains Mono** pour les codes (PNR, références, codes OACI).

Logo : un « E » couché — trois barres inclinées de 18°, la première
terminée en pointe, les suivantes en traînée. Tracé dans
`web/src/composants/Logo.jsx` et `web/public/favicon.svg`.

Iconographie : **lucide-react** partout, y compris dans les écrans
d'exploitation. Aucun caractère typographique n'est utilisé comme icône —
un « ✈ » ou un « ▤ » ne se met pas à l'échelle et change de dessin d'une
plateforme à l'autre.

Deux utilitaires méritent d'être connus avant de toucher au CSS :

- `.sur-photo` — pour tout texte posé sur une image. Le voile est sombre
  dans les deux thèmes, donc les jetons y repassent en version « nuit ».
  L'utilitaire réaffecte aussi `color` : `body` transmet une couleur déjà
  calculée, et redéfinir `--texte` sur un descendant ne la recalcule pas.
- `.anime-centre` — pour toute forme SVG animée en échelle ou en rotation.
  Sans `transform-box: fill-box`, un `scale` se rapporte à l'origine du
  repère et déplace la forme au lieu de la faire respirer sur place.

## Médias

Toutes les photographies et la vidéo viennent de Wikimedia Commons et sont
réutilisables. L'attribution exigée par les licences CC BY / CC BY-SA est
tenue dans [`docs/credits-photos.md`](docs/credits-photos.md).

L'inventaire des visuels — chemins, légendes, cadrage — est centralisé
dans `web/src/medias.js` : les composants y puisent au lieu de coder les
fichiers en dur.

## Périmètre du prototype

Ce prototype couvre les exigences de priorité **Haute** du cahier des
charges. L'état exigence par exigence est tenu à jour dans
[`docs/tracabilite-exigences.md`](docs/tracabilite-exigences.md).

Conformément au §8.2 du cahier des charges, l'accès au DCS réel d'Air
Burkina n'étant pas disponible, le prototype fonctionne avec une base de
vols et de réservations gérée par Envol. L'interface `DcsGateway` isole ce
choix : brancher le DCS réel ne demandera qu'une nouvelle implémentation de
cette interface.

## Tests

```bash
cd api && php artisan test     # 46 tests, 165 assertions
cd web && npm run build        # compilation de production
cd web && npm run lint         # oxlint
```
