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

## LOT-06 — liste des matchs : requêtes et volume par changement de filtre (**SIMULÉ / ESTIMÉ**, 2026-10-07)
**Ce n'est pas une mesure de production** : aucun appel à l'API réelle (pas d'accès, pas de staging documenté). Jeu synthétique déterministe : 15 équipes × 26 = **390 matchs** (estimé), « maintenant » = 2026-10-07 ; faux serveur appliquant la sémantique **supposée** de l'API (`from` inclus, `to` exclu — parité vérifiée aussi avec `to` inclus ; Q-014). Taille = JSON des réponses simulées (~471 o/match, estimé). Reproductible : `npx vitest run src/features/matches/load-matches.test.ts -t "mesure simulée" --silent=false`.
| Scénario | Avant (flag off) | Après (`FF_MATCHES_SERVER_FILTERS=1`) | Gain volume |
|---|---|---|---|
| Journée (vue par défaut) | 2 req · 183 629 o | 2 req · 183 629 o | **0 %** (voir ci-dessous) |
| Journée + équipe | 2 req · 183 629 o | 1 req · 12 285 o | −93 % |
| À venir | 2 req · 183 629 o | 2 req · 149 211 o | −19 % |
| À venir + domicile | 2 req · 183 629 o | 1 req · 74 762 o | −59 % |
| Passés | 2 req · 183 629 o | 1 req · 34 480 o | −81 % |
| Passés + équipe | 2 req · 183 629 o | 1 req · 2 354 o | −99 % |
| À venir + équipe + extérieur | 2 req · 183 629 o | 1 req · 5 280 o | −97 % |
Matchs **affichés** identiques à l'ancien comportement dans les 7 scénarios (14 tests de parité).
**Limite structurelle** : la vue par défaut (« Journée », la plus utilisée) ne gagne **rien** : le sélecteur de journée (`JourneePicker`) a besoin des comptes par semaine de **toute la saison** (`match-filters.ts:145-156`), qu'aucun endpoint n'expose ; seul `GET …/matches/weekends` (`04` B.3, nouveau back) lèvera ce verrou. Avec équipe/lieu choisis, le gain existe même en mode Journée. Avec le flag et une équipe choisie, un aller-retour « équipes » précède les matchs (séquentiel, pour valider l'identifiant) : latence + 1 petite requête, non mesurée.
Latence/TTFB : **non mesurés**.

## À mesurer (avant lot)
| Lot | Mesure | Outil |
|---|---|---|
| LOT-01 | Nb d'appels Supabase Auth par navigation (`/c/x/dashboard`, `/c/x/matchs`) ; latence cumulée | compteur dans test + log serveur temporaire |
| LOT-02 | Taille de la réponse `GET …/licencies` d'un vrai club ; nb de lignes | `curl -w '%{size_download}'` (Q-010) |
| LOT-05/06/07 | Taille `GET …/matches` saison complète ; TTFB `/c/x/dashboard` et `/c/x/matchs` | `curl`, Server-Timing |
| LOT-08 | Idem `/resultats` | idem |
| LOT-10 | Durée réelle des opérations > 20 s | logs back |
| Global | LCP/INP des pages principales | Lighthouse sur un déploiement de prévisualisation |

## LOT-14 (CSP Report-Only) — surcoût (mesuré, 2026-10-07)
**+508 octets d'en-têtes par réponse** (valeurs servies par `next start` avec origines factices : CSP Report-Only + 3 en-têtes). Aucun effet fonctionnel attendu (la CSP ne bloque rien). Impact sur le temps de réponse : non mesuré (négligeable a priori).
