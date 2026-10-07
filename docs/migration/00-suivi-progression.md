# Suivi de progression

**Dernière mise à jour** : 2026-10-07 — **Phase en cours** : 2 → mesures conservatoires et lots front-seul (en attente de validation 🛑) — **Avancement global** : 40 %

## Phases
| Phase | Intitulé                         | Statut        | Validée le |
|-------|----------------------------------|---------------|------------|
| 0     | Initialisation                   | ✅ Terminé    | 2026-10-07 |
| 1     | Cartographie                     | ✅ Terminé    | 2026-10-07 |
| 2     | Inventaire & priorisation        | 🔵 En revue   |            |
| 3     | Conception stack back            | ⬜ À faire    |            |
| 4     | Migration par lots               | ⬜ À faire    |            |
| 5     | Nettoyage front & optimisation   | ⬜ À faire    |            |
| 6     | Recette finale & bilan           | ⬜ À faire    |            |

## Lots de migration
| ID     | Traitement | Fichiers front concernés | Endpoint cible | Priorité | Statut | Test | PR/commit |
|--------|------------|--------------------------|----------------|----------|--------|------|-----------|
| LOT-00 | Vulnérabilités de prod (next critique, sharp, source-map-js) | package.json, package-lock.json | — | P1 | ✅ | ✅ (baseline) | `0121eed` |
| LOT-01 | TRT-002 Auth : jeton mémoïsé + getClaims | auth.server.ts, session.ts, proxy.ts | — (front seul) | P1 | ✅ | ✅ 5 tests (`auth-calls`) + 4 (`proxy`) | `a4c2580` |
| LOT-02 | TRT-001 Roster public → recherche serveur | IdentifyView.tsx, publicTables.ts | `GET /v1/public/clubs/:slug/licencies?q=` (à confirmer) | P1 | ⛔ nouveau back | ⬜ | |
| LOT-03 | TRT-003 Gymnases dynamiques | HomeMatchesAgenda.tsx | `GET /v1/clubs/:id/venues` (existant) (à confirmer) | P1 | ⛔ nouveau back | ⬜ | |
| LOT-04 | TRT-011 Réglages club via API | club-settings.ts | `PATCH /v1/clubs/:id/settings` (à confirmer) | P2 | ⛔ nouveau back, D-1 | ⬜ | |
| LOT-05 | TRT-007, 008 Saison & journée serveur | season.ts, timezone.ts, match-filters.ts | `season=current`, `weekendKey` (à confirmer) | P2 | ⛔ nouveau back, D-2 | ⬜ | |
| LOT-06 | TRT-006 Matchs filtres/pagination serveur | match-filters.ts, MatchesView.tsx | `GET …/matches?when=&side=…` (à confirmer) | P2 | ⛔ LOT-05 | ⬜ | |
| LOT-07 | TRT-005 Tableau de bord BFF | dashboard/page.tsx | `GET /v1/clubs/:id/dashboard` (à confirmer) | P1 | ⛔ LOT-01, 05 | ⬜ | |
| LOT-08 | TRT-009 Résultats serveur | result-groups.ts | `GET …/results` (à confirmer) | P2 | ⛔ LOT-05 | ⬜ | |
| LOT-09 | TRT-010 Import licenciés serveur | ImportLicenciesPanel.tsx | `POST …/licencies/import {text}` (à confirmer) | P2 | ⛔ nouveau back | ⬜ | |
| LOT-10 | TRT-004 Opérations longues → jobs | lib/api/integrations.ts, … | `202 + jobId` (à confirmer) | P1→P2 | ⛔ nouveau back | ⬜ | |
| LOT-11 | CI minimale | (nouveau workflow) | — | P2 | ✅ (workflow validé, 1ᵉʳ run réel après push) | ✅ actionlint + gitleaks local | voir `git log` |
| LOT-14 | En-têtes de sécurité (CSP) + jeton public (R-008) | next.config.ts, publicToken.ts | — | P2 | ⬜ à planifier | ⬜ | |
| LOT-12 | TRT-012 à 015 petites listes | divers | divers | P3 | ⛔ | ⬜ | |
| LOT-13 | Nettoyage worker/ + config morte | worker/, next.config.ts | — | P3 | ⬜ Phase 5 | ⬜ | |

## Mesures conservatoires
| Mesure | Statut | Commit |
|--------|--------|--------|
| D-1 validation serveur du fuseau (TRT-011) | ✅ | `cb085e1` |
| TRT-001 annuaire public | ⏳ **en attente de D-3 (A ou B)** — aucune mesure appliquée | — |

## Prochaines actions
- [ ] Trancher D-3 (A : flag off / B : risque accepté signé) — **seule tâche restante de ce lot de demandes**
- [ ] Répondre à Q-001 (accès au back) → débloque Phase 3 et 9 lots
- [ ] Pousser la branche pour obtenir le premier run CI réel (action sortante, non faite) ; vérifier Q-008 (JWKS) et la durée de vie du JWT
- [ ] Lots encore faisables sans back : **LOT-13** (nettoyage, prévu Phase 5) et **LOT-14** (CSP, après lecture des docs Next) — aucun autre

## Bloquants
- Q-001 : code de `club-manager-api` non accessible → 9 lots bloqués (R-012), Phase 3 impossible.
- D-3 : TRT-001 non traité.
