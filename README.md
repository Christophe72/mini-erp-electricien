# Mini ERP Électricien

Outil de pilotage quotidien pour un électricien indépendant en reprise progressive d'activité.
Suivi des clients, des interventions, des encaissements et d'un seuil mensuel à ne pas dépasser.

## Philosophie

Simple, lisible, rapide. Ce n'est pas un ERP lourd — c'est un outil pour ne pas se noyer dans les détails.

## Fonctionnalités implémentées

| Écran | Ce que ça fait |
|---|---|
| `/dashboard` | Total encaissé du mois, seuil, reste disponible, barre de progression verte/orange/rouge, interventions récentes |
| `/clients` | Liste triée par nom |
| `/clients/nouveau` | Formulaire de création (nom, téléphone, email, adresse, notes) |
| `/clients/[id]` | Fiche client, total encaissé, historique des interventions liées |
| `/clients/[id]/edit` | Modification + suppression client (avec confirmation) |
| `/interventions` | Liste filtrée par mois et/ou statut, total encaissé de la sélection |
| `/interventions/nouveau` | Formulaire de création lié à un client (statut, durée, montants, mode de paiement) |
| `/interventions/[id]/edit` | Modification + suppression intervention (avec confirmation) |
| `/parametres` | Nom de l'activité, seuil mensuel, devise |

**Transversal**
- Mode jour / nuit avec bouton dans la nav, persisté dans `localStorage`
- Respect automatique de la préférence système au premier chargement
- Zéro flash de thème au chargement (script inline avant hydration React)

## Règles métier

- Le total mensuel = somme des `receivedAmount` des interventions du mois en cours
- `< 80 %` du seuil → indicateur vert
- `≥ 80 %` → orange
- `≥ 100 %` → rouge
- Supprimer un client supprime aussi ses interventions (`onDelete: Cascade`)
- Les montants sont stockés en `Decimal` dans SQLite

## Modèle de données

```
UserSetting   id, activityName, monthlyLimit, currency
Client        id, firstName, lastName, phone, email, address, postalCode, city, notes
Intervention  id, clientId, date, workType, description, estimatedDurationHours,
              actualDurationHours, status, plannedAmount, receivedAmount, paymentMethod, notes
```

**Statuts** : `A_FAIRE` · `EN_COURS` · `TERMINEE` · `ANNULEE`

**Modes de paiement** : `ESPECES` · `VIREMENT` · `CARTE` · `AUTRE`

## Stack

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, webpack) |
| UI | React 19 + Tailwind CSS v4 |
| Base de données | SQLite via Prisma 7 + `better-sqlite3` (driver adapter) |
| Langage | TypeScript |

> **Note webpack** : Turbopack est désactivé (`next dev --webpack`) en raison d'un bug Windows où le worker PostCSS crashe avec le code `0xc0000142` (STATUS_DLL_INIT_FAILED) lors du traitement de `@tailwindcss/postcss`.

## Prérequis

- Node.js ≥ 20
- npm ≥ 10

## Installation

```bash
npm install
npx prisma migrate dev
npm run seed   # données de démonstration
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) — redirige automatiquement vers `/dashboard`.

## Scripts

```bash
npm run dev      # serveur de développement (webpack)
npm run build    # build de production
npm start        # serveur de production
npm run seed     # peupler la base avec des données de test
npm run lint     # ESLint
```

## Structure du projet

```
src/
├── app/
│   ├── layout.tsx                   # Layout racine : nav + toggle thème + script anti-flash
│   ├── page.tsx                     # Redirige vers /dashboard
│   ├── globals.css                  # Import Tailwind v4 + @variant dark (mode classe)
│   ├── dashboard/page.tsx           # Vue mensuelle avec indicateur de seuil
│   ├── clients/
│   │   ├── page.tsx                 # Liste
│   │   ├── nouveau/page.tsx         # Formulaire création
│   │   └── [id]/page.tsx            # Fiche + interventions liées
│   ├── interventions/
│   │   ├── page.tsx                 # Liste
│   │   └── nouveau/page.tsx         # Formulaire création
│   └── parametres/page.tsx          # Paramètres utilisateur
├── components/
│   └── ThemeToggle.tsx              # Bouton lune/soleil (client component)
└── lib/
    ├── db.ts                        # Instance Prisma singleton (compatible hot-reload)
    ├── dashboard.ts                 # Requêtes agrégées du dashboard
    └── money.ts                     # Formatage Intl.NumberFormat fr-BE
prisma/
├── schema.prisma
├── seed.ts
└── dev.db                           # Base SQLite locale (gitignorée en prod)
```

## Feuille de route

- [x] Modification client (`/clients/[id]/edit`)
- [x] Modification intervention (`/interventions/[id]/edit`)
- [x] Suppression avec confirmation (`window.confirm`)
- [x] Filtres par mois / statut sur la liste des interventions
- [x] Recherche clients (nom, ville, téléphone)
- [ ] Page trésorerie (`/tresorerie`) — résumé mensuel
- [ ] Export CSV des interventions
- [ ] Rapport mensuel imprimable
