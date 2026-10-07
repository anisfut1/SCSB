# Suivi de progression

**Dernière mise à jour** : 2026-10-07 — **Phase en cours** : 4 (LOT-04 ✅, LOT-06 ✅ flag, R-015 ✅, LOT-14/CSP ✅ Report-Only ; **LOT-02 spécifié, non démarré**) — **Avancement global** : 62 %

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
| LOT-02 | TRT-001 Roster public → recherche serveur | IdentifyView.tsx, publicTables.ts | `GET /v1/public/clubs/:slug/licencies?q=` (à confirmer) | P1 | 📝 spécifié (`04` B.1 v2, `11` §7) — attend le repo du back et Q-020 | ⬜ | |
| LOT-03 | TRT-003 Gymnases dynamiques | HomeMatchesAgenda.tsx | `GET /v1/clubs/:id/venues` (existant) (à confirmer) | P1 | ⛔ nouveau back | ⬜ | |
| LOT-04 | TRT-011 Réglages club via API | club-settings.ts | `PATCH /v1/clubs/{id}` **existant** (04 E-2) | P2 | ✅ | ✅ 9 tests | voir `git log` |
| LOT-05 | TRT-007, 008 Saison & journée serveur | season.ts, timezone.ts, match-filters.ts | `season=current`, `weekendKey` (à confirmer) | P2 | ⛔ nouveau back, D-2 | ⬜ | |
| LOT-06 | TRT-006 Matchs filtres serveur | match-filters.ts, MatchesView.tsx | `GET …/matches?period=&teamId=&homeAway=` **existant** (04 E-3) + `/matches/weekends` nouveau | P2 | ✅ derrière flag (défaut off) | ✅ 22 tests | voir `git log` |
| LOT-07 | TRT-005 Tableau de bord BFF | dashboard/page.tsx | `GET /v1/clubs/:id/dashboard` (à confirmer) | P1 | ⛔ LOT-01, 05 | ⬜ | |
| LOT-08 | TRT-009 Résultats serveur | result-groups.ts | `GET …/results` (à confirmer) | P2 | ⛔ LOT-05 | ⬜ | |
| LOT-09 | TRT-010 Import licenciés serveur | ImportLicenciesPanel.tsx | `POST …/licencies/import {text}` (à confirmer) | P2 | ⛔ nouveau back | ⬜ | |
| LOT-10 | TRT-004 Opérations longues → jobs | lib/api/integrations.ts, … | `202 + jobId` (à confirmer) | P1→P2 | ⛔ nouveau back | ⬜ | |
| LOT-11 | CI minimale | (nouveau workflow) | — | P2 | ✅ (workflow validé, 1ᵉʳ run réel après push) | ✅ actionlint + gitleaks local | voir `git log` |
| LOT-14 | En-têtes de sécurité : CSP **Report-Only** ✅ ; jeton public R-008 ⬜ | next.config.ts, security-headers.ts (publicToken.ts : reste) | — | P2 | 🟡 CSP livrée | ✅ 13 tests | `78ed617` |
| R-015 | Pagination de la vue publique des matchs | publicMatches.ts | — (existant) | P2 | ✅ | ✅ 8 tests | `1595e53` |
| LOT-12 | TRT-012 à 015 petites listes | divers | divers | P3 | ⛔ | ⬜ | |
| LOT-13 | Nettoyage worker/ + config morte | worker/, next.config.ts | — | P3 | ⬜ Phase 5 | ⬜ | |

## Mesures conservatoires
| Mesure | Statut | Commit |
|--------|--------|--------|
| D-1 validation serveur du fuseau (TRT-011) | ✅ | `cb085e1` |
| TRT-001 annuaire public | **R-013 accepté** (D-3 = B). **L'acceptation expire à la livraison du LOT-02** ; elle ne se referme que si l'ancien endpoint est fermé (critère vérifiable, `11` §7.7 — action du propriétaire) | `2f35699` |
| R-015 troncature de la vue publique | ✅ corrigé côté front (reste à vérifier la sémantique de l'API, Q-014 T6) | `1595e53` |
| R-014 jeton en query string | **non traité** ; confirmé côté Vercel (« Search Params » journalisés) ; mitigations en `ADR-005/007` | — |

## CI
Runs : `37612678201` ✅, `37618494863` ✅ ; run du dernier push : voir `07-tests-et-qualite.md`.

## Décisions prises (2026-10-07)
Q-015 (Supabase conservé pendant S3, réévaluation obligatoire en fin de S3), Q-016 (routage client par module, ADR-005 Acceptée), Q-017 (**front sur Vercel**, VPS supprimé de la documentation), Q-018 (recherche anonyme bornée).

## Prochaines actions
- [ ] **Valider au 🛑** : règles chiffrées du LOT-02 (Q-020, `11` §7) ; décisions CSP (Q-021, `12` §4)
- [ ] **Propriétaire** : créer le repo du back et donner l'URL ; région du projet Supabase ; JWKS + durée de vie du JWT ; sorties des essais Q-014 (`09`)
- [ ] **Propriétaire** : fermer l'ancien endpoint `GET …/licencies` dans `club-manager-api` **après** la bascule du front (critère `11` §7.7) ; décider du sort de R-018 (revendication de fiche sans adresse)
- [ ] Relever la liste des hôtes de logos via la console (`12` §3) pour trancher la décision 1
- [ ] Ensuite : LOT-02 dans le nouveau repo (tests de contrat d'abord, `11` §7.5)

## Bloquants
- Repo du back (propriétaire) pour démarrer le LOT-02 ; validation de Q-020.
- Aucun bloquant côté front pour les lots en cours.
