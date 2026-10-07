# ADR-003 — Accès aux données du nouveau back
- **Date** : 2026-10-07
- **Statut** : **Acceptée pour la phase S3** : Supabase conservé (Q-015, décision du 2026-10-07) ; accès par SQL typé (Kysely) maintenu ; **réévaluation obligatoire en fin de S3** (voir ci-dessous).
- **Révision** : 2026-10-07 (nouveau back sur Railway, Q-012) ; **révision 2026-10-08 (étape B) : ORM SQLAlchemy 2 et schéma source (section « Révision ORM »)** ; **révision 2026-10-08 : back Python/FastAPI (ADR-002)** — le choix d'outil d'accès aux données ci-dessous (Kysely + `pg`) est **remplacé** par la section « Révision FastAPI » ; le reste (Supabase conservé, rôle dédié, autorisation dans le code, schéma séparé, réévaluation en fin de S3) reste valable.

## Révision ORM (2026-10-08, étape B) — remplace le point 3 de la « Révision FastAPI »
### Décision
**SQLAlchemy 2 ORM (modèles typés `Mapped[...]`)**, pilote psycopg 3 (inchangé). Pas de SQLModel. Deux bases déclaratives **distinctes**, donc deux `MetaData` :
- `ApiBase` : tables propres au back, schéma **`api2`**, lecture-écriture, **seul périmètre d'Alembic** (`target_metadata = ApiBase.metadata`, `include_schemas=True`, `include_object` ne retient que `schema == "api2"`, `version_table_schema="api2"`). Un test prouve qu'une autogénération sur une base contenant les tables partagées ne produit aucune opération sur elles.
- `SharedBase` : tables d'autrui (`club-manager-api`), **lecture seule**. Jamais créées, modifiées ni migrées ; hors `target_metadata`. Garde-fou applicatif : un écouteur `before_flush` refuse tout objet `SharedBase` nouveau, modifié ou supprimé. Garde-fou base : rôle dédié avec `SELECT` colonne par colonne (point 5). Seule écriture envisagée hors `api2` : **aucune** au LOT-02 (la spécification `11` §7.9 n'écrit que dans `api2`).
- Pas de clé étrangère de `api2` vers une table partagée (découplage des migrations) ; l'intégrité est assurée par les purges (`11` §7.9.1.6) et la relecture de la fiche à l'approbation.
Alternative écartée : ORM unique avec un `MetaData` commun (risque qu'une autogénération voie les tables partagées).

### Tables et frontière d'accès
Source du schéma réel : l'historique git du front, dernière version des migrations Supabase au commit `5deeaa4` (2026-09-21), supprimées ensuite par `a51b9ad` (2026-09-22). **Ce schéma date de quelques jours avant la bascule vers `club-manager-api` et n'a jamais été comparé à la base réelle : toute colonne ajoutée depuis est inconnue.** Le propriétaire doit le confirmer (`pg_dump --schema-only` des seules tables ci-dessous).
| Table | Propriétaire | Accès du back | Source du schéma |
|---|---|---|---|
| `public.clubs` (colonnes lues : `id`, `slug`, `status`, `timezone`) | `club-manager-api` | **lecture seule** | réelle : `5deeaa4:supabase/migrations/20260921083000_club.sql:4` (créée `club`, `68c5c86`) puis `…20260921100000_clubs_rename_and_extend.sql:14-20,36-38` (`a9ed788`) |
| `public.licencies` (colonnes lues : `id`, `club_id`, `first_name`, `last_name`, `email`, `active`) | `club-manager-api` | **lecture seule** | réelle : `5deeaa4:supabase/migrations/20260921083010_licencies.sql:4-16` (`68c5c86`) ; index `…20260921083010_licencies.sql:21` |
| `public.club_memberships` (`id`, `club_id`, `user_id`, `licencie_id`, `status`) | `club-manager-api` | **lecture seule** | réelle : `5deeaa4:supabase/migrations/20260921100020_club_memberships.sql:30-38` (`a9ed788`) |
| `public.membership_roles` (`membership_id`, `role`, `scope_team_id`) et type `club_role` | `club-manager-api` | **lecture seule** | réelle : `…20260921100020_club_memberships.sql:18-25,80-94` |
| Jetons de lien personnel (nom supposé `licencie_link_tokens` : `licencie_id`, `created_at`, `last_sent_at`) | `club-manager-api` | **lecture seule** (le back ne crée aucun jeton avant LOT-02b) | **hypothèse** : aucune table de jetons dans l'historique du front ; seuls les DTO le laissent supposer (`11` §9) |
| Droits d'écriture d'une fiche | calculés | — | **hypothèse** : le type `club_role` ne contient pas de rôle « coordinateur de dérogations » (`…20260921100020_club_memberships.sql:18-25`) ; les champs `public_admin/public_coach/public_coordinator` du DTO ne sont **pas** des colonnes dans l'historique |
| `auth.users` | Supabase Auth | **non mappée** | réelle : référencée par `…20260921100020_club_memberships.sql:33` |
| `api2.rate_limits`, `api2.claim_requests`, `api2.claim_decisions`, `api2.alert_counters` | le back | **lecture-écriture**, Alembic | conception (`11` §7.2, §7.4, §7.9.4) |
Colonnes **contredites ou absentes** par rapport à l'hypothèse de `11` §9 : voir `11` §9 (révisé).

### Limitation de débit sans bibliothèque (décision proposée, à valider)
Compteurs dans **`api2.rate_limits`** (Postgres) : une instruction `INSERT … ON CONFLICT (bucket, window_start) DO UPDATE SET hits = hits + 1 RETURNING hits`, atomique, donc exacte avec plusieurs instances Railway ; clé = HMAC(IP, sel journalier dérivé d'un secret) — jamais l'IP en clair. **Écart assumé avec `11` §7.4** (« en mémoire, jamais écrite ») : seule l'empreinte, non réversible sans le secret, est stockée, purgée à la fin de la fenêtre (≤ 1 jour) ; la contrepartie est un aller-retour SQL par requête. Rejeté : mémoire locale (le budget effectif serait multiplié par le nombre d'instances et casserait le test d'énumération §7.5-6).

### Procrastinate et pilote
Procrastinate propose `PsycopgConnector` (psycopg v3, asynchrone) et `SyncPsycopgConnector` ; `AiopgConnector`, `Psycopg2Connector` existent aussi (https://procrastinate.readthedocs.io/en/stable/howto/basics/connector.html, consultée le 2026-10-08). La page « connexions » (…/howto/production/connections.html) indique que `LISTEN/NOTIFY` consomme une connexion par worker et peut être désactivé ; **ni l'une ni l'autre ne traite des poolers de manière explicite** hormis la mention de `pool_factory` pour un pooler externe. Conclusion : psycopg 3 confirmé ; compatibilité avec Supavisor **non documentée** → test V2 en staging (session mode obligatoire pour `LISTEN`).

## Révision FastAPI (2026-10-08)
### Faits vérifiés dans la documentation (consultée le 2026-10-08)
| Fait | Source |
|---|---|
| Supavisor **session mode (port 5432)** : « supporte les requêtes préparées » ; **transaction mode (6543)** : « ne supporte pas les requêtes préparées » ; les deux utilisent des adresses `…pooler.supabase.com` en **IPv4** sur toutes les offres ; la connexion directe (`db.<ref>.supabase.co:5432`) est en IPv6 (IPv4 avec add-on) et recommandée pour les backends persistants | supabase.com/docs/guides/database/connecting-to-postgres |
| **asyncpg** : derrière PgBouncer en pooling `transaction` ou `statement`, erreurs `prepared statement "__asyncpg_stmt_xx__" does not exist` ; remèdes : pool asyncpg intégré, **`statement_cache_size=0`**, ou mode `session` | magicstack.github.io/asyncpg/current/faq.html |
| **psycopg 3** : préparation automatique après `prepare_threshold` exécutions (désactivable : `prepare_threshold=None`) ; les middlewares de pooling ne sont « pas compatibles avec les requêtes préparées » sauf déclaration contraire ; **support de PgBouncer ≥ 1.22 à partir de psycopg 3.2** | psycopg.org/psycopg3/docs/advanced/prepare.html |
| **PgBouncer** : en pooling transaction, jamais compatibles : `SET/RESET`, **`LISTEN`**, `PREPARE/DEALLOCATE`, verrous consultatifs de session ; plans préparés au niveau protocole possibles si `max_prepared_statements` ≠ 0 | pgbouncer.org/features.html |
| SQLAlchemy 2 (dialecte asyncpg) expose `prepared_statement_cache_size`, `prepared_statement_name_func` et `statement_cache_size` pour PgBouncer en pooling transactionnel | docs.sqlalchemy.org/en/20/dialects/postgresql.html (section « Prepared Statement Name with PGBouncer » : **liste des paramètres lue, détail non lu**) |
### Non vérifié
- **Supavisor n'est pas PgBouncer** : aucune des documentations ci-dessus ne dit si asyncpg ou psycopg 3 fonctionnent avec les requêtes préparées derrière Supavisor en mode **transaction** au-delà de la phrase de Supabase ; la prise en charge de psycopg 3.2 est documentée pour **PgBouncer 1.22+**, pas pour Supavisor → **« non vérifié » pour Supavisor** (test V2 en staging).
- Comportement de `LISTEN/NOTIFY` derrière **Supavisor session mode** : cohérent avec PgBouncer (session conservée), **non documenté pour Supavisor** → test V2.
### Décision (révision)
1. **Pilote : psycopg 3** (`psycopg[binary,pool]`) pour l'API **et** le worker — Procrastinate (ADR-004) est bâti sur psycopg 3, donc **un seul pilote** à qualifier derrière le pooler. asyncpg est écarté : deuxième pilote à qualifier, et son cache d'instructions préparées est le piège documenté ci-dessus.
2. **Pooler : Supavisor session mode (5432)** pour l'API et le worker (requêtes préparées permises, `LISTEN` conservé). **Mode transaction (6543) exclu** pour le worker ; pour l'API, possible seulement après un test V2 positif **et** avec `prepare_threshold=None`. Connexion directe : seulement si l'IPv6 sortant de Railway est confirmé (non documenté).
3. ~~Accès aux données : SQLAlchemy 2.x Core, pas d'ORM~~ **remplacé par la « Révision ORM » ci-dessus (SQLAlchemy 2 ORM, tables d'autrui en lecture seule).** Texte d'origine :  SQLAlchemy 2.x Core (async), SQL explicite — pas d'ORM sur les tables du propriétaire historique. Les tables lues (`licencies`, `clubs`, …) sont décrites par des objets `Table` **minimaux** (seulement les colonnes nécessaires : principe de moindre privilège aussi dans le code) ; les agrégations s'écrivent en SQL lisible. Alternative écartée : SQL brut via psycopg seul (moins de garde-fous contre l'injection et pas de composition) ; ORM complet (veut posséder le schéma, conflit avec `club-manager-api`).
4. **Migrations : Alembic, limité au schéma propre du back** (`api2`, `version_table_schema='api2'`, `include_schemas`/`include_object` filtrant tout autre schéma) ; **jamais** d'autogenerate sur les tables d'un autre propriétaire. En scénario remplacement (ADR-005 S2), le périmètre d'Alembic s'élargit par décision explicite.
5. **Rôle Postgres dédié à privilèges minimaux** (non `service_role`) : `SELECT` colonne par colonne sur les tables lues (`GRANT SELECT (id, club_id, first_name, last_name, active) ON …`) ; `ALL` uniquement sur `api2` ; un second rôle pour le worker si besoin. La recherche publique (LOT-02) lit **uniquement** ces colonnes.
6. **Réglages de connexion** : pool applicatif borné (API ≤ 10, worker ≤ 5, estimés) ; `sslmode=verify-full` ; `application_name` distinct par service ; délai d'instruction (`statement_timeout`) défini par le rôle.
7. Les points « Option (a)/(b)/(c) », Q-015 et la réévaluation de fin de S3 ci-dessous sont **inchangés**.


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

## Décision (proposée le 2026-10-07 — **outil remplacé par la révision FastAPI ci-dessus**)
**Option A (Kysely + `pg`)**, avec : (1) un **rôle Postgres dédié au back, non `service_role` de Supabase**, droits minimaux (`SELECT` sur les tables lues, `INSERT/UPDATE` sur ses seules tables) ; (2) le schéma des tables **propres au nouveau back** dans un schéma séparé (ex. `api2`), jamais de modification des tables appartenant à `club-manager-api` en scénario coexistence ; (3) types générés par `kysely-codegen` en CI ; (4) autorisation centralisée : une fonction `requireClubRole(clubId, roles)` appelée par chaque route, avec tests « 403 par rôle » ; (5) en **scénario remplacement** (ADR-005 S2), le back reprend aussi les migrations (Supabase CLI ou `node-pg-migrate`).
Connexion : **voir la révision Railway** (la connexion directe 5432 supposée en Phase 3 n'est plus acquise depuis Railway).

## Conséquences
- (+) Aucune dépendance de schéma imposée ; agrégations en une requête ; testable avec une vraie base de test.
- (−) **Responsabilité de sécurité déplacée** de la RLS vers le code : une route oubliée = fuite. Mitigation : middleware d'auth obligatoire par défaut (liste blanche des routes publiques), test automatisé qui énumère les routes et vérifie l'exigence d'auth.
- (−) Le mot de passe du rôle Postgres est un nouveau secret côté Railway (voir `05-architecture-cible.md` §10).
- À surveiller : latence Railway↔Supabase (région ; **non mesurée**), nombre de connexions (limite de l'offre Supabase, à confirmer).

## Révision Railway (2026-10-07) — préparation de Q-015
**Faits vérifiés (docs Supabase, 2026-10-07)** : la connexion **directe** d'une base Supabase est en **IPv6** (IPv4 seulement avec l'add-on payant) ; **Supavisor session mode (port 5432)** et **transaction mode (port 6543)** ont des adresses **IPv4**. Pour un hôte sans IPv6, Supabase recommande le mode session. **Non documenté par Railway** : l'IPv6 sortant, les IP sortantes fixes, la région par défaut → **par prudence, on suppose l'IPv4** (pooler Supavisor).
Les modes de pooling transactionnel sont **incompatibles avec les verrous consultatifs de session** et d'autres fonctions de session (comportement général de PgBouncer-like, source : documentation PgBouncer/Netdata) ; la documentation de `pg-boss` (v12.37, Node ≥ 22.12, PostgreSQL ≥ 13) **ne dit rien** sur les poolers → compatibilité **à tester**, pas à supposer.

### Option (a) — Postgres Supabase conservé, accessible depuis Railway
| Point | Évaluation |
|---|---|
| Données et schéma | **Inchangés** ; l'existant continue d'écrire dans la même base (indispensable en coexistence S3, ADR-005) ; Supabase Auth, Storage (documents e-Marque) et RLS restent en place |
| Connexion | **Supavisor session mode (5432, IPv4)** pour l'API **et** le worker (verrous/`LISTEN`/jobs) ; mode transaction (6543) possible **uniquement** pour des requêtes courtes sans état de session, sous réserve de test ; connexion directe seulement si l'IPv6 sortant de Railway est confirmé ou add-on IPv4 acheté |
| Latence | Dépend du couple (région Railway, région du projet Supabase) : **à co-localiser ; non mesuré**. Chaque requête API → 1 aller-retour BDD (la requête agrégée du tableau de bord, `05` §4.1, en tient compte) |
| Sécurité | Base **exposée sur Internet** (TLS exigé) ; pas de réseau privé Railway↔Supabase ; mitigations : **rôle dédié à privilèges minimaux** (jamais `service_role`), `sslmode=verify-full`, mot de passe fort et rotation, restriction d'IP **impossible** sans IP sortante fixe (non documentée) → le rôle dédié est le garde-fou principal |
| Connexions | Limites de pool selon l'offre Supabase (**à confirmer**) ; budget : API (pool ≤ 10) + worker (≤ 5), estimé |
| Migration | **Aucune** |
| Risque | Dépendance réseau publique ; saturation du pooler partagé avec `club-manager-api` |
### Option (b) — Postgres sur Railway
| Point | Évaluation |
|---|---|
| Données | **Migration obligatoire** des tables que le nouveau back lit ; mais l'existant (**S3 : il écrit encore dans Supabase**) → la copie devrait être **répliquée en continu** (réplication logique/ETL) ou la bascule faite en **une fois** à la fin de la trajectoire |
| Auth | Supabase Auth **conservée** (JWT) ; la base Railway n'a ni `auth.users` ni les politiques RLS dépendant de `auth.uid()` : les clés étrangères/vues qui s'y réfèrent sont à réécrire |
| Latence/sécurité | **Réseau privé** Railway pour api/worker→base (latence minimale, base non exposée) |
| `pg-boss` | Connexion directe sans pooler : **cas nominal**, aucun risque de compatibilité |
| Coût/ops | Sauvegardes, mises à jour, montée de version et supervision de la base **à notre charge** (offre Railway : à confirmer) ; perte des sauvegardes/PITR Supabase pour ces données |
| Risque | **Deux sources de vérité** pendant la coexistence ; cohérence éventuelle ; effort de migration non chiffré (volumétrie estimée faible) |
### Option (c) — hybride : données métier chez Supabase, **file de jobs seule** sur un petit Postgres Railway
`pg-boss` utilise sa propre base (réseau privé, connexion directe, aucun doute de pooler) ; les données métier restent chez Supabase (a). **Contrepartie** : l'enfilage d'un job n'est plus **transactionnel** avec une écriture métier (acceptable : le job suit une autorisation, l'`Idempotency-Key` évite les doublons ; une écriture métier n'est de toute façon faite que par l'existant, ADR-005).
### Recommandation (Q-015)
**(a) maintenant**, avec **(c) comme repli** si le test de `pg-boss` derrière Supavisor échoue (ou si la charge sur le pooler gêne `club-manager-api`). **(b) reportée à la fin de S3** (après retrait de l'existant) et seulement si un besoin concret l'exige. Motifs : S3 impose **une seule base partagée** pendant la coexistence ; (b) crée deux sources de vérité ; (a) ne demande aucune migration.
**À mesurer avant gel** (consignées dans `11-init-repo-back.md`) : région des deux projets, latence aller-retour, test `pg-boss` sur session pooler, limites de connexions.

## Décision Q-015 (2026-10-07) et réévaluation obligatoire
**Décision** : **Supabase est conservé pendant toute la phase S3.** Une base Railway créerait deux sources de vérité tant que `club-manager-api` écrit dans Supabase, et l'authentification Supabase est conservée de toute façon. L'option (c) (petite base Railway pour la file `pg-boss`) reste un **repli technique**, déclenché uniquement par un échec du test V2 (`11` §3).
**Exigence de région** : le service Railway (`api` et `worker`, `staging` et `production`) doit être déployé dans la région **la plus proche possible** de celle du projet Supabase ; les deux régions sont consignées dans `ops/railway.md` et dans `11` ; **la région Supabase n'est pas connue de l'agent** (à fournir, rappel du 🛑).
**Réévaluation obligatoire à la fin de S3** (au plus tard quand le dernier module d'écriture hérité est porté, ou à l'arrêt de `club-manager-api`, selon l'événement qui survient en premier), **fondée sur des mesures, pas sur des préférences** :
| Mesure | Méthode | Seuil de décision (à fixer avec le propriétaire avant la mesure) |
|---|---|---|
| Latence p50/p95 Railway→pooler Supabase | 200 requêtes simples + les 3 requêtes agrégées les plus lourdes (dashboard, results, search), depuis `staging`, aux heures d'usage | p95 > seuil convenu sur les routes de lecture |
| Coût mensuel réel | facture Railway (services + éventuelle base) et plan Supabase, relevés sur ≥ 1 mois complet | écart justifiant l'effort de migration |
| Effort de migration | inventaire des tables lues/écrites par le nouveau back, dépendances à `auth.users` et aux politiques RLS, volumes, fenêtre de coupure, plan de retour | chiffré en jours et en risque |
| Disponibilité/erreurs de connexion | taux d'erreurs BDD du back sur 30 jours | taux supérieur à l'existant |
La bascule vers Postgres Railway n'est envisagée **que si** ces mesures la justifient ; sinon Supabase reste la base du back. La réévaluation donne lieu à un nouvel ADR.
