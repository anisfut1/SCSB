# Spike — FBI authentifié (local uniquement)

Outil de diagnostic **strictement local**, à exécuter sur ton propre poste
avec ton propre compte club FBI. Il ne fait jamais partie de l'application
(pas de dépendance depuis `src/`), n'est jamais déployé, et son état
(session, rapports bruts, téléchargements) ne quitte jamais ta machine.

Contexte et rapport complet : [`docs/FBI_AUTHENTICATED_SPIKE.md`](../../docs/FBI_AUTHENTICATED_SPIKE.md).

## Pourquoi un outil séparé (et pas un simple script curl comme le spike public) ?

FBI est une application web classique (formulaire + session de cookies), pas
une API. Il faut donc un vrai navigateur pour se connecter, puis observer ce
qu'il se passe. Cet outil ouvre Chromium, **te laisse te connecter et
naviguer toi-même**, et se contente d'enregistrer les métadonnées réseau
pendant ce temps — jamais tes identifiants, jamais tes cookies, jamais les
données personnelles affichées à l'écran.

## Installation (une fois)

```bash
npm run fbi:setup
```

(depuis la racine du repo — installe Playwright + Chromium **dans
`spikes/fbi-auth/` uniquement**, complètement séparé des dépendances de
l'application. Le téléchargement de Chromium peut prendre une ou deux
minutes.)

## Utilisation

### 1. Premier lancement — connexion manuelle

```bash
npm run fbi:probe
```

1. Une fenêtre Chromium s'ouvre sur `https://extranet.ffbb.com/fbi` (ou une
   autre URL si tu la précises, voir plus bas).
2. **Connecte-toi toi-même** avec ton compte club, dans la fenêtre.
3. Reviens dans le terminal, appuie sur **Entrée**.
4. Le script sauvegarde ta session localement (`.local/auth-state.json`,
   jamais committée) pour ne pas avoir à te reconnecter à chaque essai.
5. **Explore FBI toi-même** : Organismes, Licences, Compétitions,
   Engagements, Rencontres, Feuilles de marque, Dérogations, exports... Le
   script enregistre en continu les requêtes réseau (URL, méthode, statut,
   type de contenu — jamais les valeurs de formulaire ni les cookies).
6. Quand tu as fini, reviens dans le terminal, appuie sur **Entrée** une
   seconde fois.
7. Un rapport est écrit dans `.local/report.json` (local, gitignored).

Le flag `--headed` est accepté mais sans effet : ce spike s'exécute
**toujours** en mode visible, c'est nécessaire pour te permettre de te
connecter et de naviguer toi-même.

```bash
npm run fbi:probe -- --headed   # identique à `npm run fbi:probe`
```

### 2. Lancements suivants — réutilisation de la session

Si `.local/auth-state.json` existe et semble encore valide, le script ne te
redemandera pas de te connecter — il passera directement à l'étape
d'exploration. Pour forcer une reconnexion manuelle (par exemple pour
observer à nouveau l'écran de connexion) :

```bash
npm run fbi:probe -- --reset-session
```

### 3. Vérifier si la session est encore valide (sans ouvrir de fenêtre)

```bash
npm run fbi:check-session
```

Utile pour observer, au fil des jours, combien de temps une session FBI
reste active (voir §20 du brief d'origine).

### 4. Générer un rapport sanitisé, prêt à transmettre

```bash
npm run fbi:report
```

Lit `.local/report.json`, revérifie l'absence de toute donnée sensible, et
écrit `.local/report-sanitized.json` — routes uniques, méthodes, statuts,
types de contenu, compteurs. **C'est ce fichier que tu peux transmettre**
pour la suite du travail (copier-coller son contenu, ou l'envoyer).

### 5. Inspecter un export téléchargé (structure seulement)

Si tu as téléchargé un export CSV pendant l'exploration (voir
`.local/downloads/`) :

```bash
npm run fbi:inspect-export -- .local/downloads/download-1.csv
```

Affiche uniquement la ligne d'en-tête (noms de colonnes), jamais les
données. Pour un export Excel (`.xlsx`), ouvre-le toi-même dans
Excel/Numbers/Google Sheets et note les en-têtes de colonnes à la main —
volontairement, cet outil n'essaie pas de parser l'Excel (voir le
commentaire en tête de `inspect-export.ts` : la bibliothèque habituelle a
des vulnérabilités connues sans correctif sur npm).

### 6. Tout supprimer

```bash
npm run fbi:clean
```

Supprime entièrement `spikes/fbi-auth/.local/` (session, rapports,
téléchargements). À faire dès que tu n'as plus besoin de la session
localement, et systématiquement avant de partager ton poste ou de le
prêter.

## Options avancées (facultatif)

### Connexion automatique "best effort"

Si tu préfères ne pas te reconnecter manuellement à chaque fois, tu peux
préparer un fichier `.env.fbi.local` (jamais committé, voir
`.env.fbi.example`) :

```bash
cp .env.fbi.example .env.fbi.local
# puis éditer .env.fbi.local avec ton éditeur habituel
```

```text
FBI_USERNAME=ton_identifiant
FBI_PASSWORD=ton_mot_de_passe
```

**Important** : cette tentative de connexion automatique est un "best
effort" — le formulaire réel de FBI n'a pas pu être inspecté à l'avance
(voir `docs/FBI_AUTHENTICATED_SPIKE.md`, statut *NOT TESTED*). Si elle
échoue, le script bascule automatiquement sur la connexion manuelle, sans
bloquer. `.env.fbi.local` reste optionnel — le mode manuel seul suffit
largement pour ce spike.

### Changer l'URL de base

```bash
npm run fbi:probe -- --base-url=https://extranet.ffbb.com/fbi/connexion.fbi
```

ou en le renseignant dans `.env.fbi.local` (`FBI_BASE_URL=...`).

## Sécurité — ce que cet outil ne fait jamais

- Il ne lit ni ne journalise jamais les en-têtes `Authorization`, `Cookie`,
  `Set-Cookie`, ni les tokens CSRF (voir `sanitize.ts`).
- Il ne journalise jamais la VALEUR d'un champ de formulaire — seulement son
  nom (ex: `nom`, `prenom`, jamais `Dupont`).
- Il ne journalise jamais la valeur des paramètres d'URL (`?nom=Dupont`
  devient `?nom=<redacted>` avant tout enregistrement).
- Il bloque par défaut toute requête `POST`/`PUT`/`PATCH`/`DELETE` qui n'est
  pas reconnue comme une action de lecture (login, recherche, export) — voir
  `network-recorder.ts`, fonction `decideAllow`. Les requêtes bloquées sont
  listées dans le rapport avec leur raison.
- Avant d'écrire le moindre rapport sur disque, `sanitize.ts` revérifie
  l'absence de motifs qui ressemblent à un email, un téléphone, une date de
  naissance ou un numéro long (licence...). Si un motif suspect est trouvé,
  **le rapport n'est pas écrit** et une erreur explicite s'affiche.
- Lance `npm run selftest` à tout moment pour vérifier que ces garde-fous
  fonctionnent toujours (`sanitize.selftest.ts`).

## Fichiers sensibles — jamais committés

Tout ce qui suit est gitignored (racine ET `.gitignore` local à ce dossier,
double sécurité) :

```text
spikes/fbi-auth/.env.fbi.local        identifiants (si utilisés)
spikes/fbi-auth/.local/               tout le reste :
  auth-state.json                       cookies de session
  report.json                           rapport brut
  report-sanitized.json                 rapport sanitisé (à transmettre)
  session-check.json                    résultat de fbi:check-session
  downloads/                            exports/PDF téléchargés
```

Avant de committer quoi que ce soit dans ce dossier, lance :

```bash
git status
```

et vérifie qu'aucun de ces fichiers/dossiers n'apparaît. Si l'un d'eux
apparaît malgré tout, **ne le commite pas** et vérifie le `.gitignore`
avant de continuer.

## Fichiers de ce dossier

| Fichier | Rôle |
|---|---|
| `probe.ts` | Point d'entrée : connexion (manuelle ou best-effort), capture réseau, écriture du rapport |
| `network-recorder.ts` | Capture structurelle du trafic + blocage par défaut des requêtes d'écriture |
| `sanitize.ts` | Garde-fous anti-fuite (jamais de secret/PII dans un rapport) |
| `sanitize.selftest.ts` | Auto-test de `sanitize.ts` (`npm run selftest`) |
| `report.ts` | Agrège `.local/report.json` en `.local/report-sanitized.json` |
| `clean.ts` | Supprime `.local/` |
| `inspect-export.ts` | Affiche les en-têtes de colonnes d'un export CSV téléchargé |
| `.env.fbi.example` | Modèle vide, à copier en `.env.fbi.local` (jamais committé) |
