## 2026-10-07
- [Phase 0] Branche `refactor/migration-back` créée — baseline : install/typecheck/lint/tests/build OK, 8 vulnérabilités npm — fichiers : `docs/migration/*` — lien doc : `07-tests-et-qualite.md`
- [Phase 0] Création de l'arborescence de documentation et des squelettes
- [Phase 0] Décisions Q-002, Q-003, Q-004 consignées (résolues) ; Q-001 laissée ouverte (non renseignée) — fichiers : `09-questions-ouvertes.md`
- [Phase 0] LOT-00 sécurité ajouté au plan ; Phase 3 recadrée en analyse d'écart — fichiers : `03-plan-migration.md`, `05-architecture-cible.md`
- [Phase 0] Commit `675fef8` docs(migration): phase 0 initialisation
- [Phase 1] Cartographie complète : stack, dépendances, 3 vulnérabilités de prod détaillées (LOT-00), 3 variables NEXT_PUBLIC_* vérifiées (aucun secret), flux Mermaid, config morte, `worker/` obsolète — fichiers : `01-cartographie-repo.md`, `09`, `10`, `00` — lien doc : `01-cartographie-repo.md`

## 2026-10-07 (suite)
- [Phase 1] Commit `b933d0e` docs(migration): phase 1 cartographie
- [LOT-00] next 16.3.6, eslint-config-next 16.3.6, sharp 0.35.5, source-map-js 1.2.2 ; audit prod 3 → 0 ; baseline verte (109 tests) — fichiers : `package.json`, `package-lock.json` — lien doc : `07-tests-et-qualite.md`
- [LOT-00] Commit `0121eed` fix(security): LOT-00 bump next 16.3.6
- [Phase 2] Audit d'historique git (Q-006) : aucun secret ; Q-005 et Q-006 résolues ; Q-001 et Q-007 toujours ouvertes — fichiers : `10-risques.md`, `09-questions-ouvertes.md`
- [Phase 2] Inventaire (15 TRT) + plan de 14 lots (LOT-00 à LOT-13), 5 P1 ; Q-008, Q-009, Q-010, D-1, D-2 ouvertes ; R-008 à R-012 — fichiers : `02`, `03`, `00`, `08`, `09`, `10` — lien doc : `02-inventaire-traitements.md`

## 2026-10-07 (suite 2)
- [D-1] Validation serveur du fuseau (`isValidTimezone`) dans `club-settings.ts`, 6 tests — commit `cb085e1` — lien doc : `02` TRT-011
- [LOT-01] Auth : résolution unique par requête (`getServerAuth` + `cache()`), `getClaims()` dans proxy et rendu ; 9 → ≤ 2 appels ; tests `auth-calls.test.ts`, `proxy.test.ts` — fichiers : `auth.server.ts`, `session.ts`, `platform.ts`, `proxy.ts` — lien doc : `06-adr/ADR-001-auth-une-resolution-par-requete.md`, `08-metriques.md`
- [LOT-11] `.github/workflows/ci.yml` (verify + audit prod + gitleaks) validé actionlint ; gitleaks v8.30.1 local : 103 commits, aucune fuite — fichiers : `.github/workflows/ci.yml` — lien doc : `10-risques.md`, `07-tests-et-qualite.md`
- [Plan] LOT-14 (CSP / jeton public, P2) ajouté, non implémenté ; D-3 laissée ouverte (TRT-001 : aucune mesure) ; Q-008 non vérifiable (URL projet absente) — fichiers : `03`, `09`, `10`

## 2026-10-07 (suite 3)
- [Décisions] D-3 = option B (R-013 accepté, révision au plus tard à la livraison du LOT-02 / prochain 🛑 de Phase 4) ; Q-001 résolue autrement (nouveau back) ; Q-002 rouverte ; Q-007 = VPS ; LOT-02 en tête de Phase 4 ; Q-011 à Q-013 ouvertes — fichiers : `09`, `10`, `03`, `00` — lien doc : `10-risques.md`

## 2026-10-07 (suite 4 — Phase 3)
- [Push] `git push -u origin refactor/migration-back` (branche seule, sans --force) ; premier run CI `37612678201` ✅ (verify + gitleaks) — fichiers : `10`, `07`
- [Phase 3] `04-contrats-api.md` : 100 opérations (généré depuis `schema.ts` + appels `src/lib/api/`), 8 non appelées, écarts E-1 à E-6, nouveaux endpoints B.1 à B.11
- [Phase 3] `05-architecture-cible.md` : stack, modules, auth, jobs, fuseau, VPS, arborescence du nouveau repo ; 5 diagrammes Mermaid validés par le parseur officiel (1 erreur de syntaxe trouvée et corrigée)
- [Phase 3] ADR-002 (langage), 003 (données), 004 (jobs), 005 (coexistence, 2 scénarios), 006 (auth/jeton), 007 (VPS) — statut Proposée
- [Plan] LOT-04 et LOT-06 débloqués côté front (endpoints existants) ; R-014 (jeton en query string) ouvert ; Q-014 ajoutée

## 2026-10-07 (suite 5 — révision Railway)
- [Décisions] Q-011 = S3 (coexistence puis remplacement progressif) ; Q-012 = nouveau back sur **Railway** ; Q-013 résolue par déduction du dépôt (aucun VPS versionné, Vercel documenté) ; repo back créé par le propriétaire ; Q-015, Q-016, Q-017 ouvertes — fichiers : `09`, `01` §8 — lien doc : `01-cartographie-repo.md#8`
- [LOT-04] `club-settings.ts` → `api.clubs.update` ; plus d'accès BDD direct dans `src/` ; 9 tests ; baseline verte (129 tests) — fichiers : `src/server/actions/club-settings.ts(.test)` — lien doc : `03-plan-migration.md`
- [LOT-06] Filtres matchs (équipe, domicile/extérieur, À venir/Passés) côté serveur derrière `FF_MATCHES_SERVER_FILTERS` (défaut off), `period=weekend` non utilisé ; 22 tests ; mesure **simulée** : −19 % à −99 % de volume hors vue Journée, 0 % sur la vue par défaut ; R-015 (troncature publique) relevé ; liste d'essais Q-014 prête — fichiers : `src/features/matches/load-matches.ts`, `src/lib/api/matches.ts`, `src/config/flags.ts`, pages matchs — lien doc : `08-metriques.md`, `09`
- [Phase 3 — révision Railway] ADR-007 réécrit (Dockerfile, services api+worker, staging+production, « Wait for CI », R-014 par conception) ; ADR-005 « Acceptée pour S3 » avec options (a)/(b)/(c) et trajectoire module par module ; ADR-003 (Q-015 : Supabase / Railway / hybride) et ADR-004 (pg-boss derrière pooler, à tester) révisés ; `05` mis à jour (6 diagrammes validés) ; `11-init-repo-back.md` créé (rien exécuté) ; Q-018 (« annuaire authentifié »), Q-019, R-016, R-017 ajoutés
- [Vérifié] Docs Railway/Supabase/pg-boss consultées le 2026-10-07 : Nixpacks non sélectionnable, `railway.json` déprécié (2026-12-01), healthchecks au déploiement seulement, query strings non documentées dans les journaux HTTP, Supavisor session = IPv4, pg-boss v12.37 (Node ≥ 22.12, PG ≥ 13) — fichiers : `06-adr/ADR-007-deploiement-railway.md`, `03/004`

## 2026-10-07 (suite 6 — décisions Q-015 à Q-018)
- [Correction] Toute mention d'un VPS pour le front était erronée (Q-007) : **le front est sur Vercel** (Q-017). Les entrées ci-dessus évoquant un VPS sont des états historiques, remplacés par ce point ; documents vivants corrigés (`01` §8, `09`, ADR-003/004/005/007, `05`, `11`).
- [Décisions] Q-015 = Supabase conservé pendant S3 + réévaluation obligatoire en fin de S3 (ADR-003) ; Q-016 = routage par module dans le client, ADR-005 « Acceptée » ; Q-017 = front sur Vercel ; Q-018 = option 1 (recherche anonyme bornée)
- [Vérifié] Vercel : les journaux d'exécution enregistrent les « Search Params » (vercel.com/docs/logs/runtime) → R-014 confirmé côté Vercel ; chemin réel du jeton établi par lecture du code (ADR-005)
