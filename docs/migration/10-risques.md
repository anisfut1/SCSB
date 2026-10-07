# 10 — Risques
| ID | Risque | Proba | Impact | Mitigation |
|----|--------|-------|--------|------------|
| R-001 | Back réel hors de ma portée : impossible d'implémenter les endpoints | Moyenne | Élevé | Lever Q-001 avant Phase 3 |
| R-002 | Chevauchement avec la migration déjà faite (MIGRATION_TO_API.md) | Moyenne | Moyen | S'appuyer dessus en Phase 1 |
| R-003 | Dépendances vulnérables (npm audit) | Haute | Moyen | Analyser en Phase 1 |
| R-004 | Next 16.3.5 : RCE `next/og` (critique) — non exploitable en l'état (aucun usage) mais plage vulnérable | Faible | Élevé | LOT-00 : montée vers 16.3.6+/16.4.0 |
| R-005 | `npm audit fix --force` rétrograderait Next en 14.2.35 (faux « correctif » dev) | Moyenne | Élevé | Ne jamais lancer `--force` ; montée ciblée |
| R-006 | Pas de CI ni test de composants : régression UI non détectée lors des migrations | Moyenne | Moyen | Tests de caractérisation par lot (règle 4) |
| R-007 | Autorisation relue côté Next (`club-context.ts:43-67`) : à confirmer qu'elle est aussi imposée par l'API | Moyenne | Élevé | Vérifier avec le code du back (Q-001) |
