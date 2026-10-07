# 05 — Architecture cible du nouveau back
_Phase 3, 2026-10-07 — **proposition, en attente de validation 🛑** (Q-011, Q-012, Q-013). Documentation seule : aucun repository créé, aucun code back. Les chiffres de volumétrie sont **estimés** (Q-010 : « garde tes estimations »)._

**Cadrage (Q-002 rouverte)** : la Phase 3 conçoit un **nouveau back**, dans un repository dédié. Le contrat actuellement consommé par le front (`04-contrats-api.md` §A, 92 opérations) est la **contrainte de compatibilité** de départ ; `club-manager-api` n'a pas été lu et reste, par défaut, propriétaire des intégrations (ADR-005).

## 1. Besoins (mesurés en Phase 2 / issus du contrat)
| Charge | Preuve | Besoin pour le back |
|---|---|---|
| Lectures club authentifiées, multi-tenant | 60+ opérations `/v1/clubs/{clubId}/…` (`04` §A.2) | Auth + rôles par club à chaque requête ; 404 identique club inconnu / non membre (`club-context.ts:29-33`) |
| Agrégations pour l'accueil et les résultats | TRT-005/009 (`dashboard/page.tsx:61-102`, `result-groups.ts:33-70`) | Requêtes SQL agrégées, un appel par page |
| Espace public sans compte, données de mineurs | TRT-001, R-013, E-4 | Recherche limitée, limitation de débit, jeton hors URL |
| Opérations longues (30 à 280 s) | TRT-004 (`integrations.ts:64-138`) | `202 + jobId`, worker, idempotence |
| Règles temporelles (saison, journée, DST) | TRT-007/008/012 | Un seul module de dates, `club.timezone` (D-2) |
| Intégrations externes (FFBB, FBI headless, e-Marque, e-mails) | `ARCHITECTURE.md` §1, `FBI_WORKER.md` | Rester chez `club-manager-api` (S1) ; adaptateur côté jobs |
| Volumétrie | **estimée** : quelques clubs, ≤ ~500 matchs/saison/club, ≤ ~1 000 licenciés/club ; quelques dizaines d'utilisateurs actifs | Un seul serveur suffit ; pas de cache distribué ni de bus de messages |

## 2. Stack proposée (5 lignes)
1. **TypeScript + Hono sur Node 24**, OpenAPI généré par Zod (`@hono/zod-openapi`) — ADR-002.
2. **PostgreSQL Supabase conservé**, accès direct par **Kysely + `pg`**, rôle dédié, tables propres dans un schéma séparé — ADR-003.
3. **Jobs `pg-boss`** (file dans Postgres), worker = même image — ADR-004.
4. **Coexistence par routage au reverse proxy** avec `club-manager-api` (strangler), remplacement possible ensuite — ADR-005.
5. **JWT Supabase revalidé côté back** (JWKS + introspection des actions sensibles), jeton personnel haché et transporté en en-tête — ADR-006 ; **Docker Compose + Caddy sur VPS** — ADR-007.

## 3. Architecture globale
```mermaid
flowchart LR
  U[Navigateur] -->|HTTPS| P[Caddy / reverse proxy<br/>VPS]
  subgraph VPS
    P -->|"/"| F[Front Next.js<br/>conteneur]
    P -->|"chemins nouveaux<br/>(table de routage)"| A[API Hono<br/>conteneur api]
    W[Worker pg-boss<br/>conteneur worker] --- A
  end
  P -->|"autres chemins /v1/*"| L[club-manager-api<br/>Vercel, existant]
  A -->|"Postgres direct 5432<br/>rôle dédié"| DB[(Supabase PostgreSQL)]
  W --> DB
  L --> DB
  F -->|"session seulement"| AUTH[Supabase Auth]
  A -->|"JWKS + introspection"| AUTH
  W -->|"serveur à serveur<br/>jeton de service"| L
  L --> EXT[FFBB / FBI / e-Marque]
  A -->|e-mails lien personnel| MAIL[Service d'e-mails]
```
Le front n'a **qu'une base d'URL** : c'est le proxy qui décide quel back répond (table de routage versionnée et testée, ADR-005).

## 4. Séquences avant / après
### 4.1 Tableau de bord d'un club_admin (TRT-002 + TRT-005)
```mermaid
sequenceDiagram
  autonumber
  participant B as Navigateur
  participant N as Front Next.js (RSC)
  participant S as Supabase Auth
  participant A as API (nouveau back)
  participant L as club-manager-api (existant)
  participant D as PostgreSQL
  Note over B,D: AVANT — mesuré par test : 9 appels Auth + 7 appels API
  B->>N: GET /c/x/dashboard
  N->>S: getUser (proxy)
  loop 7 appels api.* (clubs, me, matches, issues, derogations, 2 × demandes)
    N->>S: getUser (un par appel)
    N->>L: GET /v1/clubs/... (club-manager-api)
  end
  Note over B,D: APRÈS — LOT-01 livré (≤ 2 appels Auth), LOT-07 proposé (1 appel API)
  B->>N: GET /c/x/dashboard
  N->>S: getClaims (proxy, local si clés asymétriques)
  N->>A: GET /v1/clubs/x/dashboard (Bearer JWT)
  A->>A: vérif. JWT (JWKS) + rôles (cache ≤ 30 s)
  A->>D: 1 requête agrégée (comptes, 6 derniers résultats, anomalies)
  D-->>A: lignes
  A-->>N: DashboardDto (≈ 6 nombres + 6 matchs)
  N-->>B: HTML
```
_`L` (club-manager-api) n'intervient que dans l'état « avant »._

### 4.2 Opération longue en job asynchrone (TRT-004, ADR-004)
```mermaid
sequenceDiagram
  autonumber
  participant B as Navigateur
  participant A as API
  participant Q as File pg-boss (PostgreSQL)
  participant W as Worker
  participant L as club-manager-api
  B->>A: POST /v1/clubs/x/integrations/ffbb/sync (Prefer: respond-async, Idempotency-Key)
  A->>A: auth + rôle club_admin
  A->>Q: enqueue(job, clubId, requestedBy)
  A-->>B: 202 {jobId}
  loop sondage borné (40 × 1,5 s, jobs.ts)
    B->>A: GET /v1/jobs/{jobId}
    A->>Q: statut
    A-->>B: pending / running
  end
  W->>Q: prend le job
  W->>L: POST …/ffbb/sync (jeton de service, timeout 300 s)
  L-->>W: résultat
  W->>Q: succeeded + résultat
  B->>A: GET /v1/jobs/{jobId}
  A-->>B: succeeded {résultat}
```

### 4.3 Recherche publique de licenciés (TRT-001, LOT-02)
```mermaid
sequenceDiagram
  autonumber
  participant V as Visiteur anonyme
  participant P as Proxy
  participant A as API
  participant D as PostgreSQL
  V->>P: GET /v1/public/clubs/x/licencies/search?q=du
  P->>A: transmis (journal sans query string)
  A->>A: limitation de débit IP + club
  alt q trop court (< 2) ou débit dépassé
    A-->>V: 400 QUERY_TOO_SHORT / 429 RATE_LIMITED
  else q valide
    A->>D: recherche normalisée, LIMIT 8
    D-->>A: ≤ 8 lignes
    A-->>V: 200 { licencies: [≤ 8 × id, prénom, nom, claimed] }
  end
```

## 5. Modèle de données (tables **propres** au nouveau back — proposition)
Les tables métier existantes (matchs, licenciés, clubs…) restent chez leur propriétaire (ADR-003) ; le nouveau back n'ajoute qu'un schéma `api2` minimal, plus le schéma `pgboss` géré par la bibliothèque.
```mermaid
erDiagram
  IDEMPOTENCY_KEY {
    text key PK
    uuid club_id
    text route
    int response_status
    jsonb response_body
    timestamptz created_at
    timestamptz expires_at
  }
  AUDIT_LOG {
    bigint id PK
    timestamptz at
    uuid actor_user_id
    uuid club_id
    text action
    text target
    text request_id
  }
  RATE_LIMIT_BUCKET {
    text bucket_key PK
    int count
    timestamptz window_start
  }
  JOB_OWNERSHIP {
    uuid job_id PK
    uuid club_id
    uuid requested_by
    text type
    timestamptz created_at
  }
```
- `JOB_OWNERSHIP` relie un `jobId` (pg-boss) à son demandeur pour autoriser `GET /v1/jobs/{jobId}` (B.8). `RATE_LIMIT_BUCKET` n'est nécessaire que si plusieurs instances partagent les limites ; **une seule instance** → compteurs en mémoire (par défaut). `AUDIT_LOG` : actions sensibles (écritures FBI, liens personnels), **sans donnée personnelle dans `target`** (identifiants opaques).

## 6. Découpage en modules (domaines)
| Module | Contenu | Endpoints (04) | Lots |
|---|---|---|---|
| `public-access` | recherche licenciés, jeton perso, request-link, home, me | `04` B.1, B.9 | LOT-02, LOT-14 |
| `matches` | liste filtrée/paginée, saison, `weekendKey`, weekends | `04` B.3 | LOT-05/06 |
| `dashboard` | agrégats par rôle | B.5 | LOT-07 |
| `results` | groupes, bilans, classements | B.6 | LOT-08 |
| `licencies` | import texte, auto-assign (job) | B.7 | LOT-09 |
| `venues` | gymnases, rapprochement match↔gymnase | B.2 | LOT-03 |
| `jobs` | enqueue, statut, adaptateurs `club-manager-api` | B.8 | LOT-10 |
| `clubs` | lecture ; l'écriture reste `PATCH /v1/clubs/{id}` existant (E-2) | B.4 | LOT-04 (front) |
| `platform` | `/v1/platform/*` | — | hors lots |
| `shared` | auth, rôles, dates/fuseau, erreurs, pagination, logs | B.11 | tous |

## 7. Authentification et autorisation (ADR-006)
- Chaque requête : **extraction du Bearer → vérification JWKS** (`exp`, `iss`, `aud`) → résolution `(userId)` → **rôles lus en base** pour `(userId, clubId)` (cache ≤ 30 s, estimé) → décision ; introspection `/auth/v1/user` (cache ≤ 10 s) pour les écritures sensibles → **R-011 refermé sur ces actions**.
- Routes publiques : liste blanche explicite ; jeton personnel **haché** en base, comparaison à temps constant, transport par en-tête (E-4/R-014).
- Défense en profondeur : validation Zod de chaque entrée ; CORS en liste blanche ; limitation de débit (publique : par IP et par club ; `request-link` : par licencié) ; `404` identique club inconnu / non membre ; messages d'erreur sans fuite d'information ; journaux sans jeton ni donnée personnelle.
- **Exigence R-013** : tout endpoint public nouveau est conçu sans énumération (longueur minimale, plafond de résultats, pas de total).
- Test de sécurité automatique : énumérer toutes les routes et vérifier qu'aucune n'est publique hors liste blanche ; matrice « rôle × route » (200/403/404).

## 8. Pagination et filtrage serveur
- **Compatibilité** : `limit`/`offset` + `pagination:{limit,offset,total}`, `limit` ≤ 200 (`matches.ts:56-75`) ; les filtres existants `period/teamId/homeAway/status/from/to` sont **déjà** supportés (E-3) → le front peut les utiliser sans attendre.
- **Nouvelles listes** : même forme `offset` (cohérence), `limit` ≤ 100 par défaut 50 ; tri **explicite et stable** (pas de « 50 plus anciens » implicite, piège `matches.ts:40-52`). Curseur seulement si une liste dépasse ~10 000 lignes (non prévu).
- **Cache HTTP** : `Cache-Control: no-store` partout (multi-tenant, `client.ts:64-67`) ; exception **à valider** : lectures publiques sans jeton (matches/standings) avec `public, max-age=30` pour absorber la charge.

## 9. Jobs longs (ADR-004) et fuseau
- **Jobs** : `Prefer: respond-async` → 202 ; statuts `pending|claimed|running|succeeded|failed` ; `Idempotency-Key` ; concurrence 2, délai 300 s, 3 essais (réseau seulement), **aucun rejeu automatique des écritures FBI** ; alertes : profondeur de file et âge du plus vieux job ; planifications récurrentes via `pg-boss` (les crons Vercel restent chez `club-manager-api`).
- **Fuseau (D-2)** : stockage **UTC** ; `club.timezone` validé IANA à l'écriture (E-2) avec repli `Europe/Paris` s'il est absent ; **un seul module `shared/time`** (journée, samedi de référence, saison 1ᵉʳ août, conversions DST-safe) ; l'API renvoie des ISO UTC + `weekendKey` calculé côté back ; tests aux limites (31 juillet/1ᵉʳ août, passage à l'heure d'été/hiver). Les 28 occurrences `Europe/Paris` du front sont traitées dans le lot LOT-05, pas avant.

## 10. Hébergement VPS (ADR-007) — ce que cela implique
| Sujet | Exigence |
|---|---|
| Conteneurs | `api` et `worker` (même image Node 24, commandes distinctes), `proxy` ; non-root, FS en lecture seule, limites mémoire/CPU |
| Reverse proxy & TLS | Caddy (ACME automatique) ou Nginx+certbot si déjà en place ; HSTS ; routage S1 ; journaux d'accès **sans query string** |
| Réseau | 80/443 seulement ; `ufw` ; SSH par clé ; `api`/`worker` non exposés |
| Secrets | `.env` `600` hors dépôt ou Compose secrets ; rôle Postgres dédié, jeton de service vers `club-manager-api`, clé e-mails ; rotation documentée ; jamais en image/log |
| Sauvegardes | base : offre Supabase (**à confirmer**) ; VPS : config + `.env` chiffré hors machine ; test de restauration |
| Déploiement | image construite en CI (`workflow_dispatch`), **déploiement manuel validé**, retour arrière par tag ; `GET /health` (liveness), `GET /ready` (BDD + file) |
| Exploitation | MAJ de sécurité automatiques, rotation des journaux JSON, supervision externe, **point de défaillance unique** assumé |

## 11. Observabilité et erreurs
- Journaux JSON (pino) : `requestId`, `userId` opaque, `clubId`, route, statut, durée ; **jamais** de jeton, e-mail, nom, licence.
- Enveloppe d'erreur **inchangée** (`{error:{code,message,details?}}`, `errors.ts:3-58`) ; registre de codes versionné (reprend ceux listés en `04` §A.1 + `QUERY_TOO_SHORT`, `RATE_LIMITED`, `GONE`).
- Métriques minimales : latence p95 par route, taux 5xx, profondeur de file, âge du plus vieux job ; traces OpenTelemetry **optionnelles** (non justifiées à cette charge).

## 12. Proposition d'arborescence du nouveau repository (non créé)
```
<nouveau-repo>/                       # nom à décider
├── README.md
├── package.json / tsconfig.json / vitest.config.ts
├── Dockerfile                        # image unique, commandes api | worker
├── compose.yaml                      # api, worker, proxy (+ exemple sans secrets)
├── .github/workflows/ci.yml          # typecheck, lint, test, build, audit, gitleaks (même base que SCSB)
├── ops/
│   ├── Caddyfile                     # TLS, en-têtes de sécurité, journaux sans query
│   ├── routing/                      # table de routage S1 (chemin → api | club-manager-api) + test de contrat
│   └── runbook.md                    # déploiement, retour arrière, sauvegardes, rotation des secrets
├── docs/                             # ADR du back, OpenAPI exporté (openapi.json)
├── scripts/                          # smoke (équivalent api-smoke), génération de types DB
├── src/
│   ├── server.ts                     # point d'entrée API (Hono + @hono/node-server)
│   ├── worker.ts                     # point d'entrée worker (pg-boss)
│   ├── app.ts                        # assemblage des modules, middlewares globaux
│   ├── config/                       # env.ts (Zod), jamais de lecture directe de process.env ailleurs
│   ├── shared/
│   │   ├── auth/                     # jwks.ts, introspection.ts, requireUser.ts, requireClubRole.ts
│   │   ├── http/                     # error-envelope.ts, pagination.ts, rate-limit.ts, request-id.ts
│   │   ├── time/                     # timezone.ts, season.ts, weekend.ts (+ tests DST)
│   │   ├── db/                       # kysely.ts, types.generated.ts, tx.ts
│   │   └── log/                      # pino, redaction
│   ├── modules/
│   │   ├── public-access/            # routes.ts, service.ts, repo.ts, schemas.ts, *.test.ts
│   │   ├── matches/ · dashboard/ · results/ · licencies/ · venues/ · clubs/ · platform/
│   │   └── jobs/                     # routes.ts, queue.ts, handlers/ (ffbb-sync.ts, fbi-process.ts …), adapters/club-manager-api.ts
│   └── migrations/                   # SQL du schéma api2 seulement (ADR-003)
└── test/
    ├── contract/                     # parité avec le contrat actuel du front (fixtures dérivées de 04)
    ├── security/                     # routes publiques = liste blanche, matrice rôle × route, anti-énumération
    └── integration/                  # base Postgres de test, jobs
```
Conventions : un module = `routes` (HTTP + Zod) → `service` (règles) → `repo` (Kysely) ; **aucun accès BDD dans `routes`** ; erreurs métier typées → enveloppe unique ; routes sous `/v1` ; versionnement par préfixe, jamais de changement cassant sans `/v2` ; noms de champs `camelCase` comme le contrat actuel.

## 13. Hypothèses explicites et limites
- Aucune lecture du code de `club-manager-api` : tout ce qui le concerne vient des commentaires du front (`integrations.ts`, `matches.ts`…) et de `docs/` ; il peut déjà avoir certains des comportements proposés (ex. limitation de débit).
- Supabase conservé pour l'auth et la base (Q-012 non répondue) ; clés JWT et durée de vie inconnues (Q-008).
- VPS : ressources, Docker, proxy inconnus (Q-013).
- Aucune mesure de latence réseau (VPS↔Supabase, VPS↔Vercel) ; toutes les valeurs de limites (débit, TTL de cache, concurrence) sont **estimées** et à calibrer.
