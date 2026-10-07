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
