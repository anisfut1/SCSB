# 03 — Plan de migration
_Phase 2, 2026-10-07. Ordre : **sécurité d'abord**, puis meilleur ratio gain/effort, en respectant les dépendances. Chaque lot est petit, testable, réversible (règle 3). Tout lot « back requis » est **⛔ bloqué par Q-001** tant que l'accès à `club-manager-api` n'est pas confirmé ; les lots **front seul** peuvent démarrer dès validation._

## Vue d'ensemble
| Lot | Intitulé | TRT | Prio | Back requis | Statut |
|-----|----------|-----|------|-------------|--------|
| LOT-00 | Vulnérabilités de prod | — | P1 | non | ✅ |
| LOT-01 | Auth : jeton mémoïsé + `getClaims()` | TRT-002 | P1 | non | ⬜ prêt |
| LOT-02 | Roster public : recherche serveur | TRT-001 | P1 | oui | ⛔ Q-001 |
| LOT-03 | Gymnases dynamiques (multi-tenant) | TRT-003 | P1 | à confirmer | ⛔ Q-001 |
| LOT-04 | Réglages club via API + validation fuseau | TRT-011 | P2 | oui | ⛔ Q-001 |
| LOT-05 | Saison & journée côté serveur | TRT-007, TRT-008 | P2 | oui | ⛔ Q-001 |
| LOT-06 | Matchs : filtres + pagination serveur | TRT-006 | P2 | oui | ⛔ (dépend LOT-05) |
| LOT-07 | Endpoint tableau de bord (BFF) | TRT-005 | P1 | oui | ⛔ (dépend LOT-01, LOT-05) |
| LOT-08 | Résultats groupés côté serveur | TRT-009 | P2 | oui | ⛔ (dépend LOT-05) |
| LOT-09 | Import licenciés : parsing serveur | TRT-010 | P2 | oui | ⛔ Q-001 |
| LOT-10 | Opérations longues en jobs asynchrones | TRT-004 | P1→P2 | oui | ⛔ Q-001 (gros, à découper) |
| LOT-11 | CI minimale (typecheck, lint, tests, build) | — | P2 | non | ⬜ prêt (Q-007 ouverte) |
| LOT-12 | Petites listes & résumés (opportuniste) | TRT-012 à 015 | P3 | oui | ⛔ |
| LOT-13 | Nettoyage : `worker/`, `next.config.ts`, commentaires | — | P3 | non | ⬜ Phase 5 (Q-005 ✅) |

**Ordre recommandé** : LOT-01 → LOT-11 (front seul, immédiats) ; puis, dès accès au back : LOT-02 → LOT-03 → LOT-04 → LOT-05 → (LOT-06 ∥ LOT-07 ∥ LOT-08) → LOT-09 → LOT-10 → LOT-12 ; LOT-13 en Phase 5.
**Pourquoi LOT-07 (gros gain) après LOT-05** : il réutilise la borne de saison et la règle de journée côté serveur ; le faire avant dupliquerait la règle une 3ᵉ fois.
**Pourquoi LOT-10 tardif** : le plus risqué (comportements d'intégration FFBB/FBI non testables sans le back) ; il se découpe en sous-lots par endpoint (sync FFBB, process-jobs, parse-documents, check-all-derogations, dérogation respond/check, import).

## Modèle commun à chaque lot (rappel du cycle Phase 4)
Test de caractérisation → implémentation back + tests → bascule front (feature flag si risque moyen/élevé) → suppression du code front → mesure avant/après (`08-metriques.md`) → doc (`04`, `CHANGELOG`, `00`) → commit atomique.
Flags : variable `NEXT_PUBLIC_*` **interdite** pour un flag sensible ; utiliser une variable serveur Next (`FF_<LOT>`), lue côté Server Component, ou un paramètre côté back (à confirmer).




## LOT-01 — Auth : un seul `getUser()` par requête, `getClaims()` en proxy (TRT-002) — P1, **front seul**
- **Objectif** : passer de ~9 allers-retours Supabase Auth par navigation à ≤ 3, sans réduire la sécurité effective.
- **Périmètre** : `src/lib/api/auth.server.ts`, `src/lib/auth/session.ts`, `src/proxy.ts`. Aucune modification du back.
- **Étapes** : (1) mesurer le nombre d'appels Auth par page (log temporaire en test, compteur dans un test unitaire avec mock) ; (2) envelopper `getServerAccessToken` dans `cache()` (portée = requête) ; (3) `requireUser()` réutilise le même résultat ; (4) **si Q-008 = clés asymétriques** : `proxy.ts` utilise `getClaims()` ; sinon on s'arrête à (2)-(3).
- **Tests** : `server.test.ts` (401 → redirect `/login`, déjà présent) + nouveau test « N appels `api.*` → 1 `getUser()` » ; test `proxy` : non connecté → redirect `/login?redirectTo=`, routes publiques passantes.
- **Done** : tests verts ; build OK ; compteur d'appels Auth documenté avant/après ; revue sécurité écrite (durée d'invalidité d'un token révoqué = durée de vie JWT) acceptée par le propriétaire.
- **Bascule** : remplacement direct par étape (2)-(3) (garantie identique) ; l'étape (4) derrière variable serveur `FF_PROXY_CLAIMS`.
- **Rollback** : `git revert` du commit (étape par étape).

## LOT-02 — Roster public : recherche serveur (TRT-001) — P1, back requis
- **Objectif** : ne plus exposer la liste nominative complète d'un club à un anonyme.
- **Endpoints (à confirmer)** : `GET /v1/public/clubs/:slug/licencies?q=&limit=` (q ≥ 2 car., limit ≤ 8, rate-limit IP, `claimed` non exposé hors correspondance exacte). Ancien endpoint : conserver une période de transition puis fermer.
- **Front** : `IdentifyView.tsx` interroge le serveur avec debounce (300 ms) ; supprime `listPublicLicencies` complet et le filtre local.
- **Tests** : caractérisation du parcours d'identification (test de composant à créer — Vitest en env `node`, il faudra un environnement DOM : à décider, voir R-006) ; tests d'intégration back (q trop court → 400, énumération impossible).
- **Done** : un anonyme ne peut plus récupérer plus de 8 noms par requête ; ancien endpoint fermé ; mesure du payload avant/après.
- **Bascule** : double support (le front choisit selon `FF_PUBLIC_SEARCH`) puis coupure. **Rollback** : réactiver l'ancien endpoint + flag.

## LOT-03 — Gymnases dynamiques (TRT-003) — P1, back à confirmer
- **Objectif** : retirer `HOME_VENUES` (Clavel/Lido) du code ; colonnes de l'agenda dérivées des gymnases du club.
- **Endpoint** : `GET /v1/clubs/:clubId/venues` (existant) + rapprochement match↔venue (côté back si possible, `venuesLikelyMatch` existe d'après `HomeMatchesAgenda.tsx:22-24`) ; vue publique : équivalent public à confirmer.
- **Tests** : caractérisation de `resolveVenueColumnKey` avec les libellés réels (CLAVEL, LIDO, LE HETET, PALAIS DES SPORTS, THOMAS BARONCHELLI) avant refactor ; test « club sans gymnase configuré → une seule colonne ».
- **Done** : plus aucun nom de salle en dur dans `src/` (grep) ; rendu identique pour Sète.
- **Bascule** : flag serveur `FF_VENUE_COLUMNS` ; **rollback** : flag off.

## LOT-04 — Réglages du club via l'API (TRT-011, décision D-1) — P2, back requis
- **Objectif** : supprimer le dernier accès Supabase direct et valider le fuseau.
- **Endpoint (à confirmer)** : `PATCH /v1/clubs/:clubId/settings` (`name`, `shortName`, `timezone` validé contre `Intl.supportedValuesOf("timeZone")`, droits club_admin).
- **Front** : `club-settings.ts` appelle `api`, plus de `createServerSupabaseClient` ; `@/types/database` à réévaluer (Phase 5).
- **Tests** : action testée avant/après (mock) ; test back « fuseau invalide → 422 ».
- **Done** : `grep -rn "\.from(" src` vide.
- **Rollback** : revert du commit (l'ancien chemin RLS reste valide).

## LOT-05 — Saison et journée côté serveur (TRT-007, TRT-008) — P2, back requis
- **Objectif** : une seule définition de la saison et de la « journée » (Paris vs `club.timezone` tranché).
- **Endpoints (à confirmer)** : défaut `season=current` sur `GET …/matches` ; champ `weekendKey` par match ; `GET …/matches/weekends`.
- **Prérequis** : décision D-2 (fuseau : toujours Europe/Paris ou `club.timezone` ?).
- **Tests** : `season.test.ts`, `timezone.test.ts`, `match-filters.test.ts` (existants) deviennent les tests de caractérisation ; ajouter 31 juillet/1ᵉʳ août et changement d'heure.
- **Done** : plus de `currentSeasonStart` ni de `Europe/Paris` en dur hors affichage ; `src/lib/season.ts` supprimé.
- **Bascule** : flag `FF_SERVER_SEASON` ; **rollback** : flag off.

## LOT-06 — Matchs : filtres et pagination serveur (TRT-006) — P2
- **Périmètre** : `match-filters.ts`, `MatchesView.tsx`, pages matchs club/public. **Endpoint** : `?when=&side=&teamId=&weekend=&limit=&cursor=`. **Tests** : `match-filters.test.ts` comme oracle (mêmes entrées/sorties via le back en test d'intégration). **Done** : payload `/matchs` ≤ une journée (mesure). **Rollback** : flag.

## LOT-07 — Endpoint tableau de bord (TRT-005) — P1, back requis
- **Endpoint (à confirmer)** : `GET /v1/clubs/:clubId/dashboard` (rôle-aware). **Front** : `dashboard/page.tsx` → 1-2 appels, plus de calcul de victoires ; unifier la règle de victoire avec `matchOutcome` (corriger le cas `isHome === null`, **changement de comportement à documenter**). **Tests** : caractérisation des 4 cartes pour admin/non-admin avec jeu de données figé ; comparaison double-run (ancien calcul vs nouveau) en environnement de test. **Done** : ≤ 2 appels API, gain mesuré (`08`). **Bascule** : double-run puis flag `FF_DASHBOARD_BFF`. **Rollback** : flag.

## LOT-08 — Résultats groupés côté serveur (TRT-009) — P2
- **Endpoint** : `GET …/results`. **Tests** : `result-groups.test.ts` existant = oracle ; ajouter le cas « deux équipes même libellé » (jointure par `teamId`). **Rollback** : flag.

## LOT-09 — Import licenciés : parsing serveur (TRT-010) — P2
- **Endpoint** : `POST …/licencies/import` accepte `{ text }` ; parseur CSV/TSV réel (guillemets, virgules). **Tests** : extraire `parseRows` sans changer son comportement, fixer ses sorties (export FBI réel anonymisé), puis les rejouer côté back. **Done** : cas « nom entre guillemets avec virgule » correct. **Rollback** : l'ancien payload `{ licencies: [...] }` reste accepté pendant la transition.

## LOT-10 — Opérations longues en jobs asynchrones (TRT-004) — P1→P2, back requis, à découper
- **Principe** : endpoints `202 + jobId`, suivi via `getJob`/`pollJobUntilTerminal` (existants, `jobs.ts`). Sous-lots : 10a sync FFBB (`integrations.ts:64`), 10b process-jobs (`:82`), 10c parse-documents (`:98`), 10d check-all-derogations (`:138`), 10e dérogation respond/check (`derogations.ts:44`, `matches.ts:107,127`), 10f tables publiques (`publicTables.ts:134,143`), 10g import/auto-assign licenciés (`licencies.ts:52,65`). Planifier en cron ce qui est lancé à la main (10b, 10c).
- **Tests** : test d'intégration back par endpoint ; côté front, test de `pollJobUntilTerminal` (borne d'essais) ; scénario « onglet fermé pendant le job ». **Done** : plus aucun `timeoutMs` > 20 s dans `src/lib/api`. **Rollback** : par sous-lot (flag + ancien endpoint conservé).

## LOT-11 — CI minimale (P2, front seul)
- **Périmètre** : workflow qui lance `npm ci`, `typecheck`, `lint`, `test`, `build` (variables factices) + `npm audit --omit=dev --audit-level=high`. **Hébergeur** : Q-007 non renseignée → proposer GitHub Actions par défaut, à valider. **Done** : pipeline vert sur la branche. **Option** : scan de secrets (gitleaks) pour fermer R-009.

## LOT-12 — Petites listes et résumés (TRT-012 à 015) — P3, opportuniste
- À regrouper quand le back est ouvert ; chacun est un petit ajout de champ/paramètre. Aucun critère de gain mesurable avant décision.

## LOT-13 — Nettoyage (Phase 5) — P3
- Supprimer `worker/` après vérification qu'aucun script/déploiement/doc active ne le référence (Q-005 ✅) ; retirer `serverExternalPackages`/`outputFileTracingIncludes` morts de `next.config.ts:3-17` ; mettre à jour les commentaires obsolètes (`proxy.ts:55-58`, `supabase/server.ts:15`) ; retirer les variables mortes de `vitest.setup.ts:11-14`. **Done** : build/tests identiques ; `docs/FBI_WORKER.md` annoté.


## LOT-00 — Sécurité : vulnérabilités de dépendances de production (P1)
- **Objectif** : corriger les vulnérabilités `npm audit --omit=dev` (1 critique, 2 hautes) — détail en `01-cartographie-repo.md`.
- **Périmètre** : `package.json`, `package-lock.json` (+ `worker/` si concerné). Vulnérabilités de dev : consignées seulement.
- **Tests** : typecheck, lint, vitest, build identiques à la baseline (`07-tests-et-qualite.md`).
- **Critères de done** : `npm audit --omit=dev` sans critique/haute, ou exceptions justifiées en ADR.
- **Bascule / rollback** : commit unique, `git revert`.
- **Réalisé (2026-10-07)** : `next` 16.3.5 → 16.3.6 (exception autorisée à la règle 1), `eslint-config-next` aligné, `npm audit fix` sans `--force`. Résultats : `07-tests-et-qualite.md`.
- **Rollback** : `git revert <commit LOT-00>` puis `npm ci` (le lockfile revient à 16.3.5/sharp 0.35.4/source-map-js 1.2.1). Aucun changement de code applicatif à défaire.
- **Statut** : ✅ Terminé
