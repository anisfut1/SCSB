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
