# Matrice de tests — app iOS

Légende : ✅ vérifié ici (automatisé ou exécuté) · 🔶 vérifié partiellement · ❌ **non testé** (iPhone, Xcode ou compte Apple nécessaires).

Aucun test sur iPhone, aucune build Xcode, aucun envoi APNs réel ni TestFlight n'a été fait dans cet environnement.

## Automatisé

| Domaine | Où | État |
|---|---|---|
| Sessions d'appareil, PKCE, codes à usage unique, isolation entre clubs, `X-BM-As` | `club-manager-api/src/modules/device-auth/device-auth.test.ts` (18) | ✅ |
| « Lien perdu ? » garde la session de l'app ; `AUTH_LINK_CODES` | `public-tables/routes.test.ts` | ✅ |
| Push : jeton, destinataires, déduplication, révocations, réessais, expiration, déclencheurs, JWT ES256, payload | `src/modules/push/push.test.ts` (15) | ✅ |
| Générateur de liens (`links.ts`) | `src/links/links.test.ts` | ✅ |
| UniversalLinkRouter (domaines, normalisation, jeton retiré, code, routes techniques, anti-doublon) | `mobile/src/links/universal-link-router.test.ts` (9) | ✅ |
| Stockage de session, rappel SSO (`state`) | `mobile/src/auth/*.test.ts` | ✅ |
| Requête SSO côté web | `src/features/mobile-auth/sso-request.test.ts` | ✅ |
| AASA : 200, `application/json`, sans redirection | exécuté en local sur `www` | 🔶 (production et domaine nu à vérifier) |
| Écrans de l'app à 390 px (bienvenue, connexion, accueil) | capture navigateur | 🔶 (Chromium, pas WKWebView) |

## Sur iPhone (à faire, build signée)

| # | Scénario | Attendu | État |
|---|---|---|---|
| 1 | Premier lancement | Bienvenue, aucune demande de permission | ❌ |
| 2 | Choisir le club → « Recevoir un lien » → ouvrir l'email sur l'iPhone | L'app s'ouvre (Universal Link), connectée, sur la page du lien | ❌ |
| 3 | Lien de convocation reçu **sans** être connecté | Connexion, puis **arrivée sur la convocation** | ❌ |
| 4 | « Continuer avec Ball Manager » (déjà connecté dans Safari) | Feuille Safari, retour connecté ; annulation sans erreur | ❌ |
| 5 | Lien collé à la main | Même résultat que 2 | ❌ |
| 6 | Ajouter un enfant | Deux personnes, choix de la personne active | ❌ |
| 7 | Activer les notifications | Explication, puis invite iOS ; jeton enregistré (`device_push_tokens`) | ❌ |
| 8 | Coach envoie une convocation (web) | Notification sur l'iPhone ; un toucher ouvre `#convocation` | ❌ |
| 9 | Notification app fermée, en arrière-plan, au premier plan | Les trois ouvrent le bon écran | ❌ |
| 10 | Admin réinitialise le lien | L'app perd l'accès à la personne, plus de notification | ❌ |
| 11 | Se déconnecter | Retour à l'accueil, plus de notification | ❌ |
| 12 | Mode avion | Bandeau hors-ligne, pas d'écran blanc, réessai au retour | ❌ |
| 13 | Encoche, Dynamic Island, barre d'accueil, iPhone SE | Rien sous les zones système | ❌ |
| 14 | Texte agrandi (Réglages → Taille du texte) | Lisible, pas de chevauchement | ❌ |
| 15 | VoiceOver sur l'accueil et une convocation | Boutons nommés, ordre logique | ❌ |
| 16 | Lien espace club (`/c/…`) | S'ouvre dans Safari | ❌ |
| 17 | Lien d'un domaine étranger | Ignoré | ❌ |
| 18 | Mise en arrière-plan prolongée puis retour | Session conservée, données rafraîchies | ❌ |
| 19 | Réinstallation | Nouvelle connexion demandée (Keychain « ThisDeviceOnly ») ; ancien jeton push révoqué au premier envoi (`Unregistered`) | ❌ |
| 20 | TestFlight (jeton `production`) | Notification reçue via l'APNs de production | ❌ |

## Web, non-régression

| Point | État |
|---|---|
| Liens `?token=` inchangés (`AUTH_LINK_CODES` absent) | ✅ (tests API) |
| Build et tests SCSB | ✅ (voir le rapport final) |
| Pages `/confidentialite` et `/support` accessibles sans session | ✅ (`PUBLIC_PATHS`) |
