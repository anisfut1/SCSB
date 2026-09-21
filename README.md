# SC Sète Basket — Application interne

Application interne de gestion sportive pour le club SC Sète Basket
(identifiant FFBB `OCC0034008`), synchronisée automatiquement avec les
données FFBB (matchs, compétitions, poules, scores...) et enrichie d'une
couche métier propre au club (dérogations, tables de marque, affectations,
disponibilités).

Voir [`ARCHITECTURE.md`](./ARCHITECTURE.md) pour l'architecture complète du
projet — c'est la source de vérité pour toute décision de conception. Ce
README couvre l'installation et l'organisation concrète du code.

**État actuel : produit "clé en main" (Module 1 — Matchs) en place.** Une
fois déployé et configuré depuis `/admin/integrations`, le flux suivant
tourne automatiquement, sans opération manuelle sur fichier :

FFBB (calendrier/résultats publics) → synchronisation automatique
(cron `/api/internal/sync-ffbb`) → base de données → connexion FBI
serveur (identifiants chiffrés) → découverte + téléchargement automatique
des documents e-Marque (cron `/api/internal/discover-emarque`) → parsing
(OCR) → composition, statistiques, arbitres, officiels de table → pages
`/matchs` et `/matchs/[id]`.

**Important — statut FBI/e-Marque : PREPARED, pas encore CONFIRMED.**
`FbiProvider.login()` est un client HTTP générique (détection du
formulaire de connexion, sans nom de champ codé en dur), mais
`FbiProvider.findEmarqueDocuments()` n'a pas d'endpoint confirmé (accès
réseau `*.ffbb.com` bloqué depuis l'environnement de développement — voir
`docs/FBI_AUTHENTICATED_SPIKE.md`). Tant que cet endpoint n'est pas
confirmé et implémenté, le job de découverte échoue proprement match par
match (`emarque_status = waiting_for_emarque`, retry 30min/2h/6h/24h) sans
jamais prétendre avoir réussi. Le pipeline de parsing (extraction PDF/OCR,
normalisation, écriture en base) a en revanche été développé et validé
contre un vrai document e-Marque fourni hors-Git (jamais commité — voir
plus bas).

Ce qui existe : Next.js + TypeScript strict, Supabase (Auth, PostgreSQL,
Storage privé, RLS partout), synchronisation FFBB réelle (client Directus),
chiffrement AES-256-GCM des identifiants FBI, client FBI HTTP, pipeline
d'extraction e-Marque (PDF natif + rendu/OCR ciblé par zone), système
d'avertissements qualité non bloquants, jobs cron, UI admin
(`/admin/integrations`, `/admin/sync`, `/admin/issues`) et UI club
(`/matchs`, `/matchs/[id]`).

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript strict
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) : PostgreSQL, Auth, Storage (bucket privé), Row Level Security
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

`FBI_CREDENTIALS_ENCRYPTION_KEY` chiffre le mot de passe FBI en base
(AES-256-GCM, voir `src/lib/security/crypto.ts`) — la générer avec :

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` et `FBI_CREDENTIALS_ENCRYPTION_KEY`
ne doivent **jamais** être commitées ni partagées hors de l'équipe
technique. `.env.local` est ignoré par git (voir `.gitignore`) ; seul
`.env.example` (sans valeurs) est versionné.

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

Après application, la table `club` contient une ligne pour le SC Sète
Basket (créée directement par la migration).

## Configurer les intégrations (une fois déployé)

C'est la **seule** étape de configuration à faire depuis l'application une
fois le déploiement Vercel + les migrations Supabase en place :

1. Se connecter avec le compte `super_admin`.
2. Aller sur `/admin/integrations/fbi`, renseigner l'identifiant et le mot
   de passe FBI du club, cliquer sur « Tester la connexion ».
3. Vérifier `/admin/integrations` : la synchronisation FFBB tourne seule
   (cron), le statut FBI affiche « connecté » ou l'erreur exacte sinon.
4. Laisser tourner : les matchs, puis (une fois l'endpoint FBI de
   découverte e-Marque confirmé, voir l'avertissement plus haut) la
   composition/les statistiques apparaissent automatiquement sur `/matchs`.

Aucun terminal, aucun script, aucun fichier à manipuler pour l'exploitation
normale — voir `/admin/sync` (tableau de bord) et `/admin/issues` (revue
des rares cas ambigus) pour le suivi.

## Lancer le projet

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Toute route est
protégée par défaut (redirection vers `/login`) sauf `/login` elle-même
(voir `src/proxy.ts` et `src/config/site.ts#PUBLIC_PATHS`).

Il n'y a pas d'inscription publique : les comptes sont créés côté
Supabase (dashboard, ou script de seed ci-dessous) par un administrateur.

## Données de développement (seed)

Pour créer un compte `super_admin` et quelques licenciés fictifs (aucune
donnée réelle du club) :

```bash
SEED_ADMIN_EMAIL=admin@scsete-basket.local SEED_ADMIN_PASSWORD=change-me-1234 npm run seed
```

`SEED_ADMIN_PASSWORD` est obligatoire (pas de valeur par défaut codée en
dur). Le script est idempotent : le rejouer ne duplique pas le compte
admin, et n'insère les licenciés fictifs que s'il n'y en a pas déjà pour
le club (voir `scripts/seed.ts`).

## Commandes

```bash
npm run dev         # serveur de développement
npm run build       # build de production
npm run start       # sert le build de production
npm run lint        # ESLint
npm run typecheck   # génère les types de routes Next.js puis tsc --noEmit
npm run test        # tests unitaires (Vitest)
npm run test:watch  # tests en mode watch
npm run seed        # données de développement (voir ci-dessus)
```

Toutes ces commandes doivent passer sans erreur sur `main`.

## Organisation du code

```
src/
  app/                    Routes Next.js (App Router) — couche fine, pas de logique métier
    login/                Page de connexion (publique)
    dashboard/             Layout protégé + page d'accueil post-connexion
    matchs/                Module 1 : liste filtrée + détail (onglets) — lecture seule
    admin/                 Espace super_admin : intégrations, synchronisation, anomalies
    api/internal/          Routes cron (protégées par CRON_SECRET) : sync FFBB, découverte e-Marque
    layout.tsx, page.tsx   Layout racine, redirection selon session
    error.tsx, not-found.tsx
  components/             UI partagée, sans logique métier
    ui/                    Composants génériques (Card...)
    nav/                   Navigation (en-tête de l'espace connecté)
  features/                UI + logique spécifiques à un module métier
    auth/                   Formulaire de connexion (Client Component)
    admin/                   Formulaire identifiants FBI, bouton test de connexion
  lib/                     Logique réutilisable, testable indépendamment de Next.js
    supabase/                Les 3 clients Supabase (browser / server / admin)
    auth/                    Session (lecture) et service de connexion (logique pure)
    permissions/              Rôles applicatifs (AppRole, hasRole...)
    ffbb/                     Client Directus + FFBBProvider (API publique FFBB)
    fbi/                      Client HTTP FBI (login générique, cookie jar, découverte documents)
    security/                 Chiffrement AES-256-GCM (identifiants FBI)
    storage/                  Bucket privé Supabase Storage (documents e-Marque)
    domain/                   Logique métier pure et testable (mapping FFBB, sync, jobs)
    logger.ts                 Logger serveur minimal
  server/
    actions/                 Server Actions (couche fine entre l'UI et lib/)
    emarque/                  Pipeline d'extraction e-Marque : extractors/ (PDF natif, rendu+OCR),
                               layout/ (zones calibrées par document), normalizers/ (texte -> valeurs
                               typées), parser/ (orchestration ZIP -> EMarqueMatchData), quality/
                               (avertissements non bloquants), schemas/ (validation zod finale),
                               persist/ (écriture en base, liaison licencié par licence exacte)
  config/                  Configuration (env validée, constantes produit)
  types/
    database.ts               Types du schéma PostgreSQL (écrits à la main)
  proxy.ts                 Protection des routes + rafraîchissement de session (ex-middleware.ts)

supabase/
  migrations/              Schéma SQL versionné, une responsabilité par fichier

spikes/                    Outils de diagnostic développeur (jamais requis en exploitation normale)
  ffbb-ecosystem/            Scripts d'exploration de l'API publique FFBB
  fbi-auth/                  Outil Playwright à lancer LOCALEMENT (identifiants réels), voir
                              docs/FBI_AUTHENTICATED_SPIKE.md — n'importe jamais dans l'app

scripts/
  seed.ts                  Données de développement (voir plus haut)

vercel.json                Configuration des Cron Jobs (sync FFBB ~15min, découverte e-Marque ~1h)
```

Principe (voir `ARCHITECTURE.md` §13) : les routes sous `app/` restent
fines et appellent `lib/`. Les Server Actions (`server/actions/`) sont
aussi une couche fine : la logique testable vit dans `lib/`.

### Base de données

Socle : `club`, `licencies`, `profiles`, `user_roles` (+ le type
`app_role`).

Couche FFBB (écrite exclusivement par le service de synchronisation) :
`teams`, `competitions`, `pools`, `venues`, `ffbb_team_engagements`,
`matches`, `match_change_history`, `sync_runs`.

Couche FBI / e-Marque : `fbi_credentials` (aucune policy RLS pour
`authenticated` — accès service role uniquement), `fbi_integration_status`,
`emarque_imports` (idempotence par `file_hash` SHA-256), `match_participants`,
`match_coaches`, `match_officials`, `match_table_officials`,
`player_match_stats`, `shot_events` (expérimental, non peuplé).

Détail des colonnes et des choix : voir les fichiers dans
`supabase/migrations/` (chacun est commenté) et `ARCHITECTURE.md`.

Point d'architecture important : **une personne (`licencies`) n'est pas un
compte utilisateur**. Un compte Supabase Auth (`profiles.user_id`) peut se
rattacher à 0 ou 1 licencié (`profiles.licencie_id`, nullable et unique) —
jamais l'inverse. Un licencié peut donc exister sans jamais avoir de
compte.

Les rôles (`user_roles`) sont un enregistrement par rôle attribué : un
utilisateur peut cumuler plusieurs rôles. La notion de scope (ex: coach
limité à une équipe) sera ajoutée par une migration ultérieure une fois la
table `teams` créée (Phase 1) — voir le commentaire dans
`supabase/migrations/20260921083030_user_roles.sql`.

Toutes les tables ont RLS activée dès la première migration
(`20260921083040_rls_policies.sql`, entièrement commentée).

## Tests

```bash
npm run test
```

Vitest teste des fonctions TypeScript pures et de la logique métier avec
des clients Supabase simulés (pas de tests E2E, aucune donnée réelle dans
les fixtures) :

- Config d'environnement, rôles, connexion/déconnexion (Phase 0)
- Mapping/diff/idempotence FFBB (`src/lib/domain/matches/mapping.test.ts`)
- Chiffrement des identifiants FBI (`src/lib/security/crypto.test.ts`)
- Cookie jar et connexion FBI simulée (`src/lib/fbi/*.test.ts`)
- Normalisation de texte, en-têtes et avertissements qualité e-Marque
  (`src/server/emarque/normalizers/*.test.ts`, `.../quality/*.test.ts`)
- Rapprochement effectif/statistiques (`src/server/emarque/parser/merge.test.ts`)
- Écriture en base idempotente + liaison licencié (`src/server/emarque/persist/*.test.ts`)
- Job de découverte e-Marque : pas de credentials, échec de connexion,
  endpoint non confirmé, retry/backoff, import réussi
  (`src/lib/domain/emarque/discover-emarque.test.ts`)

Le pipeline d'extraction PDF/OCR lui-même (rendu de page, reconnaissance)
n'a pas de test automatisé au sens strict : il a été développé et validé
manuellement contre un document e-Marque réel fourni hors-Git (jamais
commité, jamais dans les fixtures de test — voir la note de sécurité plus
bas). Les fonctions pures qui interprètent son résultat (normalizers,
quality, merge, persist) sont, elles, entièrement testées avec des données
synthétiques.

## Fichiers générés automatiquement

`AGENTS.md` et `CLAUDE.md` à la racine sont générés par `next dev` (Next.js
16) pour documenter aux agents IA les changements de convention de cette
version de Next.js. Ils sont recréés automatiquement s'ils sont supprimés
— ce n'est pas une erreur, ils sont commités volontairement.

## Modules pas encore développés

Voir `ARCHITECTURE.md` pour le détail. Ce qui reste, au-delà du Module 1
(Matchs) : Module 2 (Dérogations), Module 3/4 (Tables de marque + moteur
d'affectation), Module 5 (détection automatique des conflits), gestion UI
complète des licenciés/rôles, disponibilités, PWA/notifications.

## Configuration manuelle restante

Ce qui ne peut pas être fait depuis ce dépôt et reste à faire par
quelqu'un ayant accès aux comptes Supabase/Vercel/FFBB du club :

- Créer le projet Supabase et récupérer ses clés API
- Renseigner `.env.local` (développement) et les variables d'environnement
  du projet sur Vercel (production), y compris `CRON_SECRET` et
  `FBI_CREDENTIALS_ENCRYPTION_KEY`
- Appliquer les migrations sur le projet Supabase réel (voir plus haut)
- Créer le premier compte `super_admin` réel (via le dashboard Supabase ou
  `npm run seed` pointé sur le vrai projet, avec un mot de passe fort)
- Connecter le repo à Vercel pour le déploiement (les Cron Jobs de
  `vercel.json` nécessitent un plan Vercel qui les autorise à la fréquence
  configurée — à ajuster selon le plan réellement utilisé)
- Renseigner les identifiants FBI depuis `/admin/integrations/fbi` (seule
  étape de configuration faite depuis l'application elle-même)
- **Confirmer l'endpoint FBI de découverte des documents e-Marque** :
  `FbiProvider.findEmarqueDocuments()` (`src/lib/fbi/provider.ts`) n'a pas
  pu être testé contre le vrai FBI depuis cet environnement (réseau
  bloqué). Utiliser `spikes/fbi-auth/` en local (voir
  `docs/FBI_AUTHENTICATED_SPIKE.md`) pour observer le vrai flux HTTP, puis
  implémenter cette méthode en conséquence — le reste du pipeline
  (téléchargement, parsing, écriture en base) est déjà prêt à la
  recevoir sans autre changement.
