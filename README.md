# AirPass — plateforme d'enregistrement en ligne

Prototype répondant au cahier des charges *AirPass* v1.0 rédigé pour
**Air Burkina** (enregistrement en ligne, choix de siège, déclaration de
bagages, carte d'embarquement numérique, vue guichet, back-office).

## Contenu

| Dossier | Rôle |
|---|---|
| `api/` | Back-end Laravel — API REST, logique métier, base de données |
| `web/` | Front-end React (passager, agent guichet, back-office) |
| `docs/` | Modèle de données, matrice de traçabilité des exigences |

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

## Périmètre du prototype

Ce prototype couvre les exigences de priorité **Haute** du cahier des
charges. L'état exigence par exigence est tenu à jour dans
[`docs/tracabilite-exigences.md`](docs/tracabilite-exigences.md).

Conformément au §8.2 du cahier des charges, l'accès au DCS réel d'Air
Burkina n'étant pas disponible, le prototype fonctionne avec une base de
vols et de réservations gérée par AirPass. L'interface `DcsGateway`
isole ce choix : brancher le DCS réel ne demandera qu'une nouvelle
implémentation de cette interface.
