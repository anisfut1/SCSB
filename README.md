# Basket Club Manager — plateforme SaaS multi-clubs

Plateforme SaaS destinée aux clubs de basket : une seule application, une
seule base de données, plusieurs clubs (tenants) totalement isolés les uns
des autres. **SC Sète Basket** (identifiant FFBB `OCC0034008`) est le
**tenant pilote** — pas un cas particulier câblé dans le code.

Chaque club synchronise automatiquement ses données FFBB (matchs,
compétitions, poules, scores...) et, via ses propres identifiants FBI, ses
documents e-Marque (composition, statistiques, arbitres, officiels de
table).

Voir [`ARCHITECTURE.md`](./ARCHITECTURE.md) pour l'architecture
fonctionnelle (modules, flux FFBB, modèle de données métier) et
[`docs/MULTI_TENANCY.md`](./docs/MULTI_TENANCY.md) pour le modèle
multi-tenant lui-même (isolation, RLS, rôles, routes, jobs, onboarding) —
ces deux documents font autorité pour toute décision de conception. Ce
README couvre l'installation et l'organisation concrète du code.

**État actuel : socle SaaS multi-tenant + Module 1 (Matchs) en place.**
Une fois déployé, un `platform_admin` crée un club depuis `/platform/clubs`
(sans toucher au code), puis le `club_admin` de ce club configure ses
propres intégrations FFBB/FBI depuis `/c/{slug}/admin/integrations`. Le
flux suivant tourne ensuite automatiquement, sans opération manuelle sur
fichier, **indépendamment pour chaque club** :

FFBB (calendrier/résultats publics) → synchronisation automatique
multi-club (cron `/api/internal/sync-ffbb`) → base de données → connexion
FBI serveur (identifiants chiffrés, propres à chaque club) → découverte +
téléchargement automatique des documents e-Marque (cron
`/api/internal/discover-emarque`, multi-club) → parsing (OCR) →
composition, statistiques, arbitres, officiels de table → pages
`/c/{slug}/matchs` et `/c/{slug}/matchs/[id]`.

**Important — statut FBI/e-Marque : PREPARED, pas encore CONFIRMED.**
`FbiProvider.login()` est un client HTTP générique (détection du
formulaire de connexion, sans nom de champ codé en dur), mais
`FbiProvider.findEmarqueDocuments()` n'a pas d'endpoint confirmé (accès
réseau `*.ffbb.com` bloqué depuis l'environnement de développement — voir
`docs/FBI_AUTHENTICATED_SPIKE.md`). Tant que cet endpoint n'est pas
confirmé et implémenté, le job de découverte échoue proprement match par
match, pour chaque club (`emarque_status = waiting_for_emarque`, retry
30min/2h/6h/24h) sans jamais prétendre avoir réussi. Le pipeline de
parsing (extraction PDF/OCR, normalisation, écriture en base) a en
revanche été développé et validé contre un vrai document e-Marque fourni
hors-Git (jamais commité — voir plus bas).

Ce qui existe : Next.js + TypeScript strict, Supabase (Auth, PostgreSQL,
Storage privé, RLS multi-tenant partout), modèle `clubs` /
`club_memberships` / `membership_roles` / `platform_admins`,
synchronisation FFBB réelle multi-club (client Directus), chiffrement
AES-256-GCM des identifiants FBI (AAD = `club_id`), client FBI HTTP,
pipeline d'extraction e-Marque (PDF natif + rendu/OCR ciblé par zone),
système d'avertissements qualité non bloquants, jobs cron multi-club avec
verrouillage par `(club, intégration)`, UI `/platform` (opérateur SaaS),
UI admin par club (`/c/{slug}/admin/*`) et UI club
(`/c/{slug}/matchs`, `/c/{slug}/matchs/[id]`).

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript strict
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) : PostgreSQL, Auth, Storage (bucket privé), Row Level Security multi-tenant
- [Vitest](https://vitest.dev) pour les tests unitaires
- `pdfjs-dist` + `@napi-rs/canvas` + `tesseract.js` pour l'extraction des documents e-Marque (PDF sans couche texte, voir `src/server/emarque/`)
- Déploiement visé : [Vercel](https://vercel.com) (Cron pour la synchronisation FFBB et la découverte e-Marque, voir `vercel.json`)

## Prérequis

- Node.js 22+ et npm
- Un projet Supabase (gratuit) — [supabase.com](https://supabase.com/dashboard)
- Optionnel pour du développement 100% local : la [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (`npm install -g supabase` ou `brew install supabase/tap/supabase`) + Docker, pour lancer Supabase en local avec `supabase start`

## Installation

```bash
npm install
cp .env.example .env.local
```

Remplir `.env.local` avec les valeurs de ton projet Supabase (Project
Settings > API) :

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=...                     # 16+ caractères aléatoires, protège /api/internal/*
FBI_CREDENTIALS_ENCRYPTION_KEY=...  # 32 octets aléatoires encodés en base64 (voir ci-dessous)
```

`FBI_CREDENTIALS_ENCRYPTION_KEY` chiffre le mot de passe FBI de chaque
club en base (AES-256-GCM, AAD = `club_id`, voir `src/lib/security/crypto.ts`)
— la générer avec :

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` et `FBI_CREDENTIALS_ENCRYPTION_KEY`
ne doivent **jamais** être commitées ni partagées hors de l'équipe
technique. `.env.local` est ignoré par git (voir `.gitignore`) ; seul
`.env.example` (sans valeurs) est versionné. Ce sont des secrets
**globaux au déploiement**, jamais par club.

## Appliquer les migrations

Le schéma SQL vit dans `supabase/migrations/`, appliqué dans l'ordre de son
timestamp (numérotation `AAAAMMJJHHMMSS_description.sql`).

**Avec la Supabase CLI (recommandé), sur un projet distant :**

```bash
supabase link --project-ref <ton-project-ref>
supabase db push
```

**En local avec Docker :**

```bash
supabase init      # si supabase/config.toml n'existe pas encore
supabase start
supabase db reset  # applique toutes les migrations sur la base locale
```

**Sans Supabase CLI :** copier-coller le contenu de chaque fichier de
`supabase/migrations/` (dans l'ordre) dans l'éditeur SQL du dashboard
Supabase.

Après application, la table `clubs` contient une ligne pour le tenant
pilote SC Sète Basket (`slug = 'sc-sete-basket'`, créée directement par
les migrations).

## Bootstrap : premier platform_admin, puis premier club_admin

Il n'existe **aucune voie applicative** pour devenir `platform_admin`
(pas d'auto-élévation, voir `docs/MULTI_TENANCY.md` §3) : la première fois,
c'est un script exécuté avec la service role.

```bash
SEED_ADMIN_EMAIL=admin@example.local SEED_ADMIN_PASSWORD=change-me-1234 SEED_PLATFORM_ADMIN=true npm run seed
```

Ce compte devient à la fois `club_admin` du tenant pilote (SC Sète Basket)
et `platform_admin` de la plateforme. Ensuite, **tout le reste se fait
depuis l'application** :

- `/platform/clubs` (platform_admin) : créer de nouveaux clubs, y compris
  l'invitation automatique de leur premier `club_admin` par email.
- `/c/{slug}/admin/integrations` (club_admin de ce club) : configurer
  FFBB/FBI pour ce club précisément.

## Lancer le projet

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Toute route est
protégée par défaut (redirection vers `/login`) sauf `/login` elle-même
(voir `src/proxy.ts` et `src/config/site.ts#PUBLIC_PATHS`). Après
connexion, `/` résout automatiquement le club de l'utilisateur (0, 1 ou
plusieurs clubs — voir `docs/MULTI_TENANCY.md` §5).

Il n'y a pas d'inscription publique : les comptes sont créés par
invitation (`/platform/clubs` pour un premier club_admin, ou directement
en base pour un développement local via le script de seed ci-dessus).

## Commandes

```bash
npm run dev         # serveur de développement
npm run build       # build de production
npm run start       # sert le build de production
npm run lint        # ESLint
npm run typecheck   # génère les types de routes Next.js puis tsc --noEmit
npm run test        # tests unitaires (Vitest)
npm run test:watch  # tests en mode watch
npm run seed        # bootstrap platform_admin/club_admin + licenciés fictifs (voir ci-dessus)
```

Toutes ces commandes doivent passer sans erreur sur `main`.

## Organisation du code

```
src/
  app/                    Routes Next.js (App Router) — couche fine, pas de logique métier
    login/                Page de connexion (publique)
    page.tsx              Résolution du club courant après connexion (0/1/plusieurs clubs)
    platform/             Réservé platform_admin : liste + création de clubs
    c/[clubSlug]/          Tout l'espace d'UN club
      dashboard/
      matchs/               Module 1 : liste filtrée + détail (onglets) — lecture seule
      admin/                Espace club_admin DE CE CLUB : intégrations, sync, anomalies, réglages
    api/internal/          Routes cron (protégées par CRON_SECRET) : sync FFBB, découverte e-Marque — multi-club
    layout.tsx             Layout racine
    error.tsx, not-found.tsx
  components/             UI partagée, sans logique métier
    ui/                    Composants génériques (Card...)
    nav/                   Navigation (en-tête, sélecteur de club)
  features/                UI + logique spécifiques à un module métier
    auth/                   Formulaire de connexion (Client Component)
    admin/                   Formulaire identifiants FBI, réglages club, bouton test de connexion
    platform/                Formulaire de création de club
  lib/                     Logique réutilisable, testable indépendamment de Next.js
    supabase/                Les 3 clients Supabase (browser / server / admin)
    auth/                    Session (lecture) et statut platform_admin
    tenancy/                  ClubContext : LE point d'entrée pour résoudre "quel club, quels droits"
    permissions/              Rôles de club (ClubRole, hasRole...)
    ffbb/                     Client Directus + FFBBProvider (API publique FFBB)
    fbi/                      Client HTTP FBI (login générique, cookie jar, découverte documents)
    security/                 Chiffrement AES-256-GCM (identifiants FBI, AAD = club_id)
    storage/                  Bucket privé Supabase Storage (documents e-Marque, chemin tenant-scopé)
    domain/                   Logique métier pure et testable (mapping FFBB, sync, jobs — tous paramétrés par clubId)
    logger.ts                 Logger serveur minimal
  server/
    actions/                 Server Actions (couche fine entre l'UI et lib/) — toutes paramétrées par clubSlug/clubId
    emarque/                  Pipeline d'extraction e-Marque : extractors/ (PDF natif, rendu+OCR),
                               layout/ (zones calibrées par document), normalizers/ (texte -> valeurs
                               typées), parser/ (orchestration ZIP -> EMarqueMatchData), quality/
                               (avertissements non bloquants), schemas/ (validation zod finale),
                               persist/ (écriture en base, tenant-scopée, liaison licencié par licence exacte)
  config/                  Configuration (env validée, constantes produit)
  types/
    database.ts               Types du schéma PostgreSQL (écrits à la main)
  proxy.ts                 Protection des routes + rafraîchissement de session (ex-middleware.ts)

supabase/
  migrations/              Schéma SQL versionné, une responsabilité par fichier
  tests/                   Tests d'isolation RLS multi-tenant (voir supabase/tests/README.md)

spikes/                    Outils de diagnostic développeur (jamais requis en exploitation normale)
  ffbb-ecosystem/            Scripts d'exploration de l'API publique FFBB
  fbi-auth/                  Outil Playwright à lancer LOCALEMENT (identifiants réels), voir
                              docs/FBI_AUTHENTICATED_SPIKE.md — n'importe jamais dans l'app

scripts/
  seed.ts                  Bootstrap platform_admin/club_admin + licenciés fictifs (voir plus haut)

vercel.json                Configuration des Cron Jobs (sync FFBB ~15min, découverte e-Marque ~1h)
```

Principe : les routes sous `app/` restent fines et appellent `lib/`. Les
Server Actions (`server/actions/`) sont aussi une couche fine : la logique
testable vit dans `lib/`. Toute page/service qui a besoin du club courant
passe par `src/lib/tenancy/club-context.ts` — voir `docs/MULTI_TENANCY.md`
§5 pour la règle de développement associée.

### Base de données

**Tenant** : `clubs` (le club — voir `docs/MULTI_TENANCY.md`),
`club_memberships` + `membership_roles` (appartenance et rôles, scopés au
club), `platform_admins` (opérateur SaaS, table séparée, aucune policy
d'auto-élévation).

**Socle** : `licencies` (tenant-scopé), `profiles` (global, lié à
`auth.users`).

**Couche FFBB** (écrite exclusivement par le service de synchronisation,
tenant-scopée sauf mention contraire) : `teams`, `competitions`/`pools`/`venues`
(référentiel **global partagé** entre clubs, voir `docs/MULTI_TENANCY.md`
§2), `ffbb_team_engagements`, `matches`, `match_change_history`, `sync_runs`.

**Couche FBI / e-Marque** (tenant-scopée) : `fbi_credentials` (aucune
policy RLS pour `authenticated` — accès service role uniquement),
`fbi_integration_status`, `emarque_imports` (idempotence par
`UNIQUE(club_id, file_hash)`), `match_participants`, `match_coaches`,
`match_officials`, `match_table_officials`, `player_match_stats`,
`shot_events` (expérimental, non peuplé).

**Verrouillage** : `sync_locks` (empêche deux synchronisations
simultanées pour un même `(club, intégration)`, voir `docs/MULTI_TENANCY.md` §8).

Détail des colonnes et des choix : voir les fichiers dans
`supabase/migrations/` (chacun est commenté), `ARCHITECTURE.md` et
`docs/MULTI_TENANCY.md`.

Point d'architecture important : **une personne (`licencies`) n'est pas un
compte utilisateur**. Un compte Supabase Auth peut se rattacher à un
licencié DIFFÉRENT par club (`club_memberships.licencie_id`, tenant-scopé
— voir `docs/MULTI_TENANCY.md` §3) ; un licencié peut exister sans jamais
avoir de compte.

Toutes les tables tenant-scopées ont RLS activée, avec deux policies
type (`..._select_member` / `..._all_club_admin`) reposant sur les
fonctions `is_club_member()`/`has_club_role()` — voir
`docs/MULTI_TENANCY.md` §4 et `supabase/migrations/20260921100090_rls_multitenant_rewrite.sql`.

## Tests

```bash
npm run test
```

Vitest teste des fonctions TypeScript pures et de la logique métier avec
des clients Supabase simulés (pas de tests E2E, aucune donnée réelle dans
les fixtures) :

- Config d'environnement, rôles de club, connexion/déconnexion
- `ClubContext` : résolution club/membre/rôles, isolation cross-tenant
  (`src/lib/tenancy/club-context.test.ts`)
- Mapping/diff/idempotence FFBB, tenant-scopé (`src/lib/domain/matches/mapping.test.ts`)
- Chiffrement des identifiants FBI, y compris l'isolation par AAD
  cross-club (`src/lib/security/crypto.test.ts`)
- Cookie jar et connexion FBI simulée (`src/lib/fbi/*.test.ts`)
- Normalisation de texte, en-têtes et avertissements qualité e-Marque
  (`src/server/emarque/normalizers/*.test.ts`, `.../quality/*.test.ts`)
- Rapprochement effectif/statistiques (`src/server/emarque/parser/merge.test.ts`)
- Écriture en base idempotente + liaison licencié, tenant-scopée
  (`src/server/emarque/persist/*.test.ts`)
- Jobs multi-club : sélection des clubs dus, verrouillage par
  `(club, intégration)`, isolation (un club en échec/verrouillé n'affecte
  jamais les autres) — `src/lib/domain/sync/sync-ffbb-scheduler.test.ts`,
  `src/lib/domain/emarque/discover-emarque.test.ts`,
  `src/lib/domain/emarque/discover-emarque-all-clubs.test.ts`

**Isolation RLS multi-tenant (réelle, contre un moteur PostgreSQL)** :
`supabase/tests/isolation_test.sql` — 26 scénarios (lecture/écriture
cross-tenant refusées, coexistence de mêmes identifiants externes entre
clubs, `platform_admin` cross-club, visiteur anonyme) exécutés avec succès
lors du développement de cette migration. Voir `supabase/tests/README.md`
pour le détail et pour la rejouer (`supabase test db`, ou un Postgres
local sans Docker via le shim documenté).

Le pipeline d'extraction PDF/OCR lui-même (rendu de page, reconnaissance)
n'a pas de test automatisé au sens strict : il a été développé et validé
manuellement contre un document e-Marque réel fourni hors-Git (jamais
commité, jamais dans les fixtures de test). Les fonctions pures qui
interprètent son résultat (normalizers, quality, merge, persist) sont,
elles, entièrement testées avec des données synthétiques.

## Fichiers générés automatiquement

`AGENTS.md` et `CLAUDE.md` à la racine sont générés par `next dev` (Next.js
16) pour documenter aux agents IA les changements de convention de cette
version de Next.js. Ils sont recréés automatiquement s'ils sont supprimés
— ce n'est pas une erreur, ils sont commités volontairement.

## Modules pas encore développés

Voir `ARCHITECTURE.md` pour le détail. Ce qui reste, au-delà du Module 1
(Matchs) : Module 2 (Dérogations), Module 3/4 (Tables de marque + moteur
d'affectation), Module 5 (détection automatique des conflits), gestion UI
complète des licenciés/rôles, disponibilités, PWA/notifications. **Règle
impérative** (voir `docs/MULTI_TENANCY.md` §12) : tout nouveau module doit
être tenant-scopé dès sa première migration.

## Configuration manuelle restante

Ce qui ne peut pas être fait depuis ce dépôt et reste à faire par
quelqu'un ayant accès aux comptes Supabase/Vercel :

- Créer le projet Supabase et récupérer ses clés API
- Renseigner `.env.local` (développement) et les variables d'environnement
  du projet sur Vercel (production), y compris `CRON_SECRET` et
  `FBI_CREDENTIALS_ENCRYPTION_KEY` (secrets **globaux au déploiement**,
  jamais par club)
- Appliquer les migrations sur le projet Supabase réel (voir plus haut)
- Exécuter `npm run seed` avec `SEED_PLATFORM_ADMIN=true` pour créer le
  premier `platform_admin` (voir « Bootstrap » plus haut) — seule
  opération qui ne peut pas se faire depuis l'UI, par design
- Connecter le repo à Vercel pour le déploiement (les Cron Jobs de
  `vercel.json` nécessitent un plan Vercel qui les autorise à la fréquence
  configurée — à ajuster selon le plan réellement utilisé)
- Tout le reste (créer un club, inviter son premier admin, configurer
  FFBB/FBI) se fait depuis l'application (`/platform/clubs`, puis
  `/c/{slug}/admin/integrations`)
- **Confirmer l'endpoint FBI de découverte des documents e-Marque** :
  `FbiProvider.findEmarqueDocuments()` (`src/lib/fbi/provider.ts`) n'a pas
  pu être testé contre le vrai FBI depuis cet environnement (réseau
  bloqué). Utiliser `spikes/fbi-auth/` en local (voir
  `docs/FBI_AUTHENTICATED_SPIKE.md`) pour observer le vrai flux HTTP, puis
  implémenter cette méthode en conséquence — le reste du pipeline
  (téléchargement, parsing, écriture en base, déjà tenant-scopé) est prêt
  à la recevoir sans autre changement.
