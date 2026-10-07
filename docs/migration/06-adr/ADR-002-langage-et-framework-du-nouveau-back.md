# ADR-002 — Langage et framework du nouveau back
- **Date** : 2026-10-07 ; **révisée le 2026-10-08** (décision du propriétaire : Python + FastAPI)
- **Statut** : **Acceptée (révision 2026-10-08)** — remplace la proposition TypeScript + Hono. Le back est réécrit de zéro dans `ball-manager-back` (`rmess/ball-manager-back`).
- **Historique** : la première version (Hono, Node 24, `@hono/zod-openapi`) est conservée en fin de document pour mémoire.

## Contexte (besoins de la Phase 2, inchangés)
- API REST JSON : ~92 opérations déjà consommées + ~10 nouvelles ; enveloppe d'erreur `{error:{code,message,details?}}` (`errors.ts:3-58`) et OpenAPI à conserver : le front **génère ses types depuis l'OpenAPI** (`scripts/generate-api-types.ts`, `src/lib/api/generated/schema.ts`).
- Agrégations de lecture (TRT-005/009), recherche publique bornée (TRT-001), revendication soumise à validation (R-018), jobs longs (TRT-004), e-mails.
- Déploiement Railway (ADR-007), charge faible (Q-010, estimée) : la vitesse brute du langage n'est pas le critère.
- Le front reste en TypeScript ; le partage de code front/back n'existe pas aujourd'hui (le contrat passe déjà par OpenAPI).

## Options étudiées
| Critère | A. TypeScript + Hono (proposition d'origine) | **B. Python + FastAPI + Pydantic v2** | C. Python + Litestar | D. Go |
|---|---|---|---|---|
| Choix du propriétaire | non retenu | **retenu** | — | — |
| OpenAPI généré depuis les modèles de validation | ✅ (Zod) | ✅ (Pydantic, natif FastAPI) | ✅ | ⚠ outillage tiers |
| Partage de types avec le front | natif | via OpenAPI seulement — **déjà le cas aujourd'hui** | idem B | idem B |
| Écosystème pour la file de jobs sur Postgres | `pg-boss` | **Procrastinate** (ADR-004) | idem B | — |
| Pipelines OCR/PDF éventuels (hors périmètre, Q-011) | JS | **meilleur écosystème** | idem B | ⚠ |
| Communauté / documentation | grande | **très grande** | plus petite | grande |
| Coût d'une réécriture | nul (rien n'existe) | nul (rien n'existe : repo back vide) | nul | nul |
Le facteur décisif est la décision du propriétaire ; l'analyse n'identifie aucun obstacle bloquant à FastAPI. **Litestar** n'est pas retenu : mêmes capacités pour ce besoin, écosystème et références plus réduits (jugement, non mesuré).

## Décision
1. **Python + FastAPI**, **Pydantic v2**, serveur ASGI **uvicorn** (processus unique par service ; pas de gunicorn tant que la charge reste faible).
2. **Version de Python : 3.13** (épinglée dans `.python-version` et dans l'image). **Non vérifié** : compatibilité de chaque dépendance avec 3.14 ; à contrôler le jour de l'initialisation avant de monter de version.
3. **Gestionnaire de dépendances : `uv`** (disponible sur le poste du propriétaire : 0.11.30) — `pyproject.toml` + `uv.lock` versionné, `uv sync --frozen` en CI et dans l'image. Alternative écartée : Poetry (plus lent, deux outils pour le même besoin ici).
4. **Qualité** : `ruff` (lint + format), **`mypy --strict`** avec le plugin Pydantic (pur Python, pas de dépendance à Node en CI ; `pyright` écarté pour cette raison), `pytest` + `pytest-asyncio` + `httpx` (client de test ASGI) ; couverture de branches mesurée mais sans seuil global au départ.
5. **Contrat OpenAPI → client typé du front** : FastAPI expose `/openapi.json` ; le back **exporte** le schéma dans `docs/openapi.json` via un script (`python -m app.scripts.export_openapi`) et la CI **échoue si le fichier versionné diffère du schéma généré** (garde-fou contre la dérive). Côté front, `scripts/generate-api-types.ts` accepte **plusieurs sources** (schéma de `club-manager-api` + `openapi.json` du nouveau back) et produit `src/lib/api/generated/` ; un module porté (`ported-routes.json`, ADR-005) lit ses types depuis le schéma du back. Règle : **le front ne copie jamais un schéma à la main** ; toute modification de contrat passe par une PR back (schéma régénéré) puis une PR front (types régénérés). La génération FastAPI utilise des `operationId` explicites (sinon les noms dérivés des chemins sont instables).
6. **Enveloppe d'erreur** : gestionnaires d'exceptions FastAPI qui produisent `{error:{code,message,details?}}` pour **toutes** les erreurs, y compris la validation Pydantic (`422` natif de FastAPI remplacé par `400 VALIDATION_ERROR` pour rester compatible avec le front, `04` §A.1) — test de contrat dédié.
7. **Mapping de noms** : le contrat public reste en `camelCase` (`firstName`) : modèles Pydantic avec `alias_generator=to_camel` et `populate_by_name=True`, réponses sérialisées `by_alias=True` (test de contrat qui compare les clés à l'OpenAPI).

## Conséquences
- (+) Une seule source de vérité du contrat (les modèles Pydantic) ; OpenAPI toujours à jour ; écosystème de jobs et de tests mûr.
- (+) Aucun code existant à migrer côté back : le coût de changement de langage est nul.
- (−) Plus de types partagés « natifs » avec le front : on dépend de la qualité de l'OpenAPI et de la CI de non-dérive (point 5).
- (−) Deux chaînes d'outils dans l'organisation (npm côté front, uv côté back) ; deux comptes GitHub (voir `09`, Q-026).
- À surveiller : la sérialisation `camelCase` (oubli de `by_alias`), les `operationId` stables, la taille de l'image Python (≈ 150-250 Mo, estimée, non mesurée).

---
## Annexe — version d'origine (2026-10-07), remplacée
Option A : TypeScript + Hono sur Node 24 (`@hono/zod-openapi`), motifs : types partagés, continuité probable avec `club-manager-api` (non vérifiée), charge faible. Bascule vers Python prévue « seulement si l'équipe est majoritairement Python » : **condition réalisée par la décision du propriétaire du 2026-10-08**.
