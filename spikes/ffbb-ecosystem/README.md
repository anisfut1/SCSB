# Spike — écosystème FFBB

Dossier de recherche technique, **séparé du code applicatif** (`src/`,
`supabase/`). Rien ici n'est importé ni utilisé par l'application.

Livrable principal de ce spike : [`docs/FFBB_ECOSYSTEM_RESEARCH.md`](../../docs/FFBB_ECOSYSTEM_RESEARCH.md).

## Contenu

- `probe-public-api.sh` — script expérimental (bash + curl + jq, aucune
  dépendance lourde) qui sonde l'API publique FFBB (`api.ffbb.app`) : jeton
  public, recherche du club par code FFBB, ses engagements, ses rencontres.
  **N'a pas pu être exécuté avec succès** depuis l'environnement où il a
  été écrit (accès réseau à `*.ffbb.app` bloqué par la politique d'egress du
  sandbox — voir la note en tête de `docs/FFBB_ECOSYSTEM_RESEARCH.md`). À
  lancer depuis un poste de développeur ou une CI ayant un accès réseau
  normal pour obtenir un premier vrai exemple de données.

## Usage

```bash
cd spikes/ffbb-ecosystem
./probe-public-api.sh
# ou avec un autre code club :
FFBB_CLUB_CODE=OCC0034008 ./probe-public-api.sh
```

Le script récupère son jeton d'API à l'exécution auprès de l'endpoint public
`items/configuration` de la FFBB — **aucun secret n'est codé en dur ni
committé**. Il n'écrit aucun fichier : la sortie (JSON) s'affiche dans le
terminal, à toi de décider si tu veux la garder localement (jamais dans ce
repo si elle contient des données personnelles réelles).

## Règles de ce dossier

- Aucun secret, cookie ou token committé.
- Aucune donnée personnelle réelle (licencié, coach, dirigeant...) committée
  — même récupérée légitimement via l'API publique.
- Scripts explicitement expérimentaux : pas de garantie de stabilité, pas de
  tests, pas de convention de code applicatif à respecter ici.
- Ce dossier ne sera pas repris tel quel en Phase 1 : le vrai
  `FFBBPublicProvider` sera écrit dans `src/lib/ffbb/` avec les standards du
  projet (TypeScript strict, tests, etc.). Ce spike sert uniquement à valider
  la stratégie avant cet investissement.
