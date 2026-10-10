# Ball Manager iOS — audit et décision d'architecture

Audit réalisé sur le code réel le 2026-10-10 :
- **ball-manager-web** : branche `claude/ios-app`, issue de `8fd9f52` ;
- **ball-manager-back** : branche `claude/ios-app`, issue de `8168a94`.

Aucune supposition non vérifiée : chaque point cite le fichier lu.

Environnement de ce travail : Linux, **sans Xcode, sans simulateur iOS, sans iPhone**. Tout ce qui demande une compilation iOS, un appareil ou un compte Apple Developer est listé comme **non testé** dans `docs/IOS_TEST_MATRIX.md`.

---

## 1. Architecture actuelle

### Frontend : ball-manager-web (Next.js 16.3.6, React 19, Vercel)

#### Deux espaces distincts

| Espace | Identité | Rendu |
|---|---|---|
| `/c/{clubSlug}/…` (club, comptes) | Compte Supabase Auth (cookie `@supabase/ssr`, `src/proxy.ts`) ; rôles `club_admin`, `coach`, `responsable_tables`… | Server Components qui chargent leurs données côté serveur (`src/lib/api/server.ts`, `src/lib/tenancy/club-context.ts`, `import "server-only"`) |
| `/public/{clubSlug}/…` (sans compte) | **Lien personnel** d'un licencié (jeton) | Pages serveur très fines (`getPublicClub` seulement) qui montent des composants **client** : `PublicHomeApp`, `PublicPlanningApp`, `PublicTeamPageApp`, `PublicTrainingsApp`, `PublicDerogationsApp`, `PublicRequestPages`, `PublicTablesApp`, `PublicLoginApp`. Ces composants appellent l'API depuis le navigateur. |

Toutes les fonctions métier existent dans l'espace public pour les licenciés qui ont un rôle posé depuis /joueurs :
- `public_coach` + `coached_team_ids` ;
- `public_admin` ;
- `public_coordinator`.

Fonctions concernées : entraînements, convocations, maillots, tables, dérogations (`src/features/team-life/*`, `src/features/public-*`).

#### Serveur Next indispensable (empêche un export statique)

- **Server Components** avec données serveur dans tout `/c/*` et dans `matchs`, `resultats`, `joueurs`, `tables/classement` publics.
- **Route Handlers** :
  - `/public/{slug}/session` : session publique, voir §3 ;
  - `/public/{slug}/manifest.webmanifest` ;
  - `/api/internal/*`.
- **`src/proxy.ts`** : rafraîchissement de la session Supabase et redirection `/login`.
- **`next/headers`** (cookies) dans `/public/{slug}/page.tsx`.
- Routes dynamiques par identifiant (matchs, dérogations…) sans liste finie : `output: "export"` imposerait `generateStaticParams` pour chaque match et chaque club. **Impossible.**

#### Le reste du front

- **Client API central** : `src/lib/api/client.ts` (`apiFetch`, délai de 20 s, `no-store`).
- **Transport du jeton public** : `src/lib/api/publicTokenTransport.ts` (`publicFetch`). Le jeton part par défaut dans la query `?token=`. Un mode en-tête `X-Personal-Link-Token` est prévu derrière `NEXT_PUBLIC_PUBLIC_TOKEN_HEADER=1`, mais **l'API ne lit pas encore cet en-tête et ne l'autorise pas en CORS** (`allowHeaders: ["Content-Type", "Authorization"]` dans `ball-manager-back/src/app.ts`).
- **PWA** (`src/lib/pwa`, `public/sw.js`, `offline.html`) : présente.
- **Web Push** (`src/lib/push/client.ts`, `docs/PWA_PUSH.md`) : préparé mais **inactif**. Pas de clé VAPID, pas d'endpoint, pas d'envoi.
- **En-têtes de sécurité** : `src/config/security-headers.ts`. On y trouve déjà `Referrer-Policy: strict-origin-when-cross-origin` ; la CSP est en Report-Only.

### Backend : ball-manager-back (Hono, Vercel, région dub1)

- **Comptes** : JWT Supabase vérifié (`src/auth/jwt.ts`, `src/auth/middleware.ts`), pour `/v1/clubs/{clubId}/…`.
- **Espace public** (`/v1/public/clubs/{slug}/…`) : identité = lien personnel.
  - Jeton haché SHA-256 dans `licencie_public_tokens.token_hash`, avec `revoked_at`. Le jeton est aussi chiffré (`token_ciphertext`) pour qu'un admin puisse réafficher le lien.
  - Résolution : `licencieFromToken()` (`src/modules/public-tables/routes.ts`).
  - Le jeton est lu à **5 endroits** :
    - `PublicTokenQueryDtoSchema` × 9 routes dans public-tables ;
    - `public-home/routes.ts` ;
    - `trainings/public-routes.ts` (`tokenCtx`) ;
    - `derogation-requests/public-routes.ts` ;
    - plus le corps `{ tokens: [...] }` des routes `POST …/team-life/action-center` et `POST …/team-life/planning` (plusieurs liens d'un même appareil).
- **Multi-tenancy** : `club_id` sur chaque table, RLS activée. L'espace public utilise le rôle service et c'est **le code** qui borne au club du slug (`resolvePublicClub`) et au licencié du jeton.
- **Emails** : Resend en HTTP direct (`src/email/resend.ts`). Le code ne pose **aucun réglage de suivi des clics**.
- **Crons** : Vercel (`vercel.json`, une fois par jour, plan Hobby) et GitHub Actions toutes les 15 min (`.github/workflows/fbi-frequent-sync.yml`) qui appellent `/internal/cron/*`.
- **Synchro FFBB** : `src/integrations/ffbb/sync.ts`. Les changements de match (date, salle, statut) sont détectés par `diffTrackedFields` et historisés dans `match_change_history`. C'est **le point d'accroche des notifications de changement de match**.
- **Notifications** : aucune notification native. Aucune table de jetons d'appareil.

---

## 2. Authentification actuelle (vérifiée)

### A. Comptes Supabase (espace club, admins avec compte)

- Invitation par email : `src/auth/account-invites.ts`. Le lien `…/bienvenue?token_hash=…&type=…&next=…` est un jeton OTP Supabase, à usage unique, consommé par `verifyOtp` côté ball-manager-web après action de l'utilisateur.
- Mot de passe, ou lien de réinitialisation.

### B. Lien personnel (espace public, sans compte), utilisé par les parents, joueurs, coachs et admins « par lien »

1. **Émission**
   - Par `issuePersonalLink()`, quand le licencié demande son lien par email : à chaque demande, **un nouveau jeton est émis et l'ancien révoqué**.
   - Par `revealOrIssueToken()`, quand un admin affiche le lien.
2. **Format de l'email** : `https://www.ball-manager.fr/public/{slug}/{accueil|tables|derogations|matchs}?token=…`. C'est une **query string**, donc visible dans les journaux d'accès du serveur web à la première requête.
3. **Côté navigateur** (`src/lib/publicToken.ts`) :
   - `consumePublicTokenFromUrl()` lit `#token=` (prioritaire) ou `?token=` puis **retire immédiatement le jeton de l'URL** (`history.replaceState`).
   - Le jeton est revalidé par `GET …/me`.
4. **Persistance web** (`src/app/public/[clubSlug]/session/route.ts`) : cookie `bm_session` `HttpOnly`, `Secure`, `SameSite=Lax`.
   - Il est chiffré en AES-256-GCM, limité au chemin du club, valable 90 jours glissants avec un plafond de 365 jours.
   - Il contient les **jetons personnels eux-mêmes**.
   - Si `SESSION_SECRET` n'est pas configuré, le front retombe sur `localStorage`.
5. **Appels API** : le jeton personnel est envoyé à **chaque appel**, en `?token=`.

### Conséquences pour l'app iOS

- Le jeton personnel est **permanent** : il dure jusqu'à la révocation ou au prochain « lien perdu ? ».
- Il ne doit pas devenir la session de l'app. Il servira **uniquement de preuve d'amorçage**, échangée une fois côté serveur.
- Les comptes Supabase ne concernent que les responsables qui gèrent depuis `/c/*`. Parents et joueurs n'en ont pas. **L'identité qui compte pour l'app est le licencié du lien personnel.**

---

## 3. Types de liens envoyés aujourd'hui (tous vérifiés)

| Lien | Généré par | Format | Sensible |
|---|---|---|---|
| Lien personnel (email « ton lien ») | `issuePersonalLink` (`public-tables/routes.ts`), `personalLinkUrl` (`personal-link.ts`), réaffichage admin (ball-manager-web) | `/public/{slug}/{cible}?token=…` | **Oui** (jeton permanent) |
| Invitation de compte | `account-invites.ts` → `welcomeLink` | `/bienvenue?token_hash=…` (OTP Supabase, usage unique) | Oui (usage unique) |
| Demande de dérogation (au coordinateur) | `derogation-requests/notify.ts` | `/public/{slug}/derogations/{requestId}` | Non (identification requise) |
| Digest des dérogations FBI | `notify.ts` | `/public/{slug}/derogations` | Non |
| Demande d'accès / d'adresse différente (aux admins) | `account-emails.ts` (`buildAccessRequestEmail`, `buildClaimRequestEmail`) | liens vers l'espace club | Non |

**Les convocations ne sont envoyées par aucun canal externe aujourd'hui.** Elles sont visibles dans l'application seulement (`docs/TEAM_LIFE.md`, Lot 2). Il n'existe donc pas encore d'« email de convocation » : dans l'app, ce sera la notification push qui portera la convocation (§28-35 de la demande).

Base des URL : `PUBLIC_APP_URL`, sinon `FRONTEND_ORIGINS`. Elle est dupliquée dans `resolvePublicAppBaseUrl` et `appBaseUrl`. **Aucun service central** : les chemins sont reconstruits à la main dans 4 fichiers.

---

## 4. Risques identifiés

1. **Jeton permanent dans les URL d'API** (`?token=`) : il apparaît dans les journaux d'accès de l'API et du proxy. Le mode en-tête existe côté front mais pas côté API.
2. **Jeton permanent dans les emails** : un email transféré donne l'accès. Pas d'expiration ni d'usage unique.
3. **Rotation du lien à chaque « lien perdu ? »** : si l'app reposait sur le jeton, toute nouvelle demande déconnecterait l'app. La session de l'app doit donc survivre à une rotation demandée par le **même** propriétaire (même adresse), mais tomber sur une **réinitialisation par un admin**.
4. **Préchargement des liens par les scanners d'emails** : aujourd'hui, ouvrir un lien ne modifie rien (le jeton est seulement lu). À préserver : aucun nouveau GET ne doit consommer un code.
5. **URL reconstruites à la main** à plusieurs endroits : risque d'incohérence entre web, app et emails.
6. **CORS de l'API** : l'app Capacitor a l'origine `capacitor://localhost`, qui n'est pas autorisée aujourd'hui.
7. **Mineurs** : toutes les règles « un parent ne voit que son enfant » sont dans le code API. L'app doit passer par les **mêmes** routes et ne jamais élargir les données.

---

## 5. Stratégie mobile : décision (gate §3)

### Option A pure : Next exporté dans Capacitor — **rejetée**

`output: "export"` est incompatible avec :
- les Server Components à données serveur ;
- les Route Handlers ;
- `proxy.ts` ;
- les routes dynamiques sans liste finie.

Il faudrait réécrire tout le front, avec un risque fort de casser le web en production.

### Option C : `server.url` vers ball-manager.fr — **développement uniquement**

C'est un site reconditionné, contraire à l'esprit de la règle 4.2. Les cookies sont isolés entre Safari et WKWebView, et l'app ne fonctionne pas hors ligne. Gardé seulement comme `CAP_SERVER_URL` pour le live reload en développement.

### Option retenue : B, embarqué et partagé (« A′ »)

Un **bundle local** construit par Vite dans `mobile/`, **qui importe directement le code de `src/`**. Pas de copie : alias `@/` vers `../src`.

| Partagé tel quel | Propre au mobile (petit) |
|---|---|
| Composants UI (`src/components/ui/*`) et tokens du design system (`globals.css`, Tailwind v4) | Coquille de navigation (react-router), écrans de connexion et de compte |
| Écrans métier client : `ActionCenter`, `PublicHomeApp`, `PlanningView`, `TeamPageView`, `MatchTeamLifePanel`, `ConvocationSheet`, `PublicDerogationsApp`, `PublicRequestPages`, `PublicTablesApp`, vues de match et de résultats | Pages « conteneurs » qui chargent les données côté client (les pages serveur Next ne sont pas embarquées) |
| Client API (`apiFetch`, `publicFetch`) et types OpenAPI générés | Transport : la session de l'app remplace le jeton (§6) |
| Règles d'affichage par rôle (déjà calculées par l'API) | `UniversalLinkRouter`, Keychain, push |

Adaptateurs (shims) :
- `next/link` et `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`, `notFound`) branchés sur react-router ;
- `next/image` remplacé par une simple balise `img`.

**Même espace d'URL que le web** : l'app route `/public/{slug}/matchs/{id}`, etc. Une URL web, un lien email, un Universal Link ou un push mènent donc à **la même ressource** sans table de correspondance.

#### Périmètre de l'app V1

Elle couvre l'espace **public / lien personnel**, c'est-à-dire tout ce que font parents, joueurs, coachs et admins « par lien » :
- accueil (centre d'actions) ;
- planning, équipe, match (disponibilités, convocation, maillots) ;
- entraînements (coach) ;
- dérogations ;
- tables.

L'espace `/c/*` (compte Supabase, administration lourde : synchro FBI, imports…) **reste sur le web**. Les liens `/c/*` s'ouvrent dans Safari.

Raison : c'est un usage poste de travail, et il exigerait un second système de session dans l'app. Contraire à la règle « une seule identité » (§11).

---

## 6. Identité unique : du lien personnel à la session d'appareil

Il n'y a pas de nouveau système d'identité. L'identité reste **le licencié du lien personnel**. On ajoute **une seule** notion côté API : la **session d'appareil**.

```
Lien personnel (email, admin)  ──►  POST /v1/mobile/auth/…  ──►  session d'appareil
     (jeton permanent,                (échange, preuve          (secret aléatoire, haché en base,
      jamais stocké par l'app)          vérifiée)                 révocable, glissant, multi-licenciés)
```

### Les tables

- **`device_sessions`** : `id`, `club_id`, `secret_hash` (SHA-256), `platform` (`ios` | `web`), `app_version`, `device_label`, `created_at`, `last_used_at`, `expires_at` (180 jours glissants), `revoked_at`.
- **`device_session_grants`** : `session_id`, `licencie_id`, `token_id`.
  - Le droit est **adossé au lien personnel**. Si un admin réinitialise ce lien, l'app perd l'accès, comme le web aujourd'hui.
  - Une rotation « lien perdu ? » vers la **même adresse** déplace les droits vers le nouveau jeton, sans déconnecter l'app.

### L'API

- `licencieFromToken` devient `licencieFromCredential`. Elle accepte soit le jeton (web, inchangé), soit `Authorization: Bearer bmd_<secret>` avec `X-BM-As: <licencieId>` (licencié actif parmi ceux de la session).
- `action-center` et `planning` utilisent alors les droits de la session au lieu du corps `tokens`.
- **Toutes les autres routes et règles de droits restent identiques.** C'est le même code qui décide.

### Le stockage dans l'app

Le secret de session est rangé dans le **Keychain** iOS : petit plugin Swift local, attribut `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`. Jamais dans `localStorage`, jamais dans les journaux.

### Les codes d'autorisation : `auth_codes`

Courts, à usage unique, avec expiration ; le hash du code est stocké, avec PKCE S256 et `state`. Ils servent à :
- **la connexion depuis Safari (§12)** : ASWebAuthenticationSession ouvre `…/auth/app` ; la page web, qui a déjà la session `bm_session`, fait confirmer, puis l'API émet un code lié au `code_challenge` ; le rappel `fr.ballmanager.app://auth/callback?code&state` arrive dans l'app, qui échange `code + code_verifier` contre une session d'appareil ;
- **les nouveaux liens de connexion par email (§8)** : `/open/login/{code}` sur le web. Le GET affiche une page et ne consomme rien ; le bouton « Continuer » fait un POST qui échange le code. Activable par `AUTH_LINK_CODES=1` ; par défaut, les liens actuels restent inchangés ;
- les **anciens liens** `?token=` et `#token=` restent valables : l'app les échange (§7), le web les lit comme aujourd'hui.

### Migration web, sans casse

Ce qui existe déjà :
- jeton retiré de l'URL dès la lecture ;
- cookie `HttpOnly` chiffré ;
- `Referrer-Policy` posée.

Ce que fait cette branche :
- l'API **accepte l'en-tête `X-Personal-Link-Token`** et l'autorise en CORS. Après déploiement, il suffit d'activer `NEXT_PUBLIC_PUBLIC_TOKEN_HEADER=1` pour que le jeton **sorte de toutes les URL d'API** et donc des journaux.

Étape suivante, documentée et non activée : stocker dans `bm_session` une session d'appareil `platform=web` au lieu des jetons eux-mêmes.

---

## 7. Liens, Universal Links et `open.ball-manager.fr`

- **`BallManagerLinkService`** (API, `src/links/`) : la seule source des URL métier. Elle sert `clubHome`, `match`, `convocation`, `training`, `derogation`, `team`, `planning`, `loginCode` et `personalLink` (compatibilité). Tous les emails existants y sont migrés.
- **Domaines** :
  - `applinks:www.ball-manager.fr` et `applinks:ball-manager.fr` ;
  - `open.ball-manager.fr` est **préparé mais pas activé** : à valider sur iPhone (§15, §58). Il demande en plus un domaine Vercel et un fichier AASA.
- **AASA** : servi par ball-manager-web en route dynamique (`/.well-known/apple-app-site-association`, JSON, sans redirection). Le Team ID est lu dans `APPLE_TEAM_ID`. **Tant qu'il est absent, la route répond 404** : aucune valeur Apple fictive n'est publiée.
- **Chemins capturés** : `/public/*`, `/open/*`. Sont **exclus** : `/c/*`, `/platform/*`, `/login`, `/bienvenue`, `/api/*`, `/auth/*` et `/public/*/session`.

---

## 8. Push

- **APNs en direct** depuis ball-manager-back : HTTP/2 natif de Node et JWT ES256 signé avec la clé `.p8`. Pas de OneSignal, pas de Firebase.
- **Tables** :
  - `device_push_tokens`, rattachée à la **session d'appareil** et non à un compte, puisque parents et joueurs n'ont pas de compte. Un jeton par appareil, quel que soit le nombre de clubs ou d'enfants.
  - `notification_outbox` : déduplication, nouvelles tentatives, statut, erreurs APNs.
- **Destination** = une URL logique (`BallManagerLinkService`), traitée par le **même** `UniversalLinkRouter` que les liens email.
- Les droits sont **revérifiés à l'envoi** (licencié de l'équipe, session non révoquée) et à l'ouverture (l'API reste la source de vérité).

---

## 9. Ce que cette branche ne touche pas

- Aucune configuration de production n'est modifiée : Vercel, DNS et Resend restent dans `MANUAL_APPLE_STEPS.md` et `docs/IOS_SECURITY.md`.
- **Comportement par défaut inchangé** :
  - les emails gardent leur format tant que `AUTH_LINK_CODES` n'est pas activé ;
  - l'AASA répond 404 sans `APPLE_TEAM_ID` ;
  - le push reste inactif sans les variables `APNS_*` ;
  - le Smart App Banner reste masqué sans `NEXT_PUBLIC_APP_STORE_ID`.
- Les migrations SQL sont **additives** (nouvelles tables, RLS activée sans policy).
