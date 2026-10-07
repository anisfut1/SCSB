# 03 — Plan de migration
_Lots de la Phase 2 à définir ; ordre : sécurité d'abord, puis ratio gain/effort._

## LOT-00 — Sécurité : vulnérabilités de dépendances de production (P1)
- **Objectif** : corriger les vulnérabilités `npm audit --omit=dev` (1 critique, 2 hautes) — détail en `01-cartographie-repo.md`.
- **Périmètre** : `package.json`, `package-lock.json` (+ `worker/` si concerné). Vulnérabilités de dev : consignées seulement.
- **Tests** : typecheck, lint, vitest, build identiques à la baseline (`07-tests-et-qualite.md`).
- **Critères de done** : `npm audit --omit=dev` sans critique/haute, ou exceptions justifiées en ADR.
- **Bascule / rollback** : commit unique, `git revert`.
- **Statut** : ⬜ À faire (analyse en Phase 1)
