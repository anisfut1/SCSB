# Étapes manuelles : jusqu'à TestFlight, puis l'App Store

Ce fichier ne liste **que** ce qui ne peut pas être fait depuis le code. Valeurs de référence :
- Team ID : `YFZ72KY47V`
- Bundle ID : `fr.ballmanager.app`

Ne jamais coller de clé ni de lien personnel dans le dépôt ou dans le chat.

## A. Avant la première build

1. **Fusionner et déployer** les branches `claude/ios-app` :
   - `club-manager-api` sur Vercel ;
   - `SCSB` sur Vercel.

   Les migrations `device_sessions` et `push_notifications` sont **déjà appliquées** sur la base.
2. **Vérifier l'AASA en production.** `https://www.ball-manager.fr/.well-known/apple-app-site-association` doit répondre **200**, en `application/json`, **sans redirection**.
3. **Le domaine nu.** `https://ball-manager.fr/.well-known/apple-app-site-association` doit répondre de la même façon. Il s'agit souvent d'une redirection vers `www`, et Apple ne suit **pas** les redirections. Deux possibilités :
   - le servir sans redirection (réglage du domaine dans Vercel) ;
   - ou me demander de retirer `applinks:ball-manager.fr` des entitlements.
4. **Resend** : désactiver le suivi des clics (Domains → votre domaine → Click tracking : off). Sinon, les liens des emails n'ouvrent pas l'app.
5. **Icône** : fournir une icône **1024 × 1024 PNG, sans transparence ni coins arrondis**. L'actuelle est un agrandissement provisoire de l'icône 512 du site.
6. **Adresse de support** : définir `NEXT_PUBLIC_SUPPORT_EMAIL` (SCSB, Vercel) avec une boîte réellement lue. Elle est affichée sur `/confidentialite` et `/support`.
7. **Pages légales** : faire relire `/confidentialite` (titulaire, contact, durées), puis renseigner le titulaire du copyright.

## B. Compte Apple Developer

8. **Clé APNs** : Certificates, Identifiers & Profiles → **Keys** → « + » → cocher *Apple Push Notifications service (APNs)* → télécharger le `.p8`. Il n'est téléchargeable qu'une seule fois : le conserver en lieu sûr.
9. **Variables Vercel** de `club-manager-api`, à saisir vous-même :
   - `APNS_TEAM_ID` = `YFZ72KY47V` ;
   - `APNS_KEY_ID` = l'identifiant de la clé ;
   - `APNS_PRIVATE_KEY` = le contenu du `.p8`.

   Redéployez ensuite.
10. **App ID** : l'inscription automatique d'Xcode suffit en général. Sinon, Identifiers → `fr.ballmanager.app` avec les capacités **Push Notifications** et **Associated Domains**.

## C. Build sur un Mac (Xcode récent)

11. Depuis `SCSB/mobile` :

    ```sh
    npm install
    BM_API_URL=<URL de club-manager-api> npm run ios:sync
    npm run ios:open
    ```

    `BM_API_URL` prend la même valeur que `NEXT_PUBLIC_CLUB_MANAGER_API_URL`. Pour une build Debug branchée à l'iPhone, utilisez `ios:sync:debug`, qui produit des jetons push de type sandbox.
12. Dans Xcode, cible *App* → **Signing & Capabilities** :
    - Team `YFZ72KY47V`, signature automatique ;
    - vérifier que **Push Notifications** et **Associated Domains** apparaissent.

    Puis **lancer sur un iPhone réel**. C'est **la première compilation réelle** du projet : signalez-moi toute erreur Swift ou de signature.
13. Dérouler la partie « Sur iPhone » de `docs/IOS_TEST_MATRIX.md`.

## D. TestFlight

14. **App Store Connect** → Apps → « + » : créer l'app avec la plateforme iOS, le nom « Ball Manager », la langue Français, le Bundle ID `fr.ballmanager.app` et un SKU libre.
15. Dans Xcode :
    - Product → **Archive** → Distribute App → App Store Connect → Upload ;
    - incrémenter le *Build* à chaque envoi.
16. **TestFlight** :
    - remplir « Informations sur l'export » (pas de chiffrement non exempté, déjà déclaré dans `Info.plist`) ;
    - ajouter les testeurs internes ;
    - refaire les tests 7 à 11 et 20 de la matrice (push en environnement **production**).

## E. Publication sur l'App Store

17. **Club de démonstration** :
    - appliquer `club-manager-api/supabase/seed/demo_review_club.sql` (SQL Editor) ;
    - suivre la procédure en tête du fichier pour obtenir le lien de « Camille DEMO » ;
    - tester ce lien dans l'app.
18. **Fiche App Store** : reprendre `docs/APP_STORE.md` (description, mots-clés, catégorie, âge, URLs, questionnaire « Confidentialité de l'app », suivi : **Non**).
19. **Captures** en 6,9 pouces, sur le club de démo : liste dans `docs/APP_STORE.md`.
20. **Notes pour la revue** : le modèle est dans `docs/APP_STORE.md`. Y coller le lien de démo. Préciser qu'il n'y a **pas de création de compte**, donc pas de suppression de compte dans l'app.
21. Soumettre pour la revue.
22. Après publication : définir `NEXT_PUBLIC_APP_STORE_ID` (SCSB, Vercel) avec l'identifiant numérique de l'app. Cela active la bannière Safari.
