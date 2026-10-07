# 09 — Questions ouvertes
| ID | Question / décision | Statut |
|----|---------------------|--------|
| Q-001 | Accès au code de `club-manager-api` (chemin local, droit de modification). Non renseigné dans la validation Phase 0 ; aucun dossier `../club-manager-api` constaté. Traité comme « pas d'accès pour l'instant ». | ⏳ Ouverte — bloque Phase 3/4 côté back |
| Q-002 | `club-manager-api` est le back cible. Phase 3 = analyse d'écart (besoins Phase 2 vs endpoints existants) puis extension de l'existant. Tout changement de stack exige un ADR fondé sur des mesures. | ✅ Résolue 2026-10-07 |
| Q-003 | Vulnérabilités de production dans le périmètre : LOT-00 sécurité, P1. Vulnérabilités de dev : consignées seulement. | ✅ Résolue 2026-10-07 |
| Q-004 | `worker/` : périmètre complet. `spikes/` : décrit en cartographie, exclu de l'inventaire. `.vscode/` : hors périmètre. | ✅ Résolue 2026-10-07 |
| Q-005 | `worker/` (Playwright + service role) est déclaré OBSOLÈTE par `docs/FBI_WORKER.md:3-13` mais toujours présent et suivi. Supprimer en Phase 5 (lot nettoyage), ou conserver ? | ⏳ |
| Q-006 | Faut-il auditer l'historique git (`git log -p`) à la recherche de secrets déjà commités (service_role, `.env`) ? Non fait en Phase 1 (hors consigne). | ⏳ |
| Q-007 | CI/CD : où tournent build/tests (Vercel seul ?) — aucun fichier versionné. Utile pour les critères « done » des lots. | ⏳ |
