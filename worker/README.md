# FBI worker

Service séparé, **hors Vercel**, qui automatise réellement FBI/e-Marque avec
Playwright. Voir `docs/FBI_WORKER.md` (racine du repo) pour l'architecture
complète (app ↔ DB ↔ worker) ; ce fichier couvre le déploiement et l'usage
pratique de ce dossier.

## Pourquoi un service séparé ?

Une Vercel Function ne peut pas raisonnablement faire tourner un Chromium
headless (temps de démarrage, taille du binaire, durée d'exécution limitée).
Ce worker est donc un **petit processus Node long-running**, déployé
ailleurs, qui :

1. Réclame des jobs dans PostgreSQL (`fbi_jobs`, via la fonction
   `claim_next_fbi_job`, `FOR UPDATE SKIP LOCKED` — voir
   `supabase/migrations/20260921110000_fbi_jobs.sql`).
2. Pilote un Chromium headless (Playwright) pour se connecter à FBI et
   télécharger les documents e-Marque (`src/fbi/browser-client.ts`).
3. Dépose les fichiers dans Supabase Storage et une ligne par fichier dans
   `match_documents`.
4. **Ne parse rien** — le PARSING (OCR/PDF, déjà construit et testé) reste
   une route Vercel classique (`/api/internal/parse-emarque`, voir
   `../src/lib/domain/emarque/parse-downloaded-documents.ts`) qui consomme
   `match_documents.status = 'downloaded'`. Cette séparation évite de
   dupliquer la lourde pile OCR (`pdfjs-dist`, `@napi-rs/canvas`,
   `tesseract.js`) dans une image Docker qui contient déjà Chromium.

## Pourquoi dupliquer certains modules plutôt qu'importer `../src` ?

`crypto.ts`, `logger.ts`, les types FBI (`fbi/errors.ts`, `db-types.ts`) ont
un équivalent dans l'app Next.js (`../src/lib/...`). Ils sont **recopiés
volontairement**, pas importés :

- L'app Next.js importe `server-only` un peu partout, ce qui casse en
  dehors du runtime Next.js.
- Un Dockerfile qui `COPY`ierait des bouts de `../src` coupterait ce worker
  à la structure interne de l'app — un refactor de l'app casserait le
  worker sans lien évident.
- Chaque copie est petite (quelques dizaines de lignes), stable (le
  chiffrement AES-256-GCM ou la classification d'erreurs FBI ne changent
  pas souvent), et clairement commentée comme telle : le risque de
  divergence silencieuse est faible et le gain en déployabilité
  indépendante l'emporte.

Le schéma de base de données, lui, N'EST PAS dupliqué comme source de
vérité : `supabase/migrations/` (racine du repo) reste la seule source ;
`db-types.ts` n'en est qu'une projection TypeScript manuelle du sous-ensemble
de colonnes que ce worker touche.

## Développement local

```bash
cd worker
npm install
cp .env.example .env   # remplir SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
                        # FBI_CREDENTIALS_ENCRYPTION_KEY (même valeur que l'app)
npm run dev             # tsx --watch
```

## Tests

```bash
npm test
```

Aucun test ne contacte le vrai FBI (réseau `*.ffbb.com` bloqué de toute
façon dans beaucoup d'environnements, voir `../docs/FBI_AUTHENTICATED_SPIKE.md`).
`browser-client.test.ts` lance un vrai Chromium headless contre un petit
serveur HTTP local qui sert des pages HTML synthétiques plausibles
(`test/fixtures/*.html`) — voir `../docs/FBI_WORKER.md` pour ce que ça
prouve et ce que ça ne prouve pas.

## Déploiement

Choix retenu : **Railway** (le plus simple des trois pour ce besoin — un
Dockerfile, un service long-running, pas de config supplémentaire). Render
ou Fly.io fonctionneraient de façon équivalente avec le même `Dockerfile`
si un changement de plateforme est préféré plus tard ; rien dans le code
n'est spécifique à Railway.

### Railway

1. Nouveau projet Railway → "Deploy from GitHub repo" → sélectionner ce
   repo.
2. Dans les paramètres du service : **Root Directory** = `worker` (Railway
   construit alors `worker/Dockerfile` avec `worker/` comme contexte).
3. Variables d'environnement (voir `.env.example` ci-dessus) : au minimum
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `FBI_CREDENTIALS_ENCRYPTION_KEY`.
4. Railway détecte le `HEALTHCHECK` du Dockerfile ; exposer le port `8080`
   (ou définir `PORT` et l'aligner).
5. Déployer. Le worker tourne en continu, interroge `fbi_jobs` toutes les
   `WORKER_POLL_INTERVAL_MS` (15s par défaut) quand la file est vide.

Aucune autre configuration Vercel n'est nécessaire pour que le worker
fonctionne : il ne lit/écrit QUE PostgreSQL (via le client Supabase) et
Supabase Storage, jamais l'app Next.js elle-même.

### Secrets (§51 du brief FBI)

| Variable | Requis | Description |
| --- | --- | --- |
| `SUPABASE_URL` | oui | Même projet Supabase que l'app. |
| `SUPABASE_SERVICE_ROLE_KEY` | oui | Bypass RLS — jamais exposée ailleurs qu'ici et dans l'app serveur. |
| `FBI_CREDENTIALS_ENCRYPTION_KEY` | oui | **Doit être identique** à celle de l'app, sinon déchiffrement impossible. |
| `WORKER_ID` | non | Préfixe diagnostique dans les logs/`fbi_jobs.claimed_by` — jamais un secret. |
| `WORKER_POLL_INTERVAL_MS` | non | Défaut 15000. |
| `WORKER_CONCURRENCY` | non | Défaut 2 (§12 du brief FBI : commencer bas). |
| `PORT` | non | Défaut 8080, pour `/health`. |
| `FBI_BASE_URL` | non | Défaut `https://extranet.ffbb.com/fbi`. |

Aucune de ces variables n'est commitée (voir `.gitignore` : `.env` exclu).

## Health check

`GET /health` → `{"status":"ok","version":"0.1.0","dbConnected":true}`
(ou `503`/`"degraded"` si la connexion à PostgreSQL échoue). Jamais de
secret dans la réponse (§48 du brief FBI).
