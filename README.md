# SC Sète Basket — Application interne

Application interne de gestion sportive pour le club SC Sète Basket
(identifiant FFBB `OCC0034008`), synchronisée automatiquement avec les
données FFBB (matchs, compétitions, poules, scores...) et enrichie d'une
couche métier propre au club (dérogations, tables de marque, affectations,
disponibilités).

Voir [`ARCHITECTURE.md`](./ARCHITECTURE.md) pour l'architecture complète du
projet — c'est la source de vérité pour toute décision de conception. Ce
README couvre l'installation et l'organisation concrète du code.

**État actuel : Phase 0 (socle technique) terminée.** Aucune donnée FFBB
n'est encore synchronisée ; aucun module métier (matchs, dérogations,
tables de marque, affectation, conflits) n'est encore implémenté. Ce qui
existe : Next.js + TypeScript strict, Supabase (Auth + schéma de base),
authentification, rôles, dashboard minimal, tests, lint/typecheck/build
qui passent.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript strict
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) : PostgreSQL, Auth, Row Level Security
- [Vitest](https://vitest.dev) pour les tests unitaires
- Déploiement visé : [Vercel](https://vercel.com)

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
```

`SUPABASE_SERVICE_ROLE_KEY` ne doit **jamais** être commitée ni partagée
hors de l'équipe technique : elle bypass toute la sécurité (RLS) de la
base. `.env.local` est ignoré par git (voir `.gitignore`) ; seul
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
    layout.tsx, page.tsx   Layout racine, redirection selon session
    error.tsx, not-found.tsx
  components/             UI partagée, sans logique métier
    ui/                    Composants génériques (Card...)
    nav/                   Navigation (en-tête de l'espace connecté)
  features/                UI + logique spécifiques à un module métier
    auth/                   Formulaire de connexion (Client Component)
  lib/                     Logique réutilisable, testable indépendamment de Next.js
    supabase/                Les 3 clients Supabase (browser / server / admin)
    auth/                    Session (lecture) et service de connexion (logique pure)
    permissions/              Rôles applicatifs (AppRole, hasRole...)
    logger.ts                 Logger serveur minimal
  server/
    actions/                 Server Actions (couche fine entre l'UI et lib/)
  config/                  Configuration (env validée, constantes produit)
  types/
    database.ts               Types du schéma PostgreSQL (écrits à la main, Phase 0)
  proxy.ts                 Protection des routes + rafraîchissement de session (ex-middleware.ts)

supabase/
  migrations/              Schéma SQL versionné, une responsabilité par fichier

scripts/
  seed.ts                  Données de développement (voir plus haut)
```

Principe (voir `ARCHITECTURE.md` §13) : les routes sous `app/` restent
fines et appellent `lib/`. Les Server Actions (`server/actions/`) sont
aussi une couche fine : la logique testable vit dans `lib/`.

### Base de données — Phase 0

Tables créées : `club`, `licencies`, `profiles`, `user_roles` (+ le type
`app_role`). Détail des colonnes et des choix : voir les fichiers dans
`supabase/migrations/` (chacun est commenté) et `ARCHITECTURE.md` §5/§7.

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

Vitest teste des fonctions TypeScript pures (pas de tests E2E pour
l'instant) : validation de la config d'environnement
(`src/config/env.*.test.ts`), helpers de rôles
(`src/lib/permissions/roles.test.ts`) et logique de connexion/déconnexion
avec un client Supabase simulé (`src/lib/auth/service.test.ts`).

## Fichiers générés automatiquement

`AGENTS.md` et `CLAUDE.md` à la racine sont générés par `next dev` (Next.js
16) pour documenter aux agents IA les changements de convention de cette
version de Next.js. Ils sont recréés automatiquement s'ils sont supprimés
— ce n'est pas une erreur, ils sont commités volontairement.

## Prochaines phases

Voir `ARCHITECTURE.md` §16 pour le détail. Après la Phase 0 :

1. Synchronisation FFBB en lecture seule (MVP) + vue "Ce week-end"
2. Historique des changements de matchs + suivi des synchronisations
3. Gestion complète des licenciés et des rôles (UI)
4. Dérogations
5. Tables de marque (gestion manuelle)
6. Disponibilités + moteur de recommandation
7. Conflits automatiques
8. Finitions (PWA, notifications, polish)

## Configuration manuelle restante

Ce qui ne peut pas être fait depuis ce dépôt et reste à faire par
quelqu'un ayant accès aux comptes Supabase/Vercel du club :

- Créer le projet Supabase et récupérer ses clés API
- Renseigner `.env.local` (développement) et les variables d'environnement
  du projet sur Vercel (production)
- Appliquer les migrations sur le projet Supabase réel (voir plus haut)
- Créer le premier compte `super_admin` réel (via le dashboard Supabase ou
  `npm run seed` pointé sur le vrai projet, avec un mot de passe fort)
- Connecter le repo à Vercel pour le déploiement
