# Mini ERP Électricien

Outil de pilotage quotidien pour un électricien indépendant en reprise progressive d'activité.
Suivi des clients, des interventions, des encaissements et d'un seuil mensuel à ne pas dépasser.

## Philosophie

Simple, lisible, rapide. Ce n'est pas un ERP lourd — c'est un outil pour ne pas se noyer dans les détails.

## Fonctionnalités implémentées

| Écran | Ce que ça fait |
|---|---|
| `/dashboard` | Total encaissé du mois, total à percevoir, interventions en cours, seuil, barre verte/orange/rouge, 5 dernières interventions |
| `/clients` | Liste triée par nom, recherche (nom, ville, téléphone) |
| `/clients/nouveau` | Formulaire de création (nom, téléphone, email, adresse, notes) |
| `/clients/[id]` | Fiche client, total encaissé, historique des interventions liées |
| `/clients/[id]/edit` | Modification + suppression client (avec confirmation) |
| `/interventions` | Liste filtrée par mois / statut / client / non soldées, totaux encaissé + reste, export CSV + PDF |
| `/interventions/nouveau` | Formulaire de création lié à un client (statut, durée, montants, mode de paiement, date de paiement) |
| `/interventions/[id]/edit` | Modification + suppression intervention (avec confirmation) |
| `/parametres` | Nom de l'activité, seuil mensuel, devise |
| `/tresorerie` | Résumé des 12 derniers mois : encaissé, % du seuil, liens vers rapports |
| `/rapport/[mois]` | Rapport mensuel : table + barre de seuil + répartition par statut, export CSV + export PDF + impression |
| `GET /api/interventions/csv` | Export CSV filtré (mois, statut, client, non soldées) avec BOM UTF-8 |
| `GET /api/interventions/pdf` | Export PDF filtré (mois, statut, client, non soldées) via `@react-pdf/renderer` |

**Transversal**
- Mode jour / nuit avec bouton dans la nav, persisté dans `localStorage`
- Respect automatique de la préférence système au premier chargement
- Zéro flash de thème au chargement via script inline dans le `<head>` du layout racine

## Règles métier

- Le total mensuel = somme des `receivedAmount` des interventions du mois en cours
- `< 80 %` du seuil → indicateur vert
- `≥ 80 %` → orange
- `≥ 100 %` → rouge
- Supprimer un client supprime aussi ses interventions (`onDelete: Cascade`)
- Les montants sont stockés en `Decimal` dans PostgreSQL
- Le statut `PAYEE` exclut l'intervention du calcul « reste à percevoir »

## Modèle de données

```
UserSetting   id, activityName, monthlyLimit, currency
Client        id, firstName, lastName, phone, email, address, postalCode, city, notes
Intervention  id, clientId, date, workType, description, estimatedDurationHours,
              actualDurationHours, status, plannedAmount, receivedAmount,
              paymentMethod, paymentDate, notes
```

**Statuts** : `A_FAIRE` · `EN_COURS` · `TERMINEE` · `FACTUREE` · `PAYEE` · `ANNULEE`

**Modes de paiement** : `ESPECES` · `VIREMENT` · `CARTE` · `AUTRE`

## Stack

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, webpack) |
| UI | React 19 + Tailwind CSS v4 |
| Base de données | PostgreSQL local via Docker Compose + Prisma 7 + `@prisma/adapter-pg` |
| PDF | `@react-pdf/renderer` v4 (rendu serveur) |
| Langage | TypeScript |

> **Note webpack** : Turbopack est désactivé (`next dev --webpack`) en raison d'un bug Windows où le worker PostCSS crashe avec le code `0xc0000142` (STATUS_DLL_INIT_FAILED).

## Prérequis

- Node.js ≥ 20
- npm ≥ 10
- Docker Desktop
- Docker Compose

## Installation

```bash
docker-compose up -d
npm install
npm run prisma:generate
npm run db:push
npm run db:seed
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) — redirige automatiquement vers `/dashboard`.

## Configuration locale

La base PostgreSQL locale attendue est :

- hôte : `localhost`
- port : `5432`
- base : `mini_erp`
- utilisateur : `postgres`
- mot de passe : `postgres`

Les variables sont définies dans `.env.local` et `.env`.
Prisma CLI lit sa connexion via `prisma.config.ts`.

## Scripts

```bash
npm run dev      # serveur de développement (webpack)
npm run build    # build de production
npm start        # serveur de production
npm run db:push  # synchroniser le schéma Prisma vers PostgreSQL
npm run db:seed  # peupler la base avec des données de test
npm run db:studio # ouvrir Prisma Studio
npm run prisma:generate # régénérer le client Prisma
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
│   │   ├── page.tsx                 # Liste + recherche
│   │   ├── nouveau/page.tsx         # Formulaire création
│   │   └── [id]/
│   │       ├── page.tsx             # Fiche + interventions liées
│   │       └── edit/page.tsx        # Modification + suppression
│   ├── interventions/
│   │   ├── page.tsx                 # Liste + filtres + export CSV/PDF
│   │   ├── nouveau/page.tsx         # Formulaire création
│   │   └── [id]/edit/page.tsx       # Modification + suppression
│   ├── tresorerie/page.tsx          # Résumé 12 mois
│   ├── rapport/[mois]/page.tsx      # Rapport mensuel imprimable + exports
│   ├── parametres/page.tsx          # Paramètres utilisateur
│   └── api/interventions/
│       ├── csv/route.ts             # Export CSV
│       └── pdf/route.ts             # Export PDF
├── components/
│   ├── ThemeToggle.tsx              # Bouton lune/soleil (client component)
│   ├── DeleteButton.tsx             # Bouton suppression avec window.confirm
│   ├── SearchInput.tsx              # Champ recherche client (URL-driven)
│   ├── ExportCsvButton.tsx          # Bouton export CSV (lit les searchParams)
│   ├── ExportPdfButton.tsx          # Bouton export PDF (lit les searchParams)
│   └── PrintButton.tsx             # Bouton impression (window.print)
└── lib/
    ├── db.ts                        # Instance Prisma singleton avec adapter PostgreSQL
    ├── dashboard.ts                 # Requêtes agrégées du dashboard
    ├── interventions.ts             # Labels, styles, calculs métier (reste, non soldée, date paiement)
    ├── money.ts                     # Formatage Intl.NumberFormat fr-BE
    └── pdf/
        └── interventions-document.tsx  # Composant @react-pdf/renderer (A4 paysage)
prisma/
├── schema.prisma
├── migrations/
├── seed.ts
scripts/
├── db-operation.ps1                 # Wrapper Prisma qui charge .env.local puis .env
└── db-seed.ts                       # Wrapper de seed
docker-compose.yml                   # PostgreSQL local pour le développement
prisma.config.ts                     # Configuration Prisma 7 pour la CLI
```

## Feuille de route

- [x] Modification client (`/clients/[id]/edit`)
- [x] Modification intervention (`/interventions/[id]/edit`)
- [x] Suppression avec confirmation (`window.confirm`)
- [x] Filtres par mois / statut / client / non soldées sur la liste des interventions
- [x] Recherche clients (nom, ville, téléphone)
- [x] Statuts `FACTUREE` et `PAYEE` + champ `paymentDate`
- [x] Page trésorerie (`/tresorerie`) — résumé mensuel 12 mois
- [x] Export CSV des interventions (tous filtres transmis, BOM UTF-8 pour Excel)
- [x] Export PDF des interventions (`@react-pdf/renderer`, A4 paysage, rendu serveur)
- [x] Rapport mensuel (`/rapport/[mois]`) : imprimable + export CSV + export PDF
