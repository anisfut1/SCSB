#!/usr/bin/env bash
#
# SCRIPT EXPÉRIMENTAL — spike technique, PAS du code applicatif.
#
# Sonde l'API publique FFBB (Directus, hébergée sur api.ffbb.app) pour :
#   1. récupérer un jeton public (endpoint non authentifié)
#   2. retrouver le club SC Sète Basket via son code FFBB (OCC0034008)
#   3. lister ses engagements (équipes engagées)
#   4. lister quelques rencontres (matchs) pour un engagement
#
# Contexte : voir docs/FFBB_ECOSYSTEM_RESEARCH.md. Ce script n'a PAS pu être
# exécuté avec succès depuis l'environnement où il a été écrit (accès réseau
# à *.ffbb.app bloqué par la politique d'egress du sandbox). Il documente la
# forme exacte des requêtes et sert à obtenir un premier vrai exemple de
# données dès qu'il est lancé depuis un poste ayant un accès réseau normal.
#
# Aucun secret : le token est récupéré à l'exécution auprès de l'endpoint
# public "configuration" de la FFBB, jamais codé en dur ni committé.
#
# Usage :
#   ./probe-public-api.sh
#   FFBB_CLUB_CODE=OCC0034008 ./probe-public-api.sh   # code club, modifiable
#
# Dépendances : curl, jq (aucune dépendance lourde, cf. consigne du spike).

set -euo pipefail

API_BASE="https://api.ffbb.app"
CLUB_CODE="${FFBB_CLUB_CODE:-OCC0034008}"

# Cf. docs/FFBB_ECOSYSTEM_RESEARCH.md §3.2 : un WAF/CDN (BunnyCDN) bloque les
# clients qui ne ressemblent pas à l'application mobile officielle FFBB.
# Ceci reproduit ce qu'utilisent 3 bibliothèques open source indépendantes
# pour atteindre l'API. Point d'attention CGU documenté dans le rapport (§10)
# : ce n'est pas une autorisation explicite de la FFBB.
USER_AGENT="okhttp/4.12.0"

echo "== 1. Récupération du jeton public (items/configuration) ==" >&2
CONFIG_JSON=$(curl -sS --fail --max-time 15 \
  -H "User-Agent: ${USER_AGENT}" \
  "${API_BASE}/items/configuration")

API_TOKEN=$(echo "${CONFIG_JSON}" | jq -r '.data.api_bearer_token // empty')
MEILI_TOKEN=$(echo "${CONFIG_JSON}" | jq -r '.data.meilisearch_token // empty')

if [ -z "${API_TOKEN}" ]; then
  echo "Impossible de récupérer api_bearer_token. Réponse brute :" >&2
  echo "${CONFIG_JSON}" >&2
  exit 1
fi

echo "Jeton API récupéré (non affiché, non stocké)." >&2
echo >&2

echo "== 2. Recherche du club par code FFBB (${CLUB_CODE}) ==" >&2
ORGANISME_JSON=$(curl -sS --fail --max-time 15 \
  -H "User-Agent: ${USER_AGENT}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -G "${API_BASE}/items/ffbbserver_organismes" \
  --data-urlencode "filter={\"code\":{\"_eq\":\"${CLUB_CODE}\"}}" \
  --data-urlencode "fields=id,nom,code,engagements")

echo "${ORGANISME_JSON}" | jq '.'

ORGANISME_ID=$(echo "${ORGANISME_JSON}" | jq -r '.data[0].id // empty')

if [ -z "${ORGANISME_ID}" ]; then
  echo "Aucun organisme trouvé pour le code ${CLUB_CODE}. Vérifier le nom du" >&2
  echo "champ ('code' est une hypothèse non vérifiée en réel, voir §6 du rapport)." >&2
  exit 1
fi

echo >&2
echo "== 3. Engagements (équipes) de l'organisme ${ORGANISME_ID} ==" >&2
curl -sS --fail --max-time 30 \
  -H "User-Agent: ${USER_AGENT}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -G "${API_BASE}/items/ffbbserver_engagements" \
  --data-urlencode "filter={\"idOrganisme\":{\"_eq\":${ORGANISME_ID}}}" \
  --data-urlencode "fields=id,nom,nomEquipe,idCompetition,idPoule" \
  | jq '.'

echo >&2
echo "== 4. Rencontres à venir/jouées pour ce club ==" >&2
curl -sS --fail --max-time 60 \
  -H "User-Agent: ${USER_AGENT}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -G "${API_BASE}/items/ffbbserver_rencontres" \
  --data-urlencode "filter={\"_or\":[{\"idOrganismeEquipe1\":{\"_eq\":${ORGANISME_ID}}},{\"idOrganismeEquipe2\":{\"_eq\":${ORGANISME_ID}}}]}" \
  --data-urlencode "fields=id,date_rencontre,horaire,nomEquipe1,nomEquipe2,resultatEquipe1,resultatEquipe2,joue,salle,idPoule" \
  --data-urlencode "sort[]=date_rencontre" \
  --data-urlencode "limit=20" \
  | jq '.'

echo >&2
echo "Terminé. (Jeton Meilisearch également récupéré si besoin d'explorer" >&2
echo "la recherche plein texte : ${MEILI_TOKEN:+présent}${MEILI_TOKEN:-absent})" >&2
