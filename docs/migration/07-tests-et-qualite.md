# 07 — Tests et qualité

## Baseline Phase 0 (2026-10-07)
| Contrôle | Résultat |
|---|---|
| `npm ci` | ✅ OK (warnings allow-scripts : esbuild, fsevents, unrs-resolver) |
| `npm run typecheck` | ✅ OK |
| `npm run lint` | ✅ OK, 0 erreur |
| `npm test` (vitest) | ✅ 18 fichiers, 109 tests passés |
| `npm run build` | ✅ OK (avec variables NEXT_PUBLIC_* factices) |
| `npm audit` | ⚠️ 8 vulnérabilités (1 critique, 7 hautes) dont 3 en prod (1 critique, 2 hautes) — détail à analyser en Phase 1 |

Note : `worker/` a ses propres dépendances/tests, non exécutés en Phase 0.

## Constats Phase 1
- Tests uniquement unitaires sous `src/` (18 fichiers) ; aucun test de composant ni d'intégration ; pas de CI versionné.

## LOT-00 — avant / après (2026-10-07)
| | Avant | Après |
|---|---|---|
| `next` | 16.3.5 | **16.3.6** (exact, comme avant) |
| `eslint-config-next` | 16.3.5 | 16.3.6 (aligné sur next) |
| `sharp` (transitif) | 0.35.4 | 0.35.5 (+ binaires `@img/*` 0.35.5 / libvips 1.3.4) |
| `source-map-js` (transitif) | 1.2.1 | 1.2.2 |
| `npm audit --omit=dev` | 3 (1 critique, 2 hautes) | **0** |
| `npm audit` (complet) | 8 (1 critique, 7 hautes) | 5 hautes, **toutes dev** |
Baseline rejouée après `rm -rf node_modules && npm ci` : typecheck ✅, lint ✅, vitest ✅ 18 fichiers / 109 tests, build ✅ (variables factices).
Vulnérabilités dev restantes (consignées, hors lot) : `@next/eslint-plugin-next`, `eslint-config-next`, `braces`, `fast-glob`, `micromatch`. Le « correctif » proposé par `npm audit` est une rétrogradation majeure de Next (14.2.35) : non appliqué.
`npm audit fix` (sans `--force`) n'a modifié que des versions mineures/correctives (diff du lockfile vérifié : seuls next, @next/*, eslint-config-next, sharp et ses binaires, source-map-js).

## Mesures conservatoires et LOT-01 / LOT-11 (2026-10-07)
- Baseline après D-1 : 19 fichiers / **115 tests** ; après LOT-01 : 21 fichiers / **124 tests**, typecheck/lint/build ✅.
- Tests ajoutés : `src/lib/timezone.test.ts` (+2, `isValidTimezone`), `src/server/actions/club-settings.test.ts` (4), `src/lib/api/auth-calls.test.ts` (5 : caractérisation 8 → 1 appel, jeton transmis, pas de cache inter-requêtes, JWT refusé, sans session), `src/proxy.test.ts` (4).
- CI : `.github/workflows/ci.yml` validé par **actionlint** (0 erreur) ; la logique de vérification de somme de contrôle de gitleaks testée localement ; **premier run réel non effectué** (nécessite un push). Les jobs : `verify` (npm ci, typecheck, lint, test, build, `npm audit --omit=dev --audit-level=high`) et `gitleaks` (historique complet).
- Actions épinglées par tag majeur (`checkout@v7`, `setup-node@v7`) ; gitleaks épinglé `8.30.1`. Épingler par SHA = durcissement possible (chaîne d'approvisionnement), non fait.

## Premier run CI réel (2026-10-07)
Run `37612678201` : `verify` ✅ (9 étapes) et `gitleaks` ✅. Détails et limites : `10-risques.md`. Aucun correctif nécessaire. Branche poussée : `refactor/migration-back` uniquement (jamais `main`, pas de `--force`).
