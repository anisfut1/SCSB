# 13 — Vérification de R-018 sur l'existant (script prêt à copier-coller)
_2026-10-08. Remplace la procédure en prose de `11` §7.9.7 (même protocole, converti en script). **À lancer par le propriétaire, sur un club de TEST, avec des fiches SYNTHÉTIQUES.** L'agent ne l'exécute pas et n'appelle aucune API réelle. Ne jamais coller dans une conversation une sortie contenant un lien, un jeton ou une adresse._

## 0. Préparation (dans l'application, club de test uniquement)
| Fiche | Nom | Adresse | Droits (cases de la fiche, `schema.ts:7835-7837`) |
|---|---|---|---|
| **A** | « Test Joueur » | aucune | aucun |
| **B** | « Test Coach » | aucune | `publicCoach` |
| **C** | « Test Admin » | aucune | `publicAdmin` |
| **D** | « Test Coordo » | aucune | `publicCoordinator` |
Une boîte e-mail de test que vous contrôlez (`vous+r018@…`). Aucune de ces fiches ne doit appartenir à une vraie personne.

## 1. Le script
```bash
#!/usr/bin/env bash
# R-018 — une fiche SANS adresse peut-elle être « revendiquée » sans validation ?
# À RENSEIGNER (aucune valeur réelle n'est fournie par la documentation) :
API=""        # URL de club-manager-api, sans slash final
SLUG=""       # slug du club de TEST
MAIL=""       # votre boîte de test (vous+r018@…)
A=""; B=""; C=""; D=""   # UUID des fiches A, B, C, D (étape 1)
# --------------------------------------------------------------------------------------
set -u
[ -n "$API" ] && [ -n "$SLUG" ] && [ -n "$MAIL" ] || { echo "Renseigner API, SLUG et MAIL"; exit 1; }
HDR=(-H "Content-Type: application/json")
POST() { # $1 = id fiche, $2 = corps JSON ; n'affiche que le code HTTP et le code d'erreur
  curl -sS -o /tmp/r018.json -w "HTTP %{http_code}" -X POST "${HDR[@]}" -d "$2" \
    "$API/v1/public/clubs/$SLUG/licencies/$1/request-link"
  echo "  code=$(jq -r '.error.code // (if .sent then "sent" else "?" end)' /tmp/r018.json 2>/dev/null)"
}

echo "== Étape 1 : retrouver les UUID des fiches de test (ancien endpoint, club de TEST) =="
curl -sS "$API/v1/public/clubs/$SLUG/licencies" \
  | jq -r '.licencies[] | select(.lastName|test("^(Joueur|Coach|Admin|Coordo)$")) | "\(.id)  \(.firstName) \(.lastName)  claimed=\(.claimed)"'
echo "(renseigner A, B, C, D en tête de script puis relancer)"; [ -n "$A$B$C$D" ] || exit 0

echo; echo "== Étape 2 : SANS adresse (le serveur réclame-t-il une adresse ?) =="
for P in "A:$A" "B:$B" "C:$C" "D:$D"; do printf '%s  ' "${P%%:*}"; POST "${P#*:}" '{"returnTo":"accueil"}'; done

echo; echo "== Étape 3 : AVEC votre adresse de test (un lien part-il sans validation ?) =="
for P in "A:$A" "B:$B" "C:$C" "D:$D"; do
  printf '%s  ' "${P%%:*}"; POST "${P#*:}" "{\"email\":\"$MAIL\",\"returnTo\":\"accueil\"}"
  sleep 3     # évite LINK_RECENTLY_SENT / limites de débit entre deux essais
done
echo; echo "== Étape 4 : ouvrez la boîte de test et comptez les messages « lien personnel » pour A, B, C, D (0 à 4). =="
```

## 2. Lecture des résultats (attendu si la faille est ABSENTE / résultat si elle est PRÉSENTE)
| Étape | Faille **absente** | Faille **présente** |
|---|---|---|
| 1 | Liste les 4 fiches de test (cet endpoint est lui-même R-013) | idem — ne prouve rien sur R-018 |
| 2, fiches A-D | `400` avec `code=EMAIL_REQUIRED` **ou** refus uniforme (`4xx`) : le serveur n'accepte pas de revendication anonyme | `400 EMAIL_REQUIRED` est le comportement **actuel supposé** (il invite à saisir une adresse) : c'est l'amorce de la faille, pas encore la preuve |
| 3, fiche **A** | **Aucun message** reçu ; la réponse peut être `200`/`202` neutre ou `4xx` | `200` avec `code=sent` **et un message arrive** dans la boîte de test → **revendication sans validation CONFIRMÉE** |
| 3, fiches **B, C, D** | **Aucun message** | **Un message arrive** → **aggravation : lien à droits d'écriture (coach, admin, coordinateur) obtenu par un tiers** |
**Seul le compte des messages reçus (étape 4) est probant** ; un `200` sans message n'est pas une faille.
**Attention, essai à usage unique par fiche** : le contrat existant documente un `409 ALREADY_CLAIMED` (« nom déjà choisi sans adresse e-mail connue », `schema.ts:2663`) : après un premier envoi réussi à une adresse saisie, la fiche est « claimed » et un second essai sur la même fiche répondra `409`. Pour relancer le script, **recréer les fiches de test** (ou retirer l'adresse saisie si l'application le permet). Ce `409` est aussi la seule protection connue du code actuel : elle empêche une *seconde* revendication, pas la *première* (le premier venu garde la fiche, ce qui permet de « squatter » une fiche à l'avance).

## 3. Si R-018 est confirmé (surtout pour B, C ou D)
1. **Ne pas cliquer** le lien depuis un navigateur partagé. Si vous voulez mesurer ce qu'il donne, lisez le jeton sans l'afficher et n'imprimez que les booléens de droits :
```bash
read -rs -p "Jeton (collé depuis le lien reçu, invisible) : " T; echo
printf 'url = "%s/v1/public/clubs/%s/me?token=%s"\n' "$API" "$SLUG" "$T" | curl -sS -K - | jq '{isClubAdmin, derogationRequests, tables}'
unset T
```
2. **Jetons à régénérer** : ceux des fiches de test touchées (B, C, D en priorité) ; si l'essai a été fait par erreur sur une vraie fiche : régénérer son jeton **avant tout**, retirer l'adresse saisie, prévenir la personne. Retirer l'adresse de test des fiches.
3. **Mesure d'urgence côté `club-manager-api`, sans attendre le LOT-02** (action du propriétaire ; je n'ai pas lu ce code) — par ordre d'efficacité :
   - **a.** pour toute fiche **sans adresse connue**, faire répondre `request-link` par un refus uniforme (même réponse que « fiche inconnue ») au lieu de `EMAIL_REQUIRED` : plus aucune revendication anonyme ; repli affiché : « contacte ton club » (le club saisit l'adresse lui-même) ;
   - **b.** à défaut, refuser la saisie d'adresse pour toute fiche portant `publicAdmin`, `publicCoach` ou `publicCoordinator` (règle « droits d'écriture exclus », `11` §7.9.2) ;
   - **c.** limiter `request-link` : 5/h par fiche, 20/h par IP (`11` §7.2) ;
   - **d.** que le club **pré-charge les adresses** des fiches à droits d'écriture (elles deviennent « adresse connue », le lien ne part qu'à cette adresse).
   Après la mesure, **relancer le script** : attendu = 0 message pour A-D.
4. Me renvoyer **uniquement** : les codes HTTP et `code=` des étapes 2 et 3, et le nombre de messages reçus pour A, B, C, D. **Jamais** le lien, le jeton ou l'adresse.

## 4. Nettoyage
Retirer l'adresse de test des fiches A-D, supprimer les fiches de test si elles ne servent plus, vider la boîte de test, `unset` des variables de l'étape 3.
