## 2026-10-07
- [Phase 0] Branche `refactor/migration-back` créée — baseline : install/typecheck/lint/tests/build OK, 8 vulnérabilités npm — fichiers : `docs/migration/*` — lien doc : `07-tests-et-qualite.md`
- [Phase 0] Création de l'arborescence de documentation et des squelettes
- [Phase 0] Décisions Q-002, Q-003, Q-004 consignées (résolues) ; Q-001 laissée ouverte (non renseignée) — fichiers : `09-questions-ouvertes.md`
- [Phase 0] LOT-00 sécurité ajouté au plan ; Phase 3 recadrée en analyse d'écart — fichiers : `03-plan-migration.md`, `05-architecture-cible.md`
- [Phase 0] Commit `675fef8` docs(migration): phase 0 initialisation
- [Phase 1] Cartographie complète : stack, dépendances, 3 vulnérabilités de prod détaillées (LOT-00), 3 variables NEXT_PUBLIC_* vérifiées (aucun secret), flux Mermaid, config morte, `worker/` obsolète — fichiers : `01-cartographie-repo.md`, `09`, `10`, `00` — lien doc : `01-cartographie-repo.md`

## 2026-10-07 (suite)
- [Phase 1] Commit `b933d0e` docs(migration): phase 1 cartographie
- [LOT-00] next 16.3.6, eslint-config-next 16.3.6, sharp 0.35.5, source-map-js 1.2.2 ; audit prod 3 → 0 ; baseline verte (109 tests) — fichiers : `package.json`, `package-lock.json` — lien doc : `07-tests-et-qualite.md`
- [LOT-00] Commit `0121eed` fix(security): LOT-00 bump next 16.3.6
- [Phase 2] Audit d'historique git (Q-006) : aucun secret ; Q-005 et Q-006 résolues ; Q-001 et Q-007 toujours ouvertes — fichiers : `10-risques.md`, `09-questions-ouvertes.md`
- [Phase 2] Inventaire (15 TRT) + plan de 14 lots (LOT-00 à LOT-13), 5 P1 ; Q-008, Q-009, Q-010, D-1, D-2 ouvertes ; R-008 à R-012 — fichiers : `02`, `03`, `00`, `08`, `09`, `10` — lien doc : `02-inventaire-traitements.md`
