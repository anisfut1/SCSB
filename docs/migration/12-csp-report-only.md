# 12 — LOT-14 (partie CSP) : en-têtes de sécurité et Content-Security-Policy en **Report-Only**
_2026-10-07. Implémenté : `src/config/security-headers.ts` (module pur), `next.config.ts` (`headers()`), `src/config/security-headers.test.ts` (13 tests). **La CSP ne bloque rien.** Vérifié : build puis `next start` local, en-têtes présents sur `/login` et `/public/*` (`curl -I`). Non fait : R-008 (jeton public en `localStorage`), collecteur de rapports, passage en mode bloquant._

## 1. Ce qui est posé (toutes les routes)
| En-tête | Valeur | Mode |
|---|---|---|
| `Content-Security-Policy-Report-Only` | voir §2 | **observation seulement** (test : aucun en-tête `Content-Security-Policy` bloquant n'est posé) |
| `X-Content-Type-Options` | `nosniff` | appliqué |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | appliqué ; **déjà le défaut des navigateurs récents** (explicite pour R-014 : limite l'URL envoyée en `Referer` entre origines) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | appliqué ; aucun `getUserMedia`/`geolocation` dans `src/` (grep) |
Surcoût : **508 octets** d'en-têtes par réponse (mesuré sur la valeur servie, avec des origines factices).
**Volontairement absents** : `X-Frame-Options` (décision 2), `Strict-Transport-Security` (décision 3), COOP/COEP, `report-uri`/`report-to` (décision 4).

## 2. La politique (Report-Only) et ses sources, preuves à l'appui
```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
font-src 'self'; connect-src 'self' <origine Supabase> <origine API>; frame-src 'none'; object-src 'none';
base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```
| Directive | Sources et justification | Preuve |
|---|---|---|
| `script-src 'self' 'unsafe-inline'` (+ `'unsafe-eval'` en `next dev` seulement) | Next injecte des scripts inline d'hydratation ; aucun script tiers : aucun `<Script>`, `<script>` ni domaine externe dans `src/` (grep). Sans nonce (docs Next « Without Nonces ») | `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md:417-452` ; absence de `<Script` (grep) |
| `style-src 'self' 'unsafe-inline'` | attributs `style` React (positions du planning, couleur d'accent par club) et styles injectés | `VenuePlanning.tsx:91,98,109,152`, `app/page.tsx:68`, `DaySummary.tsx:57` |
| `font-src 'self'` | `next/font/google` **télécharge les polices au build et les sert depuis le site** : aucun appel à Google Fonts à l'exécution | `src/app/layout.tsx:3-26` (Geist, Geist Mono, Instrument Serif, Space Grotesk) |
| `img-src 'self' data: blob:` | `'self'` : icônes et `BrandMark` (`next/image`, image locale) ; `data:` : logo de club téléversé converti en data URL ; `blob:` : prévisualisation. **Logos distants volontairement non autorisés** (voir décision 1) | `BrandMark.tsx:1,11` ; `ClubAppearanceForm.tsx:19,50,105` ; `Logo.tsx:56-57` et `Avatar.tsx:11` (`<img src>` distants : « logos distants hétérogènes (FFBB/Storage) ») |
| `connect-src 'self' <Supabase> <API>` | origine de `NEXT_PUBLIC_SUPABASE_URL` (authentification navigateur) et de `NEXT_PUBLIC_CLUB_MANAGER_API_URL` (tous les appels API depuis le navigateur). Pas de `wss:` : aucun Realtime (`.channel(`/`WebSocket` absents) | `lib/supabase/browser.ts:11`, `lib/api/client.ts:47`, `lib/api/config.ts:8`, `config/env.public.ts:50-52` |
| `frame-src 'none'` | aucun iframe | grep `<iframe` négatif |
| `object-src 'none'`, `base-uri 'self'` | durcissement standard | — |
| `form-action 'self'` | les formulaires sont des Server Actions du même site | `src/server/actions/*.ts` |
| `frame-ancestors 'none'` | anti-clickjacking (**informatif** : les navigateurs peuvent ignorer cette directive en Report-Only — voir décision 2) | — |
**Navigations sortantes** (non régies par ces directives) : lien vers `extranet.ffbb.com` (`ImportLicenciesPanel.tsx:168`), téléchargements de documents e-Marque par URL signée.
**Non couvert** : le futur nouveau back — à ajouter en `connect-src` via `extraConnectOrigins` quand `NEXT_PUBLIC_NEW_API_URL` existera (LOT-02, ADR-005). Les **prévisualisations Vercel** généreront des violations liées à la barre d'outils Vercel : à ignorer.

## 3. Comment lire les résultats (sans collecteur)
Aucun `report-uri` n'est configuré : les violations n'apparaissent **que dans la console du navigateur**, préfixées `[Report Only]`. Procédure : DevTools → Console (niveau « Erreurs »), parcourir `/c/<club>/matchs`, `/c/<club>/resultats`, `/c/<club>/admin/settings` (logo), `/public/<club>/matchs`, `/login`, noter chaque `Refused to load the image 'https://<hôte>/…'`. **Résultat attendu** : des violations `img-src` pour les logos d'adversaires et de clubs (hôtes inconnus à ce jour) ; aucune pour scripts, polices, `connect-src` ni formulaires. Cette liste d'hôtes est la donnée dont la décision 1 a besoin.

## 4. Décisions qui vous reviennent (Q-021)
| # | Décision | Options | Recommandation |
|---|---|---|---|
| **1** | **Logos distants** (`Logo.tsx:57`, `Avatar.tsx:11`) : quels hôtes autoriser en `img-src` ? | (a) liste d'hôtes relevée via §3 ; (b) `https:` (large, peu protecteur : n'importe quel hôte) ; (c) proxy/stockage maison des logos (changement d'architecture) | **(a)** après relevé ; (b) seulement si la liste est instable. Aujourd'hui **aucune liste fiable dans le dépôt** (hôte du CDN des logos FFBB inconnu) |
| **2** | `X-Frame-Options: DENY` en mode **appliqué** ? (`frame-ancestors` en Report-Only n'est pas garanti d'être évalué) | oui / non | **Oui**, si vous confirmez que le front n'est intégré dans aucun iframe (non vérifiable depuis le dépôt) |
| **3** | `Strict-Transport-Security` | laisser à Vercel / le poser | **Laisser à Vercel** (vérifier avec `curl -I https://<domaine-du-front>` : l'en-tête doit être présent) |
| **4** | **Collecteur de rapports** ? | aucun (console seule) / Route Handler qui journalise des rapports **nettoyés** / service tiers | **Aucun pour l'instant.** Un rapport contient `document-uri`, donc la **query string**, donc un éventuel `?token=` (R-014). Si vous en voulez un : il doit **supprimer la query string avant toute écriture** |
| **5** | Passer en mode **bloquant** ? | nonce par requête dans `proxy.ts` (rendu dynamique, déjà le cas ; incompatible PPR) / `'unsafe-inline'` conservé (protection XSS faible) | Pas avant ≥ 7 jours de relevé sans violation inattendue (estimé) ; **viser le nonce**, pas `'unsafe-inline'` |
| 6 | `style-src 'unsafe-inline'` | conserver (attributs `style` omniprésents) / refondre | Conserver ; non bloquant pour la sécurité des scripts |

## 5. Restes de LOT-14 (non faits)
- **R-008** : jeton public en `localStorage` (`publicToken.ts:19-28`). Pistes : cookie `HttpOnly` posé par le back après échange (change l'architecture du lien), CSP bloquante avec nonce (réduit la surface XSS). Dépend du nouveau back (ADR-006).
- **R-014** : fragment `#token=` dans le lien d'e-mail (le serveur ne le reçoit pas) — modification de `club-manager-api` (ADR-007 §Conséquences de Q-017).
