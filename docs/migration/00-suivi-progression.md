# Suivi de progression

**Dernière mise à jour** : 2026-10-07 — **Phase en cours** : 2 (en attente de validation 🛑) — **Avancement global** : 30 %

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
| LOT-01 | TRT-002 Auth : jeton mémoïsé + getClaims | auth.server.ts, session.ts, proxy.ts | — (front seul) | P1 | ⬜ prêt | ⬜ | |
| LOT-02 | TRT-001 Roster public → recherche serveur | IdentifyView.tsx, publicTables.ts | `GET /v1/public/clubs/:slug/licencies?q=` (à confirmer) | P1 | ⛔ Q-001 | ⬜ | |
| LOT-03 | TRT-003 Gymnases dynamiques | HomeMatchesAgenda.tsx | `GET /v1/clubs/:id/venues` (existant) (à confirmer) | P1 | ⛔ Q-001 | ⬜ | |
| LOT-04 | TRT-011 Réglages club via API | club-settings.ts | `PATCH /v1/clubs/:id/settings` (à confirmer) | P2 | ⛔ Q-001, D-1 | ⬜ | |
| LOT-05 | TRT-007, 008 Saison & journée serveur | season.ts, timezone.ts, match-filters.ts | `season=current`, `weekendKey` (à confirmer) | P2 | ⛔ Q-001, D-2 | ⬜ | |
| LOT-06 | TRT-006 Matchs filtres/pagination serveur | match-filters.ts, MatchesView.tsx | `GET …/matches?when=&side=…` (à confirmer) | P2 | ⛔ LOT-05 | ⬜ | |
| LOT-07 | TRT-005 Tableau de bord BFF | dashboard/page.tsx | `GET /v1/clubs/:id/dashboard` (à confirmer) | P1 | ⛔ LOT-01, 05 | ⬜ | |
| LOT-08 | TRT-009 Résultats serveur | result-groups.ts | `GET …/results` (à confirmer) | P2 | ⛔ LOT-05 | ⬜ | |
| LOT-09 | TRT-010 Import licenciés serveur | ImportLicenciesPanel.tsx | `POST …/licencies/import {text}` (à confirmer) | P2 | ⛔ Q-001 | ⬜ | |
| LOT-10 | TRT-004 Opérations longues → jobs | lib/api/integrations.ts, … | `202 + jobId` (à confirmer) | P1→P2 | ⛔ Q-001 | ⬜ | |
| LOT-11 | CI minimale | (nouveau workflow) | — | P2 | ⬜ prêt | ⬜ | |
| LOT-12 | TRT-012 à 015 petites listes | divers | divers | P3 | ⛔ | ⬜ | |
| LOT-13 | Nettoyage worker/ + config morte | worker/, next.config.ts | — | P3 | ⬜ Phase 5 | ⬜ | |

## Prochaines actions
- [ ] Validation de la Phase 2 par le propriétaire (top 10 + plan de lots)
- [ ] Trancher D-1 (réglages club) et D-2 (fuseau) ; répondre à Q-001, Q-007, Q-008, Q-009, Q-010
- [ ] Si accord : démarrer LOT-01 et LOT-11 (front seul) pendant que Q-001 est instruite

## Bloquants
- Q-001 : code de `club-manager-api` non accessible → 9 lots sur 13 bloqués (R-012). Phase 3 (analyse d'écart) impossible sans lire les endpoints existants.
