# ADR-008 — Émission du jeton personnel à l'approbation d'une revendication (LOT-02b)
- **Date** : 2026-10-08
- **Statut** : **Proposée** (aucune implémentation ; décision du propriétaire attendue, nouvelle question Q-025)

## Contexte
- Le LOT-02b (R-018, `11` §7.9) fait approuver par un `club_admin` une demande de revendication ; l'approbation doit **émettre le lien personnel** et l'envoyer **une seule fois, à l'adresse saisie**.
- Le back n'écrit que dans `api2` (ADR-003, révision ORM) ; la table des jetons appartient à `club-manager-api` (son nom et ses colonnes sont une **hypothèse**, `11` §9). Qui émet le jeton ?
- Invariant production : `club-manager-api` sert la production et ne doit pas être modifié sans accord ; aucun service n'est débranché avant que son remplaçant soit vérifié.

## Endpoints existants qui émettent ou envoient un lien personnel (lus dans le front)
Le code de `club-manager-api` n'a **pas** été lu : ce qui suit vient du schéma OpenAPI généré et des appels du front.
| Endpoint | Source | Droits | Ce qu'il fait d'après le DTO / le commentaire |
|---|---|---|---|
| `POST /v1/clubs/{clubId}/table-assignments/public-access/{licencieId}/link` | `src/lib/api/generated/schema.ts:2450-2500` ; appel `src/lib/api/tables.ts:145-150`, utilisé par `src/features/licencies/LicenciePublicAccessCard.tsx:235` (via `factory.ts:115`) | JWT, **`club_admin`** (commentaire `tables.ts:146`) | « Réaffiche le lien ACTIF (inchangé) ou en émet un s'il n'en a pas » ; renvoie `PersonalLinkDto { link: uri, created: boolean }` (`schema.ts:7687-7691`). **Ne l'envoie pas par e-mail** : il retourne le lien à l'admin. Idempotent d'après le commentaire (non vérifié côté serveur) |
| `POST /v1/clubs/{clubId}/table-assignments/public-access/{licencieId}/reset` | `tables.ts:133-139` | JWT, `club_admin` (`tables.ts:122-125`) | Révoque le jeton actif ; le nom redevient « choisissable » |
| `POST /v1/public/clubs/{clubSlug}/licencies/{licencieId}/request-link` | `schema.ts:2610-2690` ; `src/lib/api/publicTables.ts:64-65` ; `IdentifyView.tsx:105` | **anonyme** | Envoie le lien **par e-mail** (adresse masquée en retour, `RequestPersonalLinkResultDto`, `schema.ts:7709-7713`) ; `EMAIL_REQUIRED` (400), `ALREADY_CLAIMED` (409), `LINK_RECENTLY_SENT` (429), `EMAIL_SEND_FAILED` (502), `EMAIL_NOT_CONFIGURED` ; c'est le point d'entrée de **R-018** |
| `POST /v1/clubs/{clubId}/members` | `schema.ts:6892…`, `InviteMemberDto` `schema.ts:8275-8279` | JWT, admin de club | Invite un **compte** (e-mail + rôles) : c'est une invitation Supabase Auth, **pas** un lien personnel public ; hors sujet |
Non établi (code non lu) : si `/link` refuse ou accepte les fiches à rôle d'écriture, s'il enregistre une adresse sur la fiche, la durée de vie et le hachage des jetons, et le fournisseur d'e-mail utilisé par `request-link`.

## Options étudiées
**(a)** Après approbation dans le nouveau back, le **front admin** appelle l'endpoint existant `…/public-access/{licencieId}/link` avec la session de l'admin.
**(b)** Le **nouveau back** appelle `club-manager-api` de service à service. Deux variantes : **(b1)** identifiant de service dédié (nouvelle capacité à créer côté `club-manager-api`) ; **(b2)** le back **transmet le jeton d'accès de l'admin** qu'il vient de valider (même endpoint `/link`, mêmes droits `club_admin`, aucun secret de service).
**(c)** Le nouveau back **écrit dans la table des jetons** de `club-manager-api`.

| Critère | (a) front admin → `/link` | (b1) service → service | (b2) JWT de l'admin transmis | (c) écriture directe |
|---|---|---|---|---|
| Qui détient quel droit | L'admin avec son propre JWT ; rien de nouveau | Le back détient un **secret de service** capable d'émettre n'importe quel jeton (cible de choix pour un attaquant) | L'admin, ré-appliqué par `club-manager-api` (`club_admin`) ; le back ne détient aucun droit propre | Le back détient un droit d'**écriture sur une table d'autrui** : contraire à ADR-003 ; contourne les règles de `club-manager-api` |
| Qui envoie l'e-mail à l'adresse saisie ? | **Personne** : `/link` ne fait que renvoyer le lien. Il faut soit que l'admin le transmette lui-même (hors application), soit renvoyer le lien au back pour qu'il l'envoie (le jeton transite alors par le navigateur **puis** le back) | Le back (adresse saisie, une seule fois) | Le back (idem) | Le back |
| Atomicité / reprise | Deux appels depuis un navigateur : une demande peut être « approuvée » sans lien émis ; reprise manuelle | Orchestration côté back (états `approving` → `approved`), rejouable car `/link` réaffiche le lien actif | Idem (b1) | Transaction locale possible mais sur une base partagée |
| Cohérence S3 et invariant production | **Excellente** : aucune modification de `club-manager-api`, déployable dès le LOT-02b | Exige un changement de `club-manager-api` (authentification de service) : **à demander**, retard, risque | **Aucun changement** de `club-manager-api` si `/link` accepte le jeton d'un admin appelé depuis un autre hôte (CORS non concerné : appel serveur) ; **à vérifier** | Exige un changement de **propriétaire** de la table : incompatible avec S3 tant que `club-manager-api` écrit dedans |
| Évolution vers S2 (le back remplace `club-manager-api`) | L'appel front devient un appel interne | Devient un appel local | Devient un appel local | Déjà local, mais dette de schéma partagé pendant S3 |
| Exposition du jeton | Navigateur de l'admin (+ back si on lui renvoie le lien) | Mémoire du back, jamais persistée | Mémoire du back, jamais persistée ni journalisée | Écrit/haché par le back : duplique la logique de génération et de hachage de `club-manager-api` (risque de divergence) |
| Testabilité | Contrat côté front (faux serveur) ; le back ne teste que l'approbation | Faux client HTTP dans le back (port `LinkIssuer`) ; test de contrat à écrire face à `club-manager-api` | Idem ; test supplémentaire : le jeton transmis n'est ni journalisé ni renvoyé | Tests d'intégration sur le schéma partagé réel ; fragile |
| Risques propres | Le jeton passe par le front ; l'e-mail à l'adresse saisie reste à faire | Gestion, rotation et fuite du secret de service ; couplage de disponibilité | Transmission d'un JWT utilisateur entre services (rejeu si journalisé ; durée de vie du jeton d'accès) ; échec si `club-manager-api` refuse un appelant autre que le front | Corruption des jetons, double écrivain |

## Recommandation (proposée)
**(b2)** : l'approbation (`POST …/claim-requests/{id}/approve`) vérifie le rôle de l'admin et de la fiche, puis le back **appelle l'endpoint existant `/link` en transmettant le jeton d'accès de cet admin**, reçoit le lien, **l'envoie une seule fois à l'adresse saisie** et ne le conserve ni ne le journalise ni ne le renvoie dans aucune réponse.
- Motifs : aucun droit nouveau (les droits `club_admin` sont ré-appliqués par le propriétaire de la table), aucun changement de `club-manager-api` ni secret de service, l'idempotence annoncée de `/link` rend l'approbation rejouable, et le passage à S2 ne change que l'adresse de l'appel.
- Sur (a) : seule option qui n'envoie rien ; elle déplace l'e-mail dans le navigateur ou dans une procédure manuelle, donc ne satisfait pas « envoyé une seule fois à l'adresse saisie ».
- Sur (c) : écartée (changement de propriétaire de la table, double écrivain).
- Sur (b1) : à envisager seulement si (b2) est refusé par `club-manager-api` ; elle ajoute un secret à forte valeur.
- **Repli sûr tant que (b2) n'est pas vérifié** : l'approbation passe la demande à `approved` sans envoi, et le front admin affiche le lien obtenu via `/link` (comportement (a)) ; l'envoi par e-mail est alors reporté. Aucun jeton n'est jamais stocké dans `api2`.

## À vérifier avant implémentation (aucun accès à `club-manager-api` à cette étape)
1. `/link` accepte-t-il un appel serveur-à-serveur avec le jeton d'accès de l'admin (pas de contrainte d'origine ni d'empreinte de session) ? Durée de vie du jeton d'accès Supabase face à une approbation en deux temps.
2. `/link` est-il réellement idempotent (même lien tant qu'il est actif) ? Que fait-il pour une fiche **sans adresse** ou à **rôle d'écriture** ?
3. Le lien renvoyé contient-il le jeton en fragment (`#token=`, Q-023) ou en query ?
4. Le fournisseur d'e-mail du nouveau back (non choisi ; appel HTTP via `httpx`, aucun SDK).
5. Tests de contrat à ajouter au LOT-02b : le port `LinkIssuer` est simulé ; aucun jeton dans une réponse, un journal ni `api2` ; un échec de `/link` laisse la demande `pending` et n'envoie rien.

## Conséquences
- (+) R-018 se ferme sans toucher la production de `club-manager-api`.
- (−) Dépendance de disponibilité et de contrat envers `/link` (endpoint non documenté pour cet usage) ; le jeton d'accès de l'admin transite entre services (à ne jamais journaliser).
- À surveiller : toute évolution de `/link` ; la fermeture de l'ancien `request-link` public (`11` §7.7), nécessaire pour que R-018 soit réellement résolu.
