# 09 — Questions ouvertes
| ID | Question / décision | Statut |
|----|---------------------|--------|
| Q-001 | **Résolue autrement (2026-10-07)** : le back sera un **nouveau repository dédié**, qui n'existe pas encore. Le code de `club-manager-api` n'est plus nécessaire à l'agent. Les Phases 3 et 4 ne dépendent plus de son accès mais de la conception du nouveau back. Les lots « ⛔ Q-001 » deviennent « ⛔ nouveau back ». | ✅ Résolue |
| Q-002 | **Rouverte (2026-10-07).** Initialement : « club-manager-api est le back cible, Phase 3 = analyse d'écart ». Désormais : la Phase 3 est la **conception du nouveau back** ; le contrat actuellement consommé par le front (`src/lib/api/`) est la **contrainte de compatibilité** de départ. Tout changement de stack exige un ADR fondé sur des besoins mesurés. | ⏳ En cours (Phase 3) |
| Q-003 | Vulnérabilités de production dans le périmètre : LOT-00 sécurité, P1. Vulnérabilités de dev : consignées seulement. | ✅ Résolue 2026-10-07 |
| Q-004 | `worker/` : périmètre complet. `spikes/` : décrit en cartographie, exclu de l'inventaire. `.vscode/` : hors périmètre. | ✅ Résolue 2026-10-07 |
| Q-005 | `worker/` (Playwright + service role) est déclaré OBSOLÈTE par `docs/FBI_WORKER.md:3-13` mais toujours présent et suivi. Supprimer en Phase 5 (lot nettoyage), ou conserver ? | ✅ Résolue 2026-10-07 : oui, `worker/` sera supprimé en Phase 5 après vérification qu'aucun script/déploiement/doc active ne le référence ; la config morte de `next.config.ts` suit le même traitement. || ✅ Résolue 2026-10-07 : oui, suppression en Phase 5 après vérification qu'aucun script/déploiement/doc active ne le référence ; la config morte de `next.config.ts` suit. |
| Q-006 | Faut-il auditer l'historique git (`git log -p`) à la recherche de secrets déjà commités (service_role, `.env`) ? Non fait en Phase 1 (hors consigne). | ✅ Résolue 2026-10-07 : audit fait, aucun secret (voir `10-risques.md`). |
| Q-007 | **Résolue (2026-10-07)** : déploiement du front sur **VPS**. La CI GitHub Actions reste limitée aux vérifications ; aucun déploiement automatique sans validation. | ✅ Résolue |

| Q-008 | Clés JWT asymétriques ? **Non vérifiable par moi** : l'URL du projet Supabase n'est dans aucun fichier du dépôt (pas de `.env.local`). Option retenue valable dans les deux cas (ADR-001). **À faire par le propriétaire** : `curl https://<projet>.supabase.co/auth/v1/.well-known/jwks.json` (clés non vides = asymétrique) + durée de vie du JWT. | ⏳ Ouverte (non bloquante) |
| D-1 | Réglages du club : migrer vers l'API (LOT-04, dépend de Q-001). **Mesure conservatoire faite le 2026-10-07** : validation serveur du fuseau (`isValidTimezone`, `club-settings.ts`), commit `cb085e1`. | ✅ Résolue (mesure) / ⏳ migration |
| D-2 | Utiliser `club.timezone`, repli `Europe/Paris` ; helper unique pour les 28 occurrences ; correction dans LOT-05 (pas maintenant). | ✅ Résolue 2026-10-07 |
| Q-009 | Vitest + jsdom + Testing Library en devDependencies : **accepté** 2026-10-07. Non installé à ce stade (aucun composant à tester avant LOT-02). | ✅ Résolue |
| Q-010 | Volumétrie : placeholder non renseigné → « garde tes estimations » appliqué ; toute estimation reste marquée « estimé » dans `08`. | ✅ Résolue (par défaut) |

| D-3 | **TRT-001 : option B, risque accepté** par Rida le 2026-10-07 (voir R-013, `10-risques.md`). Révision obligatoire : au plus tard à la livraison du LOT-02 et, en tout cas, au prochain point 🛑 de Phase 4. LOT-02 en tête des lots de Phase 4. | ✅ Résolue 2026-10-07 |
| Q-011 | Le nouveau back **remplace-t-il** `club-manager-api` ou **coexiste-t-il** (nouveaux endpoints seulement) ? Les deux scénarios sont préparés dans ADR-005. | ⏳ À poser au 🛑 fin de Phase 3 |
| Q-012 | Contraintes de stack côté équipe : langages maîtrisés, BDD imposée, Supabase conservé pour l'auth et les données ? | ⏳ À poser au 🛑 fin de Phase 3 |
| Q-013 | VPS : Docker disponible ? quel reverse proxy ? méthode de déploiement actuelle du front ? | ⏳ À poser au 🛑 fin de Phase 3 |
| Q-014 | Sémantique exacte de `period=weekend` côté back existant (fuseau, samedi-dimanche ?) et validation du `timezone` par `PATCH /v1/clubs/{id}` : à vérifier par un appel d'essai avant LOT-04/LOT-06 (aucune lecture du code du back). | ⏳ |
