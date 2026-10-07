# 03 — Plan de migration
_Lots de la Phase 2 à définir ; ordre : sécurité d'abord, puis ratio gain/effort._

## LOT-00 — Sécurité : vulnérabilités de dépendances de production (P1)
- **Objectif** : corriger les vulnérabilités `npm audit --omit=dev` (1 critique, 2 hautes) — détail en `01-cartographie-repo.md`.
- **Périmètre** : `package.json`, `package-lock.json` (+ `worker/` si concerné). Vulnérabilités de dev : consignées seulement.
- **Tests** : typecheck, lint, vitest, build identiques à la baseline (`07-tests-et-qualite.md`).
- **Critères de done** : `npm audit --omit=dev` sans critique/haute, ou exceptions justifiées en ADR.
- **Bascule / rollback** : commit unique, `git revert`.
- **Réalisé (2026-10-07)** : `next` 16.3.5 → 16.3.6 (exception autorisée à la règle 1), `eslint-config-next` aligné, `npm audit fix` sans `--force`. Résultats : `07-tests-et-qualite.md`.
- **Rollback** : `git revert <commit LOT-00>` puis `npm ci` (le lockfile revient à 16.3.5/sharp 0.35.4/source-map-js 1.2.1). Aucun changement de code applicatif à défaire.
- **Statut** : ✅ Terminé
