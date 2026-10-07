# 08 — Métriques
_Aucune mesure runtime n'existe encore (pas d'accès au back, pas de profil navigateur). Ce qui suit est la **liste des mesures à prendre avant chaque lot** ; les valeurs vides ne doivent jamais être remplies par estimation._

## Déjà mesuré
| Mesure | Valeur | Date | Méthode |
|---|---|---|---|
| Somme des chunks JS/CSS `.next/static/chunks` | 2 264 Ko (non gzippé, toutes routes) | 2026-10-07 | `du -sk` après `npm run build` (variables factices) |
| Plus gros chunks | 394 / 267 / 229 Ko | 2026-10-07 | `wc -c` |
| Tests | 109 en ≈ 0,9 s | 2026-10-07 | `npm test` |

## À mesurer (avant lot)
| Lot | Mesure | Outil |
|---|---|---|
| LOT-01 | Nb d'appels Supabase Auth par navigation (`/c/x/dashboard`, `/c/x/matchs`) ; latence cumulée | compteur dans test + log serveur temporaire |
| LOT-02 | Taille de la réponse `GET …/licencies` d'un vrai club ; nb de lignes | `curl -w '%{size_download}'` (Q-010) |
| LOT-05/06/07 | Taille `GET …/matches` saison complète ; TTFB `/c/x/dashboard` et `/c/x/matchs` | `curl`, Server-Timing |
| LOT-08 | Idem `/resultats` | idem |
| LOT-10 | Durée réelle des opérations > 20 s | logs back |
| Global | LCP/INP des pages principales | Lighthouse sur un déploiement de prévisualisation |
