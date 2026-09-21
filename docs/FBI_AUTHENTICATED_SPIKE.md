# Spike technique — FBI authentifié

> Statut : outil de diagnostic préparé. **Aucune exécution n'a pu être faite
> depuis cet environnement** (voir §2). À exécuter localement par toi, avec
> ton propre compte club — voir la procédure exacte en §4.

Ce document complète `docs/FFBB_ECOSYSTEM_RESEARCH.md` (spike public FFBB).
Ici, l'objectif est de déterminer ce que ton compte club FBI permet
réellement de récupérer, en te laissant naviguer toi-même pendant qu'un
outil local observe les métadonnées réseau.

## 1. Objectif

Déterminer, avec ton propre compte club FBI, si on peut récupérer
automatiquement — et sous quelle forme — : licenciés, équipes/engagements,
matchs, feuilles de marque, statistiques joueurs, et comment FBI gère les
dérogations. Strictement en lecture : aucune donnée n'est créée, modifiée ou
soumise pendant ce spike.

## 2. Pourquoi je n'ai rien pu tester moi-même

L'environnement où ce document et l'outil ont été écrits **bloque au niveau
réseau** tous les domaines `*.ffbb.com` (politique d'egress du sandbox,
identique au premier spike — voir `docs/FFBB_ECOSYSTEM_RESEARCH.md`, section
méthodologie). Je n'ai donc **aucune information de première main** sur :

- la forme actuelle du formulaire de connexion FBI,
- les écrans réellement affichés à un compte club après connexion,
- les données que ton compte peut voir.

**Rien de ce document ne prétend avoir observé une donnée FBI réelle.**
Chaque affirmation est étiquetée :

- **PREPARED** — le code existe et fait ce qui est décrit, mais n'a pas pu
  être exécuté contre le vrai FBI dans cet environnement.
- **OBSERVED** — obtenu par toi en exécutant l'outil localement (à
  compléter après ton exécution).
- **CONFIRMED** — recoupé avec une documentation officielle FFBB (voir le
  premier spike) ou confirmé par toi de façon répétée.
- **NOT TESTED** — non vérifié du tout, hypothèse ou fonctionnalité non
  exercée.

À ce stade, absolument tout ce qui concerne le contenu réel de FBI est
**NOT TESTED**. Ce document sera complété après ta première exécution.

## 3. Sécurité — comment les identifiants et la session sont protégés

- **Aucun mot de passe ni identifiant n'est demandé dans ce chat ni codé en
  dur nulle part.**
- Deux façons de t'authentifier, toutes deux locales :
  1. **Connexion manuelle** (recommandée) : une fenêtre Chromium s'ouvre, tu
     te connectes toi-même, le script ne voit jamais ton mot de passe.
  2. **Connexion automatique "best effort"** (facultative) : si tu places
     tes identifiants dans `spikes/fbi-auth/.env.fbi.local` (jamais
     committé), le script tente de remplir le formulaire détecté. **Statut :
     PREPARED, NOT TESTED** — le formulaire réel n'a pas pu être inspecté à
     l'avance. En cas d'échec, bascule automatique sur le mode manuel.
- La session (cookies) est sauvegardée uniquement dans
  `spikes/fbi-auth/.local/auth-state.json`, gitignored à la racine ET dans
  ce sous-dossier (double sécurité).
- Le trafic réseau n'est jamais journalisé en clair : ni en-têtes
  d'authentification (`Authorization`, `Cookie`, `Set-Cookie`, tokens CSRF),
  ni valeurs de formulaire (seulement leurs noms), ni valeurs de paramètres
  d'URL. Voir `spikes/fbi-auth/sanitize.ts` et son auto-test
  (`npm run selftest` dans ce dossier).
- Par défaut, **toute requête d'écriture est bloquée** (POST/PUT/PATCH/DELETE
  non reconnue comme une action de lecture) — voir
  `spikes/fbi-auth/network-recorder.ts`, fonction `decideAllow`. Aucune
  action de type "enregistrer", "valider", "supprimer" ne peut être exécutée
  via ce navigateur pendant que l'outil tourne.
- Avant d'écrire un rapport sur disque, une dernière vérification
  (`assertReportIsClean`) recherche des motifs qui ressembleraient à un
  email, un téléphone, une date de naissance ou un numéro long — si trouvé,
  **le rapport n'est pas écrit du tout**.

## 4. Procédure locale — commandes exactes à exécuter sur ton Mac

```bash
# Depuis la racine du repository, une seule fois :
npm run fbi:setup

# Lance l'exploration :
npm run fbi:probe
```

1. Chromium s'ouvre sur `https://extranet.ffbb.com/fbi`.
2. Connecte-toi toi-même dans la fenêtre.
3. Reviens dans le terminal, appuie sur **Entrée**.
4. Explore les écrans qui t'intéressent : Organismes, Licences,
   Compétitions, Engagements, Rencontres, Feuilles de marque, Dérogations,
   Exports Excel/CSV...
5. Reviens dans le terminal, appuie sur **Entrée** une seconde fois.
6. Un rapport local est généré : `spikes/fbi-auth/.local/report.json`.

Puis :

```bash
npm run fbi:report
```

génère `spikes/fbi-auth/.local/report-sanitized.json` — routes, méthodes,
statuts, types de contenu, compteurs, **rien de personnel**.

Détail complet des commandes (session, reset, inspection d'export...) :
[`spikes/fbi-auth/README.md`](../spikes/fbi-auth/README.md).

## 5. Ce que le probe va observer (PREPARED)

Pendant ta navigation, l'outil enregistre pour chaque requête HTTP :

- URL (valeurs des paramètres de requête retirées),
- méthode,
- statut de réponse,
- type de contenu (`Content-Type`),
- taille approximative,
- pour les requêtes non-GET : les NOMS des paramètres envoyés (jamais leurs
  valeurs),
- si bloquée par précaution : la raison du blocage.

Les téléchargements (export Excel/CSV, PDF de feuille de marque) sont
sauvegardés localement sous un nom générique
(`spikes/fbi-auth/.local/downloads/download-N.ext`), jamais sous leur nom
d'origine (qui pourrait, en théorie, contenir une donnée personnelle).

## 6. Résultat live

**NOT TESTED — À EXÉCUTER LOCALEMENT.**

Aucun appel n'a été fait contre le vrai FBI depuis cet environnement (réseau
bloqué, voir §2). Aucune donnée n'est inventée ici. Cette section sera
complétée avec le contenu de `report-sanitized.json` une fois que tu l'auras
généré et transmis (voir §8).

## 7. Grille d'observation à remplir après exécution

Une fois `report-sanitized.json` généré, voici ce qu'il permettra de
répondre (à compléter, PAS avant) :

| Question | Statut avant exécution |
|---|---|
| URL réelle du formulaire de connexion | NOT TESTED |
| Méthode et champs du formulaire de connexion | NOT TESTED |
| Présence d'un token CSRF | NOT TESTED |
| Écrans réellement accessibles au compte club | NOT TESTED |
| Recherche de licenciés : paramètres, pagination | NOT TESTED |
| Existence d'un export Excel/CSV des licenciés | NOT TESTED |
| Colonnes de cet export (si trouvé) | NOT TESTED |
| Identifiant interne FBI d'une rencontre | NOT TESTED |
| Rapprochement avec l'identifiant de l'API publique (`rencontres.id`/`uniqueKey`/`gsId`, voir le premier spike) | NOT TESTED |
| Accès à une feuille de marque (PDF ou autre format) | NOT TESTED |
| Donnée structurée derrière le PDF (JSON/XML avant génération) | NOT TESTED |
| Identification des OTM sur la feuille | NOT TESTED |
| Statistiques joueurs disponibles (voir tableau ci-dessous) | NOT TESTED |
| Écrans/URLs du module Dérogations | NOT TESTED |
| Durée de vie observée de la session | NOT TESTED |
| Faisabilité d'un client HTTP direct (sans navigateur) | NOT TESTED |

### Tableau statistiques (à remplir après exécution, ne pas déduire avant)

| Stat | Trouvée dans FBI ? | Format | Exploitable ? |
|---|---|---|---|
| Points | NOT TESTED | — | — |
| 2pts | NOT TESTED | — | — |
| 3pts | NOT TESTED | — | — |
| LF | NOT TESTED | — | — |
| Fautes | NOT TESTED | — | — |
| Temps de jeu | NOT TESTED | — | — |
| Rebonds | NOT TESTED | — | — |
| Passes | NOT TESTED | — | — |
| Interceptions | NOT TESTED | — | — |
| Tirs / positions | NOT TESTED | — | — |

## 8. Suite — que me transmettre après ton exécution

Transmets-moi le contenu de :

```text
spikes/fbi-auth/.local/report-sanitized.json
```

(copier-coller le contenu, ou envoyer le fichier). Il ne contient, par
construction, aucun cookie, token, mot de passe, nom de licencié, email,
téléphone, date de naissance ni numéro de licence réel — uniquement des
routes, méthodes, statuts, types de contenu et compteurs.

Si tu as observé des choses importantes que le rapport automatique ne
capture pas bien (ex : "le PDF contient bien les numéros de licence des
OTM", "l'export Excel a une colonne 'idLicence'"), décris-les-moi en texte
en utilisant le format demandé dans le brief d'origine :

```text
Licence: [REDACTED]
Nom: [REDACTED]
```

ou seulement des comptages ("154 licenciés trouvés"), jamais de vraie
donnée personnelle.

Je compléterai alors les sections 6 et 7 de ce document avec ce que tu
auras réellement observé (marqué **OBSERVED**, jamais **CONFIRMED** tant que
ce n'est pas recoupé par une documentation officielle ou plusieurs
observations).

## 9. Architecture du probe

```text
spikes/fbi-auth/
  probe.ts               point d'entrée (connexion, capture, rapport)
  network-recorder.ts     capture réseau + blocage des écritures par défaut
  sanitize.ts              garde-fous anti-fuite (fonctions pures)
  sanitize.selftest.ts      auto-test de sanitize.ts
  report.ts                 agrège report.json -> report-sanitized.json
  clean.ts                   supprime .local/
  inspect-export.ts           en-têtes d'un export CSV téléchargé
  .env.fbi.example             modèle vide (committé)
  .local/                       session, rapports, téléchargements (gitignored)
```

Package Node isolé (`spikes/fbi-auth/package.json`), séparé de l'application
(`playwright` n'est pas une dépendance de l'app — voir la racine du repo).

## 10. Procédure de suppression

```bash
npm run fbi:clean
```

Supprime tout `spikes/fbi-auth/.local/` (session, rapports, téléchargements).
À faire dès que tu n'as plus besoin de la session locale.

## 11. Ce qui n'est PAS fait dans ce spike (rappel)

- Pas de `FBIProvider` de production, pas de synchronisation licenciés,
  feuilles, OTM ou statistiques.
- Pas d'envoi de dérogation (observation uniquement, si ton compte en a une
  à consulter).
- Pas de stockage de mot de passe FBI en production.
- Pas de cron.
- Aucune écriture vers FBI (bloquée par défaut par l'outil lui-même, voir
  §3).
