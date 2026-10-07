# ADR-004 — Jobs asynchrones et planification
- **Date** : 2026-10-07
- **Statut** : Proposée

## Contexte
TRT-004 : 11 endpoints retiennent une requête HTTP de 30 à 280 s depuis le navigateur (`integrations.ts:64,82,98,138`, `derogations.ts:44`, `matches.ts:107,127`, `publicTables.ts:134,143`, `licencies.ts:52,65`) ; incident de production documenté (`client.ts:13-17`). Le motif `202 + jobId` + `GET /v1/jobs/{jobId}` existe déjà (`jobs.ts:7-44`). Le travail réel (FFBB, FBI avec navigateur headless, e-Marque) est dans `club-manager-api` ; en coexistence, le nouveau back **pilote** ces traitements sans les réimplémenter.
Besoins : retries, idempotence, visibilité du statut, planification récurrente, un seul VPS (pas de cluster), peu de services à exploiter.

## Options étudiées
| Option | Avantages | Inconvénients |
|---|---|---|
| A. **File dans PostgreSQL : `pg-boss`** (ou `graphile-worker`) | Aucune infra de plus (Postgres déjà là) ; enqueue transactionnel avec l'écriture métier ; retries, délais, cron intégrés ; statuts interrogeables en SQL | Charge supplémentaire sur la base Supabase (faible) ; connexion **directe** requise (pas le pooler transactionnel) ; débit limité (largement suffisant ici) |
| B. **Redis + BullMQ** | Très répandu, tableau de bord, débit élevé | Service supplémentaire à exploiter/sauvegarder sur le VPS ; enqueue non transactionnel avec Postgres |
| C. Table `jobs` maison + cron (modèle actuel `fbi_jobs`/claim, `worker/src/jobs/claim.ts`) | Aucun paquet ; connu de l'équipe | On réimplémente retries/verrous/backoff ; plus de bugs potentiels |
| D. Rester en synchrone, augmenter les timeouts | Zéro travail | Cause du TRT-004 ; fragile ; inacceptable |

## Décision (proposée)
**Option A (`pg-boss`)**, processus **worker** distinct du processus API, **même image Docker**, commande différente. Contrat HTTP : `Prefer: respond-async` → `202 {jobId}` ; `GET /v1/jobs/{jobId}` (statuts `pending|claimed|running|succeeded|failed`, déjà consommés par `pollJobUntilTerminal`). Idempotence : `Idempotency-Key` (clé = `singletonKey` du job). Chaque job porte `clubId` et `requestedBy` (autorisation du suivi). Les jobs de **coexistence** appellent `club-manager-api` en serveur-à-serveur avec un jeton de service (secret côté VPS, jamais le JWT utilisateur). Limites : concurrence 2 par défaut (estimé), délai par job 300 s, 3 essais avec backoff exponentiel pour les erreurs réseau uniquement (jamais de rejeu automatique d'une **écriture FBI** non idempotente → `retryLimit: 0` pour `derogation/create|respond`).

## Conséquences
- (+) Le navigateur ne retient plus de connexion ; fermeture d'onglet sans perte ; statut consultable.
- (−) Nouveau mode de défaillance : worker arrêté → jobs `pending` ; il faut une alerte (profondeur de file, âge du plus ancien job) et `GET /ready` qui le reflète.
- (−) Pour les écritures FBI, un job en échec après envoi partiel exige une réconciliation (état `failed` + détail) — **à concevoir avec le propriétaire du pipeline FBI**.
- À surveiller : taille du schéma `pgboss` (purge d'archives), connexions consommées ; scale-out futur (plusieurs workers) supporté par `pg-boss`.
