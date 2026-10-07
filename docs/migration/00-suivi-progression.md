# Suivi de progression

**Dernière mise à jour** : 2026-10-07 — **Phase en cours** : 1 (en attente de validation 🛑) — **Avancement global** : 15 %

## Phases
| Phase | Intitulé                         | Statut        | Validée le |
|-------|----------------------------------|---------------|------------|
| 0     | Initialisation                   | ✅ Terminé    | 2026-10-07 |
| 1     | Cartographie                     | 🔵 En revue   |            |
| 2     | Inventaire & priorisation        | ⬜ À faire    |            |
| 3     | Conception stack back            | ⬜ À faire    |            |
| 4     | Migration par lots               | ⬜ À faire    |            |
| 5     | Nettoyage front & optimisation   | ⬜ À faire    |            |
| 6     | Recette finale & bilan           | ⬜ À faire    |            |

## Lots de migration
| ID     | Traitement | Fichiers front concernés | Endpoint cible | Priorité | Statut | Test | PR/commit |
|--------|------------|--------------------------|----------------|----------|--------|------|-----------|
| LOT-00 | Vulnérabilités de prod (next critique, sharp, source-map-js) | package.json, package-lock.json | — | P1 | ⬜ | ⬜ | |
| _autres lots_ | _définis en Phase 2_ | | | | | | |

## Prochaines actions
- [ ] Validation de la Phase 1 par le propriétaire
- [ ] Répondre à Q-001 (accès au back), Q-005, Q-006, Q-007
- [ ] Phase 2 : inventaire des traitements front (pistes en §4 de `01-cartographie-repo.md`) et plan de lots

## Bloquants
- Q-001 : code de `club-manager-api` non accessible. La Phase 1 est faite côté front uniquement ; cela bloquera les Phases 3/4 (extension du back).
