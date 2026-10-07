# Suivi de progression

**Dernière mise à jour** : 2026-10-07 — **Phase en cours** : 4 (lots front sans nouveau back : LOT-04 ✅, LOT-06 ✅ derrière flag) + révision Railway de la Phase 3 (en attente de validation 🛑) — **Avancement global** : 55 %

## Phases
| Phase | Intitulé                         | Statut        | Validée le |
|-------|----------------------------------|---------------|------------|
| 0     | Initialisation                   | ✅ Terminé    | 2026-10-07 |
| 1     | Cartographie                     | ✅ Terminé    | 2026-10-07 |
| 2     | Inventaire & priorisation        | 🔵 En revue   |            |
| 3     | Conception stack back            | 🔵 En revue (révisée Railway) |            |
| 4     | Migration par lots               | 🟡 En cours (LOT-04, LOT-06 livrés ; LOT-02 en tête dès que le repo existe) |            |
| 5     | Nettoyage front & optimisation   | ⬜ À faire    |            |
| 6     | Recette finale & bilan           | ⬜ À faire    |            |

## Lots de migration
| ID     | Traitement | Fichiers front concernés | Endpoint cible | Priorité | Statut | Test | PR/commit |
|--------|------------|--------------------------|----------------|----------|--------|------|-----------|
| LOT-00 | Vulnérabilités de prod (next critique, sharp, source-map-js) | package.json, package-lock.json | — | P1 | ✅ | ✅ (baseline) | `0121eed` |
| LOT-01 | TRT-002 Auth : jeton mémoïsé + getClaims | auth.server.ts, session.ts, proxy.ts | — (front seul) | P1 | ✅ | ✅ 5 tests (`auth-calls`) + 4 (`proxy`) | `a4c2580` |
| LOT-02 | TRT-001 Roster public → recherche serveur | IdentifyView.tsx, publicTables.ts | `GET /v1/public/clubs/:slug/licencies?q=` (à confirmer) | P1 | ⛔ nouveau back | ⬜ | |
| LOT-03 | TRT-003 Gymnases dynamiques | HomeMatchesAgenda.tsx | `GET /v1/clubs/:id/venues` (existant) (à confirmer) | P1 | ⛔ nouveau back | ⬜ | |
| LOT-04 | TRT-011 Réglages club via API | club-settings.ts | `PATCH /v1/clubs/{id}` **existant** (04 E-2) | P2 | ✅ | ✅ 9 tests | voir `git log` |
| LOT-05 | TRT-007, 008 Saison & journée serveur | season.ts, timezone.ts, match-filters.ts | `season=current`, `weekendKey` (à confirmer) | P2 | ⛔ nouveau back, D-2 | ⬜ | |
| LOT-06 | TRT-006 Matchs filtres serveur | match-filters.ts, MatchesView.tsx | `GET …/matches?period=&teamId=&homeAway=` **existant** (04 E-3) + `/matches/weekends` nouveau | P2 | ✅ derrière flag (défaut off) | ✅ 22 tests | voir `git log` |
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
| TRT-001 annuaire public | **Risque R-013 accepté** (D-3 = B), révision obligatoire à la livraison du LOT-02 ou au prochain 🛑 de Phase 4 | `2f35699` |

## CI
Run `37612678201` ✅ (verify + gitleaks), voir `10-risques.md`.

## Phase 3 — livrables (documentation seule) et révision Railway
`04-contrats-api.md` · `05-architecture-cible.md` (6 diagrammes Mermaid validés) · ADR-002 à 007 : **ADR-005 « Acceptée pour S3 »** (routage = Q-016), **ADR-007 réécrit pour Railway**, ADR-003/004 révisés (Q-015), ADR-002 inchangé · `11-init-repo-back.md` (checklist d'initialisation, **rien exécuté**).

## Prochaines actions
- [ ] Trancher au 🛑 : **Q-015** (base), **Q-016** (routage), **Q-018** (« annuaire authentifié ») ; confirmer **Q-017** (hébergement réel du front)
- [ ] **Q-014** : exécuter la liste d'essais (`09`, section dédiée, copier-coller) puis me renvoyer les sorties (sans jeton ni donnée personnelle)
- [ ] Créer le repository du back (propriétaire) et me donner l'URL ; JWKS Supabase + durée de vie du JWT (Q-008)
- [ ] Activer `FF_MATCHES_SERVER_FILTERS=1` en prévisualisation quand Q-014 est confirmée (LOT-06)
- [ ] Ensuite : LOT-02 en premier (R-013, révision obligatoire à sa livraison ou au prochain 🛑 de Phase 4)

## Bloquants
- Création du repository du back (propriétaire) ; Q-015, Q-016, Q-018 conditionnent le démarrage du LOT-02.
- Aucun bloquant côté front pour LOT-04/LOT-06.
