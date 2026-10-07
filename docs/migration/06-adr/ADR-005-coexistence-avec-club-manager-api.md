# ADR-005 — Coexistence ou remplacement de `club-manager-api`
- **Date** : 2026-10-07
- **Statut** : Proposée — **la décision dépend de Q-011** (à poser au 🛑 de fin de Phase 3). Les deux scénarios sont préparés.

## Contexte
- `club-manager-api` porte, d'après `docs/MIGRATION_TO_API.md` et `ARCHITECTURE.md` : les 92 opérations consommées, la synchronisation FFBB, la connexion FBI (navigateur headless), le parsing e-Marque (OCR/PDF), les jobs/crons Vercel, les migrations. **Son code n'a pas été lu** ; son périmètre exact est inconnu de l'agent.
- Le front (`src/lib/api/`, ~2 000 lignes) est le **contrat** : 92 opérations, enveloppe d'erreur, auth Bearer/jeton (`04-contrats-api.md` §A).
- Les lots bloqués (LOT-02, 03, 05 à 10) demandent ~10 nouveaux endpoints (`04` §B), dont les plus urgents n'ont **aucune dépendance** à FFBB/FBI : recherche publique, tableau de bord, résultats, import.
- Le nouveau back est déployé sur VPS ; `club-manager-api` sur Vercel (Q-007 : le front aussi sur VPS).

## Options étudiées
### Scénario S1 — **Coexistence (strangler fig)**
Le nouveau back ne sert que les **endpoints nouveaux ou remplacés** ; un reverse proxy route par chemin (liste explicite), le reste est transmis tel quel à `club-manager-api`. Le front garde **une seule base d'URL**.
- (+) Livraison incrémentale lot par lot, rollback = retirer une règle de routage ; risque minimal sur FFBB/FBI ; LOT-02 livrable vite (R-013).
- (+) Les traitements d'intégration restent chez leur propriétaire ; LOT-10 se fait par **adaptateur** : le nouveau back met un job en file, le worker appelle l'endpoint existant en serveur-à-serveur (le navigateur n'est plus en jeu).
- (−) Deux services à exploiter ; **données partagées** (même base Supabase) → règles : le nouveau back **écrit uniquement dans ses tables** et lit les autres en lecture seule (ADR-003) ; latence supplémentaire du proxy ; deux cycles de déploiement.
- (−) Les endpoints « remplacés » (ex. recherche publique) doivent rester cohérents avec les anciens pendant la transition.
### Scénario S2 — **Remplacement complet**
Le nouveau back réimplémente les 92 opérations **et** les pipelines FFBB/FBI/e-Marque, puis `club-manager-api` est arrêté.
- (+) Un seul back, une seule base de code, propriété claire du schéma et des migrations.
- (−) Gros volume de logique à réécrire sans l'avoir lue (FBI headless, OCR/PDF, rapprochement FFBB↔FBI, contrôles qualité) ; période longue sans valeur livrée ; risque de régression sur des comportements appris en production (`client.ts:13-17`, `matches.ts:40-52`, `integrations.ts:142-151`).
- (−) Nécessite un accès complet au code et aux données de l'existant.
### Scénario S3 — **Coexistence puis remplacement progressif** (S1 comme étape, S2 comme cible éventuelle)
Même mécanique que S1 ; chaque domaine migré (jamais l'intégration d'abord) rapatrie son code, les migrations sont transférées en une fois, `club-manager-api` rétrécit jusqu'à ne garder que les intégrations puis disparaît si le propriétaire le décide.

## Décision (proposée)
**S1 maintenant, avec S3 comme trajectoire** : routage par chemin au reverse proxy, nouveaux endpoints additifs sous `/v1`, intégrations laissées chez `club-manager-api`, adaptateur de jobs pour LOT-10. **S2 n'est envisagé que sur décision explicite**, avec ADR dédié fondé sur la lecture du code existant (non réalisée).
Si **Q-011 = remplacement** : conserver l'ordre des lots mais (a) le LOT-02 reste en tête, (b) ajouter un lot « portage des 92 opérations » avec tests de contrat (`npm run api:smoke` généralisé) avant toute coupure, (c) prévoir un double-run (ancien/nouveau) en environnement de test, (d) transférer la propriété des migrations (ADR-003 §5).

## Conséquences
- (+) Le risque R-013 se ferme vite (LOT-02) sans dépendre d'un portage complet ; aucun changement de base d'URL côté front.
- (−) Règle de routage = **point sensible** (une route mal aiguillée = 404/403 inattendus) → table de routage versionnée et testée dans le repo du nouveau back (`ops/routing`), vérifiée par un test de contrat.
- (−) Jusqu'à la fin de S1, **deux autorisations** coexistent (`club-manager-api` et nouveau back) : toute règle de rôle doit être identique ; on dérive les rôles de la **même source** (tables de membership) et on teste la parité.
- À surveiller : latence du proxy, dérive de schéma entre les deux services, propriété des migrations (un seul propriétaire à la fois).
