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

## 2026-10-07 (suite 2)
- [D-1] Validation serveur du fuseau (`isValidTimezone`) dans `club-settings.ts`, 6 tests — commit `cb085e1` — lien doc : `02` TRT-011
- [LOT-01] Auth : résolution unique par requête (`getServerAuth` + `cache()`), `getClaims()` dans proxy et rendu ; 9 → ≤ 2 appels ; tests `auth-calls.test.ts`, `proxy.test.ts` — fichiers : `auth.server.ts`, `session.ts`, `platform.ts`, `proxy.ts` — lien doc : `06-adr/ADR-001-auth-une-resolution-par-requete.md`, `08-metriques.md`
- [LOT-11] `.github/workflows/ci.yml` (verify + audit prod + gitleaks) validé actionlint ; gitleaks v8.30.1 local : 103 commits, aucune fuite — fichiers : `.github/workflows/ci.yml` — lien doc : `10-risques.md`, `07-tests-et-qualite.md`
- [Plan] LOT-14 (CSP / jeton public, P2) ajouté, non implémenté ; D-3 laissée ouverte (TRT-001 : aucune mesure) ; Q-008 non vérifiable (URL projet absente) — fichiers : `03`, `09`, `10`

## 2026-10-07 (suite 3)
- [Décisions] D-3 = option B (R-013 accepté, révision au plus tard à la livraison du LOT-02 / prochain 🛑 de Phase 4) ; Q-001 résolue autrement (nouveau back) ; Q-002 rouverte ; Q-007 = VPS ; LOT-02 en tête de Phase 4 ; Q-011 à Q-013 ouvertes — fichiers : `09`, `10`, `03`, `00` — lien doc : `10-risques.md`
