# 08 — Métriques
_Aucune mesure runtime n'existe encore (pas d'accès au back, pas de profil navigateur). Ce qui suit est la **liste des mesures à prendre avant chaque lot** ; les valeurs vides ne doivent jamais être remplies par estimation._

## Déjà mesuré
| Mesure | Valeur | Date | Méthode |
|---|---|---|---|
| Somme des chunks JS/CSS `.next/static/chunks` | 2 264 Ko (non gzippé, toutes routes) | 2026-10-07 | `du -sk` après `npm run build` (variables factices) |
| Plus gros chunks | 394 / 267 / 229 Ko | 2026-10-07 | `wc -c` |
| Tests | 109 en ≈ 0,9 s | 2026-10-07 | `npm test` |

## LOT-01 — appels Supabase Auth par navigation (mesuré par test, 2026-10-07)
Scénario : rendu serveur du tableau de bord d'un club_admin (layout + page : `requireUser` + 7 `api.*`), fichier `src/lib/api/auth-calls.test.ts`. **Mesure en test avec Supabase simulé : elle compte les appels, pas la latence** (durée réelle non mesurée, Q-010).
| | getUser() réseau (rendu) | getClaims() | getSession() (local) | Proxy | Total « réseau possible » |
|---|---|---|---|---|---|
| Avant | 8 | 0 | 7 | 1 `getUser()` (lu dans `proxy.ts:39`, non simulé) | **9** |
| Après | 0 | 1 | 1 | 1 `getClaims()` | **≤ 2** (0 si clés asymétriques, hors 1ʳᵉ récupération JWKS) |
Latence : **non mesurée** ; estimation « ~30-100 ms par appel Auth » = hypothèse, à vérifier sur un déploiement.

## À mesurer (avant lot)
| Lot | Mesure | Outil |
|---|---|---|
| LOT-01 | Nb d'appels Supabase Auth par navigation (`/c/x/dashboard`, `/c/x/matchs`) ; latence cumulée | compteur dans test + log serveur temporaire |
| LOT-02 | Taille de la réponse `GET …/licencies` d'un vrai club ; nb de lignes | `curl -w '%{size_download}'` (Q-010) |
| LOT-05/06/07 | Taille `GET …/matches` saison complète ; TTFB `/c/x/dashboard` et `/c/x/matchs` | `curl`, Server-Timing |
| LOT-08 | Idem `/resultats` | idem |
| LOT-10 | Durée réelle des opérations > 20 s | logs back |
| Global | LCP/INP des pages principales | Lighthouse sur un déploiement de prévisualisation |
