# 11 — Initialisation du nouveau repository du back (préparation, **rien n'est exécuté**)
_2026-10-07. Le propriétaire crée le repository lui-même et en communiquera l'URL ; **l'agent ne crée ni dépôt, ni code back, ni service Railway**. Ce document est une checklist et un plan de livraison. Prérequis de décision : ADR-003 (Q-015), ADR-005 (Q-016), Q-017, Q-018._

## 0. Décisions à prendre avant de commencer
| ID | Décision | Pourquoi ça bloque |
|---|---|---|
| Nom du dépôt, visibilité (privé recommandé), organisation GitHub | propriétaire | `ops/`, domaines, secrets |
| Q-015 | Base : Supabase (a) / Railway (b) / hybride file seule (c) | connexion de l'API et de `pg-boss` |
| Q-016 | Routage S3 : (a) client / (b) passerelle (recommandé : (c) = (a) maintenant) | structure de `ops/contract/` et du front |
| Q-017 | Où est réellement le front (Vercel ? VPS ?) | CORS (origine autorisée), CSP |
| **Q-018** | **« Annuaire public authentifié » (consigne du propriétaire) : quelle authentification, exactement ?** Voir §7 | forme du contrat du LOT-02 |

## 1. Arborescence initiale (sous-ensemble minimal pour le LOT-02 ; reprise du §12 de `05`, adaptée à Railway)
```
<nouveau-repo>/
├── README.md · package.json · tsconfig.json · vitest.config.ts · eslint.config.mjs · .nvmrc (24) · .gitignore (.env*)
├── Dockerfile                          # multi-étapes, node:24-slim épinglé par digest, non-root ; commandes api | worker
├── .github/
│   ├── workflows/ci.yml                # voir §4
│   ├── dependabot.yml                  # npm + github-actions + docker, hebdomadaire
│   └── CODEOWNERS
├── ops/
│   ├── railway.md                      # réglages du tableau de bord (§3)
│   ├── runbook.md                      # déploiement, retour arrière, rotation des secrets, vérifications V1–V6
│   └── contract/ported-routes.json     # préfixes portés, consommé par les tests du front (ADR-005)
├── docs/                               # ADR du back + openapi.json exporté
├── src/
│   ├── server.ts · app.ts · worker.ts  # worker : coquille vide au LOT-02 (démarre pg-boss si Q-015 tranchée)
│   ├── config/env.ts                   # Zod ; seule lecture de process.env
│   ├── shared/{http,db,log,auth,time}/ # http : error-envelope, cors, rate-limit, request-id ; log : redaction sans query
│   └── modules/public-access/          # routes.ts · service.ts · repo.ts · schemas.ts · *.test.ts
└── test/{contract,security,integration}/
```
Les modules `matches`, `dashboard`, `results`, `licencies`, `venues`, `jobs` sont **ajoutés lot par lot** (ne pas créer de dossiers vides).

## 2. Checklist d'initialisation (à exécuter par le propriétaire, dans l'ordre)
**Dépôt GitHub**
- [ ] Créer le dépôt (privé), branche par défaut `main`, **protection de `main`** : PR obligatoire, vérifications requises (`verify`, `gitleaks`), pas de force-push.
- [ ] Créer la branche `release` (déploiement production, §3), protégée de la même façon.
- [ ] Activer **Secret scanning + Push protection**, alertes Dependabot, `CODEOWNERS`.
- [ ] Ajouter les secrets GitHub **seulement si nécessaire** (la CI n'en a pas besoin : build et tests utilisent des valeurs factices).
**Projet Node**
- [ ] `npm init`, `engines.node >= 24`, `"type": "module"`, scripts `dev | build | start | start:worker | typecheck | lint | test`.
- [ ] Dépendances (**versions à relever le jour J**, ne pas copier de ce document) : `hono`, `@hono/node-server`, `@hono/zod-openapi`, `zod`, `kysely`, `pg`, `pino` ; `pg-boss` **seulement** quand Q-015 est tranchée ; dev : `typescript`, `vitest`, `tsx`, `eslint`, `kysely-codegen`.
- [ ] `src/config/env.ts` (Zod, échoue au démarrage si variable manquante) ; `GET /health` (sans secret) et `GET /ready` (BDD) ; **enveloppe d'erreur** `{ "error": { "code", "message", "details"? } }` (`errors.ts:3-58` du front) ; **auth par défaut** sur toute route (liste blanche explicite des routes publiques) ; CORS en liste blanche ; **refus de `?token=`** (`400 TOKEN_IN_QUERY`).
- [ ] `Dockerfile` : build en 2 étapes, `USER node`, `HEALTHCHECK` sur `/health`, pas de `railway.json`.
- [ ] Test **« routes publiques = liste blanche »** et test **« aucun log ne contient la query string »** dès le premier commit.
**Premier commit** : squelette + CI verte, **avant** toute logique métier.

## 3. Checklist Railway (réglages du tableau de bord, voir ADR-007)
- [ ] Projet Railway, environnements `staging` et `production`.
- [ ] **Région co-localisée avec le projet Supabase** (noter les deux régions dans `ops/railway.md`).
- [ ] Services `api` et `worker` : constructeur **Dockerfile**, commande de démarrage (`node dist/server.js` / `node dist/worker.js`), healthcheck `GET /health` (au déploiement seulement).
- [ ] Liaison GitHub : `staging` ← `main` ; `production` ← `release` ; **« Wait for CI » activé** ; déploiement de PR désactivé.
- [ ] Variables **(noms seulement ; aucune valeur dans ce dépôt)** : `DATABASE_URL` (rôle dédié, pooler session), `SUPABASE_URL`, `SUPABASE_JWKS_URL`, `ALLOWED_ORIGINS`, `PERSONAL_TOKEN_HMAC_SECRET`, `CLUB_MANAGER_API_URL`, `CLUB_MANAGER_API_SERVICE_TOKEN`, `EMAIL_API_KEY`, `LOG_LEVEL`, `PORT` (fourni par Railway). Un jeu distinct par environnement.
- [ ] Domaine : fourni par Railway pour `staging` ; domaine propre pour `production` (**TLS à vérifier**, V4).
- [ ] Supervision externe de `GET /ready` + alerte de battement du worker.
**Vérifications obligatoires (résultats à consigner dans `ops/runbook.md` et `10-risques.md`)**
| # | Vérification | Critère | Si échec |
|---|---|---|---|
| **V1** | **Query string dans les journaux Railway (R-014)** : en staging, appeler `GET /health?probe=SENTINELLE-NON-SECRETE`, puis chercher cette valeur dans Observability / HTTP logs et dans les logs applicatifs | valeur **absente** partout | Garantie **non établie** : le nouveau back refuse déjà `?token=` ; ne jamais router de trafic à jeton vers Railway |
| V2 | `pg-boss` derrière le pooler **session** de Supabase (démarrage, migration de schéma, cron, redémarrage) | tout passe | Repli ADR-003 option (c) |
| V3 | Latence aller-retour Railway→Supabase (50 requêtes simples, p50/p95) | consignée ; seuil décidé avec le propriétaire | Changer de région ou option (b) |
| V4 | Domaine propre + TLS automatique | HTTPS valide | Rester sur le domaine Railway |
| V5 | IPv6 sortant (connexion directe à Supabase) | informatif | Rester sur le pooler IPv4 |
| V6 | « Variables scellées » disponibles ? | informatif | Variables classiques + rotation |

## 4. CI du nouveau dépôt (vérifications seulement, **aucun déploiement automatique**)
Même base que `.github/workflows/ci.yml` du front (validé : run `37612678201`) :
- `verify` : `npm ci`, `typecheck`, `lint`, `test`, `build`, `npm audit --omit=dev --audit-level=high`.
- **`gitleaks`** : binaire épinglé avec somme de contrôle, `--log-opts="--all"`, `--redact=100`, `fetch-depth: 0`.
- **`docker`** : `docker build` de l'image (sans publication), puis `hadolint` sur le `Dockerfile` (optionnel).
- Déclencheurs : `push`, `pull_request` et un cron hebdomadaire (comme le front). C'est ce workflow que « Wait for CI » attend côté Railway.
- Actions épinglées par tag majeur au départ ; **épinglage par SHA** recommandé (chaîne d'approvisionnement), non fait dans le front.

## 5. Plan de livraison — **LOT-02 en premier** (R-013, révision obligatoire à la livraison)
Ordre strict, **tests d'abord** :
1. **Contrat** : figer `GET /v1/public/clubs/{clubSlug}/licencies/search?q=&limit=` (`04` B.1) dans OpenAPI ; écrire les tests de contrat **avant** le code : `q` < 2 → `400 QUERY_TOO_SHORT` ; au plus 8 résultats ; aucun total ; `[]` et non 404 pour 0 résultat ; club inconnu → 404 à délai constant ; `429 RATE_LIMITED` + `Retry-After`.
2. **Accès aux données** : rôle Postgres **lecture seule** sur la seule table des licenciés (et colonnes nécessaires : id, prénom, nom, état « lien déjà demandé ») ; normalisation (minuscules, sans accents) ; `LIMIT` ≤ 8 dans la requête ; aucune pagination exposée.
3. **Anti-énumération** : limitation de débit par IP **et** par club (valeurs initiales **estimées** : 30 req/min/IP, 300 req/min/club, à calibrer en staging) ; compteurs en mémoire (un seul réplica ; à documenter si plusieurs) ; journaux sans `q` ni noms.
4. **Staging** : déploiement, vérifications V1 à V3, test de charge léger, **revue sécurité** (matrice, tentative d'énumération par lettres : 26² requêtes doivent être bloquées par la limite de débit avant d'extraire le roster).
5. **Front (PR dans SCSB, séparée)** : `resolveBase(path)` dans `src/lib/api/client.ts` + liste de modules actifs ; `IdentifyView.tsx` interroge le serveur avec anti-rebond (≈ 300 ms), supprime le chargement complet (`IdentifyView.tsx:66-87`) et le filtre local ; **tests de composant** avec jsdom + Testing Library (Q-009 accepté, devDependencies seulement) ; drapeau `FF_PUBLIC_SEARCH`, défaut = ancien comportement.
6. **Bascule** : activer le drapeau en staging puis en production ; **fermer l'ancien endpoint** `GET …/licencies` (`410`) — **changement à faire côté `club-manager-api` par le propriétaire** (l'agent n'y a pas accès) ; sans cela **R-013 reste ouvert**.
7. **Clôture** : mesure avant/après du payload (`08`), mise à jour de `04`/`CHANGELOG`/`10` (R-013 → fermé, ou renouvelé explicitement), commit atomique.
**Critères de done** : un anonyme ne peut plus obtenir plus de 8 noms par requête ; l'extraction du roster par lettres est bloquée ; ancien endpoint fermé ; aucun nom dans les logs ; CI verte ; V1 consignée.
**Rollback** : drapeau `FF_PUBLIC_SEARCH` à l'ancien comportement (redéploiement du front en option (a)) ; l'ancien endpoint n'est fermé qu'**après** une période d'observation (≥ 7 jours, estimé).
**Jeton en en-tête (R-014)** : le LOT-02 est **anonyme** et ne manipule aucun jeton. Le transport du jeton personnel par en-tête (`04` B.9, ADR-006) concerne les routes qui suivent (`request-link`, accueil, tables, dérogations) : il est livré avec **LOT-14** ; en attendant, ces routes restent chez `club-manager-api`.

## 6. Ce que le front devra préparer (hors LOT-02, rappel)
`resolveBase` testé (chaque préfixe porté a un test), `NEXT_PUBLIC_NEW_API_URL` + liste de modules (non secrets), CSP/`connect-src` vers le nouveau domaine (LOT-14), erreurs `429`/`400 QUERY_TOO_SHORT` gérées dans l'UI.

## 7. Question ouverte sur la consigne « annuaire public authentifié » (Q-018)
Le propriétaire demande un LOT-02 « annuaire public **authentifié** ». Or le parcours visé est l'**identification de personnes sans compte** (`IdentifyView.tsx` : taper son nom pour recevoir son lien par e-mail) : exiger un compte Supabase ou un jeton personnel **avant** de chercher casserait ce parcours (le jeton est justement ce que la personne n'a pas encore). Options à trancher :
| Option | Principe | Effet |
|---|---|---|
| 1 (conception actuelle, `04` B.1) | Recherche **anonyme mais bornée** (≥ 2 caractères, ≤ 8 résultats, pas de total, limite de débit) | Ferme l'énumération ; parcours inchangé |
| 2 | Option 1 **+ code d'accès du club** (secret partagé aux membres, envoyé en en-tête `X-Club-Access-Code`) | Un inconnu qui n'a pas le code ne peut rien chercher ; **nouvelle donnée à distribuer/rotater** ; le code circule comme un mot de passe partagé |
| 3 | Authentification forte (compte Supabase ou jeton) | **Incompatible** avec l'usage sans compte (bénévoles) |
**Recommandation : option 1 maintenant, option 2 si le propriétaire veut une barrière supplémentaire** (le contrat prévoit déjà un en-tête optionnel). À confirmer avant l'étape 1 du §5.
