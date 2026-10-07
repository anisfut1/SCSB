# ADR-003 — Accès aux données du nouveau back
- **Date** : 2026-10-07
- **Statut** : Proposée (dépend de Q-012 : « Supabase conservé pour l'auth et les données ? »)

## Contexte
- Les données métier vivent aujourd'hui dans PostgreSQL via Supabase, avec RLS ; les migrations sont **possédées par `club-manager-api`** (`ARCHITECTURE.md` §1, `docs/MIGRATION_TO_API.md:60-70`). Supabase Auth reste l'émetteur des JWT (front : `proxy.ts`, `auth.server.ts`).
- Besoins : agrégations (TRT-005 tableau de bord, TRT-009 résultats : `COUNT … FILTER`, jointures matchs↔classements par `teamId`), recherche nominative (TRT-001), file de jobs (ADR-004), lecture seule de tables existantes en coexistence.
- Le back doit **revalider JWT et rôles** (R-011) : l'autorisation est donc appliquée **dans le code du back**, pas par la RLS.

## Options étudiées
| Option | Avantages | Inconvénients |
|---|---|---|
| A. **Connexion Postgres directe** (rôle dédié) + **Kysely** (SQL typé, types générés depuis la base) | SQL explicite pour les agrégations ; ne prend pas la propriété du schéma (compatible coexistence) ; pas de moteur binaire ; pooler possible | RLS contournée → toute autorisation à coder et tester ; migrations à outiller à part |
| B. `supabase-js` avec le JWT de l'utilisateur (RLS appliquée) | La RLS existante protège ; peu de SQL | Agrégations/jointures limitées (PostgREST) ; N appels pour un tableau de bord ; dépendance à PostgREST ; peu adapté aux jobs |
| C. **Drizzle ORM** (schéma TS + migrations) | Types forts, migrations intégrées | Veut posséder le schéma → conflit avec le propriétaire actuel des migrations ; surcouche à aligner sur 34 migrations existantes |
| D. **Prisma** | Écosystème, outillage | Moteur/binaire dans l'image Docker, introspection d'un schéma RLS, agrégations moins directes |

## Décision (proposée)
**Option A (Kysely + `pg`)**, avec : (1) un **rôle Postgres dédié au back, non `service_role` de Supabase**, droits minimaux (`SELECT` sur les tables lues, `INSERT/UPDATE` sur ses seules tables) ; (2) le schéma des tables **propres au nouveau back** dans un schéma séparé (ex. `api2`), jamais de modification des tables appartenant à `club-manager-api` en scénario coexistence ; (3) types générés par `kysely-codegen` en CI ; (4) autorisation centralisée : une fonction `requireClubRole(clubId, roles)` appelée par chaque route, avec tests « 403 par rôle » ; (5) en **scénario remplacement** (ADR-005 S2), le back reprend aussi les migrations (Supabase CLI ou `node-pg-migrate`).
Connexion : port **direct 5432** (jobs/advisory locks, ADR-004), pooler transactionnel seulement pour les requêtes API sans état si nécessaire.

## Conséquences
- (+) Aucune dépendance de schéma imposée ; agrégations en une requête ; testable avec une vraie base de test.
- (−) **Responsabilité de sécurité déplacée** de la RLS vers le code : une route oubliée = fuite. Mitigation : middleware d'auth obligatoire par défaut (liste blanche des routes publiques), test automatisé qui énumère les routes et vérifie l'exigence d'auth.
- (−) Le mot de passe du rôle Postgres est un nouveau secret côté VPS (voir `05-architecture-cible.md` §10).
- À surveiller : latence VPS↔Supabase (région ; **non mesurée**), nombre de connexions (limite de l'offre Supabase, à confirmer).
