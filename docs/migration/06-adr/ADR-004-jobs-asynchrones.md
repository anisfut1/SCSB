# ADR-004 — Jobs asynchrones et planification
- **Date** : 2026-10-07 ; **révision 2026-10-08 (Python/FastAPI) : `pg-boss` remplacé par Procrastinate**, voir « Révision FastAPI » ci-dessous
- **Statut** : Proposée (révisée le 2026-10-07 pour Railway ; dépend de Q-015 pour la connexion de `pg-boss`)

## Révision FastAPI (2026-10-08)
### Options comparées (back Python)
| Option | Avantages | Inconvénients |
|---|---|---|
| **A. Procrastinate** (file dans PostgreSQL, psycopg 3, asyncio) | Aucune infra de plus ; retries, planification périodique, verrous en base, workers asyncio (annoncés par le projet ; **détails d'API non revérifiés ici**) ; cohérent avec le choix de psycopg 3 (ADR-003) ; enqueue dans la même transaction que l'écriture métier **à vérifier** | Veut **son schéma** (appliqué par sa commande de migration, schéma/droits à valider derrière le rôle dédié) ; `LISTEN/NOTIFY` exige une connexion de session ; moins répandu que Celery |
| B. **arq** (Redis) / **Celery + Redis** | Très répandus, outillage riche | **Redis à exploiter** sur Railway (service en plus, sauvegarde, secret) sans besoin chiffré à ~quelques dizaines d'utilisateurs ; enqueue non transactionnel avec Postgres |
| C. File maison : table `jobs` + `SELECT … FOR UPDATE SKIP LOCKED` (modèle existant `fbi_jobs`/claim, `worker/src/jobs/claim.ts`) | Aucune dépendance, maîtrise totale | Retries, backoff, planification périodique, reprise après crash : à réécrire et tester |
| D. Tâches de fond FastAPI (`BackgroundTasks`) | Zéro infra | Perdues au redémarrage, pas de retries ni de statut : **exclu** (la fermeture d'onglet comme un redéploiement perdraient le travail) |
### Faits vérifiés (docs consultées le 2026-10-08)
- Procrastinate s'appuie sur les verrous de PostgreSQL et sur **`LISTEN`** pour être notifié d'une nouvelle tâche ; on peut désactiver `LISTEN/NOTIFY` (option `--no-listen-notify`, une connexion de moins par worker) ; avec un pooler externe, un `AsyncNullConnectionPool` désactive le pool applicatif (procrastinate.readthedocs.io — pages « Limit the number of opened connections » et résultats de recherche ; **page dédiée aux poolers non retrouvée : 404**).
- PgBouncer : `LISTEN` incompatible avec le pooling transaction (pgbouncer.org/features.html).
### Non vérifié
Fonctionnement de Procrastinate derrière **Supavisor** (session et transaction), droits nécessaires pour son schéma avec un rôle à privilèges minimaux, version exacte et prérequis Python/PostgreSQL → **test V2** en staging ; **repli** : `--no-listen-notify` (sondage) puis option (c) d'ADR-003 (petite base Railway dédiée à la file) puis option C ci-dessus.
### Décision (révision)
**Option A (Procrastinate)** — pas de Redis (aucun besoin chiffré à cette charge). Mêmes règles qu'avant : service `worker` distinct (même image, ADR-007), contrat `Prefer: respond-async` → `202 {jobId}`, `GET /v1/jobs/{jobId}` (statuts `pending|claimed|running|succeeded|failed`, correspondance à définir avec les états Procrastinate `todo|doing|succeeded|failed` — **non vérifiée**), `Idempotency-Key` via le verrou de file/`queueing_lock` (**non vérifié**), concurrence 2, délai 300 s, 3 essais pour les erreurs réseau uniquement, **aucun rejeu automatique des écritures FBI** (`retry=False`). Connexion : **session mode uniquement**. Les mentions de `pg-boss` ci-dessous sont **historiques**.

## Contexte
TRT-004 : 11 endpoints retiennent une requête HTTP de 30 à 280 s depuis le navigateur (`integrations.ts:64,82,98,138`, `derogations.ts:44`, `matches.ts:107,127`, `publicTables.ts:134,143`, `licencies.ts:52,65`) ; incident de production documenté (`client.ts:13-17`). Le motif `202 + jobId` + `GET /v1/jobs/{jobId}` existe déjà (`jobs.ts:7-44`). Le travail réel (FFBB, FBI avec navigateur headless, e-Marque) est dans `club-manager-api` ; en coexistence, le nouveau back **pilote** ces traitements sans les réimplémenter.
Besoins : retries, idempotence, visibilité du statut, planification récurrente, un seul service worker (pas de cluster), peu de services à exploiter.

## Options étudiées
| Option | Avantages | Inconvénients |
|---|---|---|
| A. **File dans PostgreSQL : `pg-boss`** (ou `graphile-worker`) | Aucune infra de plus (Postgres déjà là) ; enqueue transactionnel avec l'écriture métier ; retries, délais, cron intégrés ; statuts interrogeables en SQL | Charge supplémentaire sur la base Supabase (faible) ; connexion **directe** requise (pas le pooler transactionnel) ; débit limité (largement suffisant ici) |
| B. **Redis + BullMQ** | Très répandu, tableau de bord, débit élevé | Service supplémentaire à exploiter/sauvegarder sur Railway ; enqueue non transactionnel avec Postgres |
| C. Table `jobs` maison + cron (modèle actuel `fbi_jobs`/claim, `worker/src/jobs/claim.ts`) | Aucun paquet ; connu de l'équipe | On réimplémente retries/verrous/backoff ; plus de bugs potentiels |
| D. Rester en synchrone, augmenter les timeouts | Zéro travail | Cause du TRT-004 ; fragile ; inacceptable |

## Décision (proposée)
**Option A (`pg-boss`)**, processus **worker** distinct du processus API, **même image Docker**, commande différente — sur Railway : **service `worker` séparé** (ADR-007). Contrat HTTP : `Prefer: respond-async` → `202 {jobId}` ; `GET /v1/jobs/{jobId}` (statuts `pending|claimed|running|succeeded|failed`, déjà consommés par `pollJobUntilTerminal`). Idempotence : `Idempotency-Key` (clé = `singletonKey` du job). Chaque job porte `clubId` et `requestedBy` (autorisation du suivi). Les jobs de **coexistence** appellent `club-manager-api` en serveur-à-serveur avec un jeton de service (secret côté VPS, jamais le JWT utilisateur). Limites : concurrence 2 par défaut (estimé), délai par job 300 s, 3 essais avec backoff exponentiel pour les erreurs réseau uniquement (jamais de rejeu automatique d'une **écriture FBI** non idempotente → `retryLimit: 0` pour `derogation/create|respond`).

## Conséquences
- (+) Le navigateur ne retient plus de connexion ; fermeture d'onglet sans perte ; statut consultable.
- (−) Nouveau mode de défaillance : worker arrêté → jobs `pending` ; il faut une alerte (profondeur de file, âge du plus ancien job) et `GET /ready` qui le reflète.
- (−) Pour les écritures FBI, un job en échec après envoi partiel exige une réconciliation (état `failed` + détail) — **à concevoir avec le propriétaire du pipeline FBI**.
- À surveiller : taille du schéma `pgboss` (purge d'archives), connexions consommées ; scale-out futur (plusieurs workers) supporté par `pg-boss`.

## Révision Railway (2026-10-07)
- **Version et prérequis** (docs pg-boss, vérifiées) : v12.37, **Node ≥ 22.12** (Node 24 convient), **PostgreSQL ≥ 13** ; cron et RRULE intégrés, retries avec backoff exponentiel. Le dépôt cible Supabase (PostgreSQL ≥ 13 : à confirmer par la version affichée).
- **Connexion de `pg-boss`** selon Q-015 (ADR-003) :
  | Cas | Verdict |
  |---|---|
  | (a) Supabase, **Supavisor session mode (5432)** | **Probablement compatible** (session conservée) mais **non documenté par pg-boss : à tester** (démarrage, migration de schéma `pgboss`, cron, reprise après redémarrage) |
  | (a) Supabase, **transaction mode (6543)** | **À proscrire** pour `pg-boss` (verrous/sessions) |
  | (a) Supabase, connexion directe | IPv6 : possible seulement si l'IPv6 sortant de Railway est confirmé (non documenté) ou add-on IPv4 |
  | (b) Postgres Railway, réseau privé | Nominal |
  | (c) petit Postgres Railway **dédié à la file** | Nominal ; enqueue non transactionnel avec les données métier (acceptable, ADR-003) |
- **Repli** : si le test échoue en (a) → option (c). Le choix est réversible : seule la chaîne de connexion de la file change.
- **Worker sur Railway** : service dédié, redémarrage automatique ; **les healthchecks Railway ne surveillent pas en continu** (ADR-007 §6) → job « battement » + alerte sur l'âge du plus vieux job et sur le battement manquant. Arrêt propre sur `SIGTERM` (terminer le job en cours avant sortie : à tester).
- **Planification** : `pg-boss` (cron) suffit ; les « Cron jobs » Railway ne sont pas nécessaires. Les crons Vercel existants restent chez `club-manager-api` (ADR-005).
- **Requêtes longues** : le motif `202 + jobId` reste obligatoire (limite plateforme 5 min d'inactivité/15 min, ADR-007) ; l'adaptateur vers `club-manager-api` utilise un délai de 300 s côté worker (non dépendant du navigateur).
