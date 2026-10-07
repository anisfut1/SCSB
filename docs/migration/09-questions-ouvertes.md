# 09 — Questions ouvertes
| ID | Question / décision | Statut |
|----|---------------------|--------|
| Q-001 | Accès au code de `club-manager-api` (chemin local, droit de modification). Non renseigné dans la validation Phase 0 ; aucun dossier `../club-manager-api` constaté. Traité comme « pas d'accès pour l'instant ». | ⏳ Ouverte — bloque Phase 3/4 côté back |
| Q-002 | `club-manager-api` est le back cible. Phase 3 = analyse d'écart (besoins Phase 2 vs endpoints existants) puis extension de l'existant. Tout changement de stack exige un ADR fondé sur des mesures. | ✅ Résolue 2026-10-07 |
| Q-003 | Vulnérabilités de production dans le périmètre : LOT-00 sécurité, P1. Vulnérabilités de dev : consignées seulement. | ✅ Résolue 2026-10-07 |
| Q-004 | `worker/` : périmètre complet. `spikes/` : décrit en cartographie, exclu de l'inventaire. `.vscode/` : hors périmètre. | ✅ Résolue 2026-10-07 |
| Q-005 | `worker/` (Playwright + service role) est déclaré OBSOLÈTE par `docs/FBI_WORKER.md:3-13` mais toujours présent et suivi. Supprimer en Phase 5 (lot nettoyage), ou conserver ? | ✅ Résolue 2026-10-07 : oui, `worker/` sera supprimé en Phase 5 après vérification qu'aucun script/déploiement/doc active ne le référence ; la config morte de `next.config.ts` suit le même traitement. || ✅ Résolue 2026-10-07 : oui, suppression en Phase 5 après vérification qu'aucun script/déploiement/doc active ne le référence ; la config morte de `next.config.ts` suit. |
| Q-006 | Faut-il auditer l'historique git (`git log -p`) à la recherche de secrets déjà commités (service_role, `.env`) ? Non fait en Phase 1 (hors consigne). | ✅ Résolue 2026-10-07 : audit fait, aucun secret (voir `10-risques.md`). |
| Q-007 | CI/CD : où tournent build/tests (Vercel seul ?) — aucun fichier versionné. Utile pour les critères « done » des lots. | ⏳ Non renseignée à ce jour ; le lot « CI minimale » (P2) est ajouté au plan quand même. |

| Q-008 | Le projet Supabase utilise-t-il des clés de signature JWT **asymétriques** (JWKS) ? Conditionne `getClaims()` local (LOT-01 étape 4, TRT-002). Sinon `getClaims()` fait un appel réseau et on s'en tient à la mémoïsation. | ⏳ |
| D-1 | Réglages du club (`club-settings.ts:34`) : garder l'écriture directe ou migrer vers l'API ? **Recommandation : migrer** (LOT-04) — dernier accès BDD direct + fuseau non validé (TRT-011). | ⏳ Décision attendue |
| D-2 | Fuseau des « journées » et des horaires : toujours `Europe/Paris` (comme `match-display.tsx:6-15`) ou `club.timezone` (comme les Tables) ? Aujourd'hui les deux coexistent (TRT-008). | ⏳ Décision attendue |
| Q-009 | Tests de composants (parcours d'identification publique, LOT-02) : accepter d'ajouter un environnement DOM (jsdom/happy-dom + Testing Library) à Vitest ? Aujourd'hui env `node` seulement (`vitest.config.mts`). | ⏳ |
| Q-010 | Volumétrie réelle (matchs/saison, licenciés/club, nb de clubs) et latence Supabase Auth observée : nécessaires pour chiffrer les gains (`08-metriques.md`). Les chiffres de `02` sont des estimations. | ⏳ |
