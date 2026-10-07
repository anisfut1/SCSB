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
| Q-011 | **S3 : coexistence puis remplacement progressif** (décision 2026-10-07). ADR-005 « Acceptée » pour S3 ; le mécanisme de routage est révisé (plus de reverse proxy VPS commun, voir Q-012, Q-016). | ✅ Résolue |
| Q-012 | **Le nouveau back sera hébergé sur Railway**, pas sur le VPS (décision 2026-10-07). ADR-007, ADR-003 et ADR-004 révisés ; ADR-002 (TypeScript + Hono) reste « Proposée ». Localisation de la base : **Q-015** (décision du propriétaire). | ✅ Résolue (hébergement) |
| Q-013 | Configuration du VPS : **déduite du dépôt**, voir `01-cartographie-repo.md` §8. Résultat : le dépôt ne confirme aucun VPS (aucun artefact), il documente Vercel. | ✅ Résolue (par déduction, non concluante) → Q-017 |
| Q-014 | **Liste d'appels d'essai prête à copier-coller ci-dessous** (§ « Q-014 — vérifications à exécuter par le propriétaire »). Sémantique exacte de `period=weekend` côté back existant (fuseau, samedi-dimanche ?) et validation du `timezone` par `PATCH /v1/clubs/{id}` : à vérifier par un appel d'essai avant LOT-04/LOT-06 (aucune lecture du code du back). | ⏳ |

| Repo back | **Le propriétaire crée le repository lui-même** et fournira l'URL. L'agent ne crée rien d'ici là (décision 2026-10-07). | ✅ Décision |
| Q-015 | Base de données du nouveau back : Postgres **Supabase conservé** ou Postgres **Railway** ? Comparaison et recommandation dans ADR-003 (révisé). | ⏳ Décision attendue (🛑) |
| Q-016 | Mécanisme de routage S3 : **(a)** routage par module dans le client front (base URL par domaine + feature flag par module) ou **(b)** le nouveau back proxifie `club-manager-api` pour les routes non portées ? Comparaison et recommandation dans ADR-005 (révisé). | ⏳ Décision attendue (🛑) |
| Q-017 | Où le front est-il **réellement** déployé aujourd'hui ? Vercel (tout le dépôt le dit) ou VPS (Q-007) ? Conditionne le CORS, la CSP (LOT-14) et le routage (Q-016). | ⏳ À confirmer |

## Q-014 — vérifications à exécuter par le propriétaire (lecture seule sauf T8)
_Aucun de ces appels n'a été exécuté par l'agent (pas d'accès, aucun staging documenté dans le dépôt : recherche `staging|préproduction|recette` négative). Les tests T1 à T7 sont des **GET** ; T8 est un **PATCH** : à lancer sur un club de test ou en suivant la procédure de restauration. Ne collez jamais de jeton dans un ticket ou un journal._
```bash
# --- Variables (à adapter) ---
API="https://<url-club-manager-api>"; SLUG="<slug-du-club>"; CLUB="<uuid-ou-slug>"
TOKEN="<JWT-supabase>"   # export depuis la session ; NE PAS le publier. Pour les routes publiques, aucun jeton.
AUTH=(-H "Authorization: Bearer $TOKEN")
M="$API/v1/public/clubs/$SLUG/matches"   # lecture publique, sans jeton

# T1 — `period=weekend` : combien de matchs, entre quelles dates ?
curl -sS "$M?period=weekend&limit=200" | jq '{n:(.matches|length), min:([.matches[].matchDatetime]|min), max:([.matches[].matchDatetime]|max), pagination}'

# T2 — comparer avec les deux fenêtres candidates (remplacer les dates par la journée courante, en UTC ;
#      Paris = UTC+2 en été, UTC+1 en hiver). Fenêtre A = samedi 00:00 → lundi 00:00 ; fenêtre B = lundi précédent 00:00 → lundi suivant 00:00
SAT_FROM="2026-10-09T22:00:00Z"; SAT_TO="2026-10-11T22:00:00Z"     # A (exemple pour le samedi 10/10/2026)
MON_FROM="2026-10-04T22:00:00Z"; MON_TO="2026-10-11T22:00:00Z"     # B
for w in "A $SAT_FROM $SAT_TO" "B $MON_FROM $MON_TO"; do set -- $w
  curl -sS "$M?from=$2&to=$3&limit=200" | jq -r '.matches[].id' | sort > "/tmp/win_$1.txt"; done
curl -sS "$M?period=weekend&limit=200" | jq -r '.matches[].id' | sort > /tmp/period.txt
diff -q /tmp/period.txt /tmp/win_A.txt && echo "period=weekend == fenêtre A (samedi-dimanche)"
diff -q /tmp/period.txt /tmp/win_B.txt && echo "period=weekend == fenêtre B (lundi-dimanche, = règle du front)"

# T3 — bornes : `from` est-il inclus, `to` est-il exclu ? (X = date d'un match réel)
X=$(curl -sS "$M?limit=1" | jq -r '.matches[0].matchDatetime'); echo "X=$X"
curl -sS "$M?from=$X&limit=200" | jq '[.matches[]|select(.matchDatetime==env.X)]|length'   # >0 => from INCLUS
curl -sS "$M?to=$X&limit=200"   | jq '[.matches[]|select(.matchDatetime==env.X)]|length'   # >0 => to INCLUS ; 0 => to EXCLU

# T4 — `teamId` vs filtre local par nom d'équipe
TEAM=$(curl -sS "$API/v1/public/clubs/$SLUG/teams" | jq -r '.teams[0].id'); NAME=$(curl -sS "$API/v1/public/clubs/$SLUG/teams" | jq -r '.teams[0].name')
curl -sS "$M?teamId=$TEAM&limit=200" | jq '.pagination.total'
curl -sS "$M?limit=200" | jq --arg n "$NAME" '[.matches[]|select(.teamName==$n)]|length'   # doit être égal au précédent

# T5 — `homeAway` : les matchs sans lieu connu (isHome null) sont-ils exclus des deux côtés ?
curl -sS "$M?homeAway=home&limit=200" | jq '[.matches[]|select(.isHome!=true)]|length'      # attendu 0
curl -sS "$M?homeAway=away&limit=200" | jq '[.matches[]|select(.isHome!=false)]|length'     # attendu 0

# T6 — troncature publique (R-015) : la saison dépasse-t-elle 200 matchs ?
curl -sS "$M?from=2026-08-01T00:00:00Z&limit=200" | jq '.pagination'    # total > 200 => la vue publique est tronquée
# ordre par défaut : croissant ? (comparer le premier et le dernier de la page 1 avec un offset final)
curl -sS "$M?from=2026-08-01T00:00:00Z&limit=2" | jq '[.matches[].matchDatetime]'

# T7 — la pagination respecte-t-elle les filtres ? (total = nombre filtré)
curl -sS "$M?homeAway=home&limit=1" | jq '.pagination.total'

# T8 — ÉCRITURE (rejet d'un fuseau invalide par PATCH /v1/clubs/{id}) : club de TEST de préférence.
#      1) sauvegarder  2) tenter  3) lire  4) RESTAURER si l'API a accepté.
OLD=$(curl -sS "${AUTH[@]}" "$API/v1/clubs/$CLUB" | jq -r '.timezone'); echo "fuseau actuel : $OLD"
curl -sS -o /tmp/patch.json -w "%{http_code}
" -X PATCH "${AUTH[@]}" -H "Content-Type: application/json" -d '{"timezone":"Pas/UnFuseau"}' "$API/v1/clubs/$CLUB"; cat /tmp/patch.json
curl -sS "${AUTH[@]}" "$API/v1/clubs/$CLUB" | jq -r '.timezone'
# Attendu : 400/422 et fuseau inchangé. Si le code est 200 (fuseau invalide accepté) : RESTAURER immédiatement :
# curl -sS -X PATCH "${AUTH[@]}" -H "Content-Type: application/json" -d "{\"timezone\":\"$OLD\"}" "$API/v1/clubs/$CLUB"
```
**À me renvoyer** (sans jeton ni donnée personnelle) : la sortie de T1, quel diff a répondu « == » en T2, les 2 nombres de T3, l'égalité de T4, les 0 de T5, `pagination` de T6, et le code HTTP + le fuseau de T8.
