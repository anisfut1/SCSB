# Migration Front → Back (SCSB)

**Objectif** : le front (Next.js) se limite à affichage, état d'UI, interactions, validation de confort. Logique métier, calculs, secrets et agrégations vivent dans le back.

**État global** : voir [00-suivi-progression.md](00-suivi-progression.md) (Phase 0 terminée, en attente de validation).

**Reprendre** : lire ce fichier, puis `00-suivi-progression.md`, résumer en 5 lignes, proposer la prochaine action.

**Branche de travail** : `refactor/migration-back` (issue de `claude/sete-basket-app-architecture-c3hlxx`). **Branche d'intégration de la migration (docs)** : `integration/back-fastapi` (créée le 2026-10-08, voir ci-dessous).

## Contexte découvert en Phase 0
- Le front a **déjà** été migré une première fois de Supabase direct vers un back externe `club-manager-api` (voir [../MIGRATION_TO_API.md](../MIGRATION_TO_API.md)). Ce chantier est donc une **seconde passe** : traitements restants côté front.
- Le back `club-manager-api` (GitHub `anisfut1/club-manager-api`) n'est **pas** présent localement. `../captain-sugar-back` (Python/FastAPI) est un projet sans rapport (app diabète). Voir [09-questions-ouvertes.md](09-questions-ouvertes.md).

## Sommaire
- 06-adr
- 11-init-repo-back.md

## Invariant production
**Le front est en production et continue d'évoluer.** Aucun service front n'est débranché avant que son remplaçant soit en service et vérifié côté back ; tous les drapeaux sont désactivés par défaut ; rien n'est fusionné dans la branche par défaut sans accord du propriétaire. Détail et ordre de bascule : [03-plan-migration.md](03-plan-migration.md), section « Invariant production ».

## Branche d'intégration et synchronisation
- `claude/sete-basket-app-architecture-c3hlxx` = branche par défaut, **production**. `integration/back-fastapi` = documentation et préparation de la migration (aujourd'hui `docs/` seulement) ; elle n'est jamais déployée.
- **Synchroniser l'intégration avec la production** (à faire à chaque nouveau commit de la branche par défaut, et avant toute PR) :
  ```bash
  git fetch origin
  git checkout integration/back-fastapi
  git merge --no-ff origin/claude/sete-basket-app-architecture-c3hlxx
  git diff --stat origin/claude/sete-basket-app-architecture-c3hlxx...HEAD   # doit rester dans docs/
  ```
  Un conflit sur `src/lib/api/` ou `src/features/public/` signifie que la production a évolué sous les pistes de bascule : **s'arrêter** et réévaluer le lot concerné avant de résoudre.
- **Correctifs de production** (sécurité, hotfix) : branche issue de la branche par défaut, PR vers elle, puis synchronisation de l'intégration ci-dessus. Ne jamais partir de l'intégration.
- Les branches de travail de documentation (`docs/adr-fastapi`) sont fusionnées dans l'intégration sans fast-forward.
