# Publication App Store — Ball Manager

Bundle ID `fr.ballmanager.app`, Team ID `YFZ72KY47V`. Les étapes à faire à la main sont dans `MANUAL_APPLE_STEPS.md`.

## Fiche (proposition à relire)

| Champ | Valeur |
|---|---|
| Nom | Ball Manager |
| Sous-titre (30 car.) | Convocations et vie du club |
| Catégorie | Sports (secondaire : Productivité) |
| Âge | 4+ (aucun contenu généré public, pas de chat ouvert, pas de web libre) |
| Prix | Gratuit, sans achat intégré |
| URL de confidentialité | `https://www.ball-manager.fr/confidentialite` |
| URL d'assistance | `https://www.ball-manager.fr/support` |
| Copyright | à renseigner (titulaire réel) |

**Description (proposition)**

> L'app officielle des clubs de basket qui utilisent Ball Manager. Convocations, disponibilités, entraînements, matchs et résultats de ton équipe, au même endroit.
>
> • Reçois ta convocation et confirme ta présence en un geste.
> • Réponds aux entraînements : présent, absent ou incertain.
> • Suis les changements de match (horaire, salle, report) dès qu'ils sont connus.
> • Un seul iPhone pour toute la famille : ajoute chaque enfant.
> • Coachs : demandes de disponibilités, convocations et relances depuis le téléphone.
>
> Accès réservé aux licenciés des clubs Ball Manager : ton club t'envoie ton lien de connexion par email.

Mots-clés (100 car.) : `basket,club,convocation,entraînement,match,FFBB,équipe,coach,licencié,planning`

## Revue Apple (Guideline 4.2, conception minimale)

À joindre en note. Fonctions natives réelles, et pas un simple site encapsulé :

- **Bundle local**. L'app n'ouvre aucun site distant : l'interface est embarquée, et seules les données passent par l'API.
- **Notifications push** (APNs) pour les convocations, les changements de match et d'entraînement et les dérogations, avec ouverture directe de l'écran concerné.
- **Universal Links** : les liens reçus par email ou message ouvrent l'écran exact dans l'app.
- **Connexion depuis Safari** (ASWebAuthenticationSession avec PKCE) quand on est déjà connecté sur le site.
- **Session dans le trousseau iOS**, propre à l'appareil.
- **Plusieurs enfants et plusieurs clubs** sur un même iPhone.
- **Gestion hors-ligne** (bandeau, réessai) et **zones sûres** (encoche, barre d'accueil).

**Note de connexion (modèle à compléter)**

> Ball Manager n'a pas de création de compte : chaque club envoie un lien de connexion personnel par email à ses licenciés. Pour la revue, nous avons créé un club de démonstration aux données fictives.
>
> 1. Ouvrez l'app, puis touchez « J'ai reçu un lien Ball Manager ».
> 2. Collez ce lien : `<LIEN DE DÉMO — à coller ici, jamais dans le dépôt>`.
> 3. Vous êtes connecté en tant que « Camille DEMO » (U13 Démo) : accueil, matchs, entraînements.
>
> Les notifications se testent depuis Mon compte → Activer les notifications.

Club de démonstration : `ball-manager-back/supabase/seed/demo_review_club.sql`. Il est **préparé et non appliqué**. La procédure se trouve en tête du fichier.

## Suppression de compte (Guideline 5.1.1(v))

**Non applicable.** L'app ne permet **aucune** création de compte : pas d'inscription, pas de mot de passe, pas de Sign in with Apple. L'accès se fait par un lien émis par le club pour un licencié qu'il a déjà enregistré.

L'app propose :
- « Se déconnecter », qui révoque la session de l'appareil et ses notifications ;
- la page Confidentialité, qui explique comment demander la suppression des données au club.

À rappeler en note de revue si Apple pose la question.

## Confidentialité de l'app (questionnaire App Store Connect)

Il correspond à `mobile/ios/App/App/PrivacyInfo.xcprivacy`. **Suivi : Non.**

| Type de données | Collecté | Lié à l'identité | Suivi | Finalité |
|---|---|---|---|---|
| Nom | Oui | Oui | Non | Fonctionnalité de l'app |
| Adresse email | Oui (envoi du lien par le club) | Oui | Non | Fonctionnalité de l'app |
| Identifiant utilisateur (licencié) | Oui | Oui | Non | Fonctionnalité de l'app |
| Identifiant d'appareil (jeton push) | Oui | Oui | Non | Fonctionnalité de l'app |
| Autre contenu utilisateur (réponses, messages de dérogation) | Oui | Oui | Non | Fonctionnalité de l'app |
| Localisation, contacts, photos, santé, finances, historique de navigation, diagnostics, analytics, publicité | **Non** | | | |

Il n'y a aucun SDK tiers dans l'app : seulement Capacitor et ses plugins officiels `app` et `push-notifications`, plus le plugin local `BMNative`.

`PrivacyInfo.xcprivacy` ne déclare **aucune API à raison requise** : le code natif n'utilise ni `UserDefaults`, ni horodatage de fichiers, ni espace disque. À **revérifier** dans le rapport de confidentialité d'Xcode (Product → Archive → Generate Privacy Report), car les frameworks Capacitor embarqués ont leur propre manifeste.

## Captures d'écran à produire

Format iPhone 6,9" (1320 × 2868), obligatoire. Elles se font sur le club de démo, sans aucune donnée réelle :

1. Accueil « À faire » : convocation à confirmer et entraînement à répondre.
2. Détail d'un match avec le bloc convocation (« Je confirme »).
3. Planning de l'équipe (matchs et entraînements).
4. Entraînements : réponse Présent / Absent / Incertain.
5. Mon compte : plusieurs enfants et activation des notifications.
6. Notification sur l'écran verrouillé (« Nouvelle convocation »).
7. (Coach) Préparer et envoyer une convocation.
8. Écran de bienvenue avec le choix du club.

## Liens dans les emails (Resend)

Le **suivi des clics** de Resend réécrit chaque lien vers un domaine de redirection. iOS n'ouvre alors **pas** l'app : le premier lien n'est pas sur `ball-manager.fr`. Il doit donc être **désactivé** pour le domaine d'envoi (Resend → Domains → Configuration → Click tracking : off). Le code n'active aucun suivi. Ce réglage se fait dans le tableau de bord Resend et n'a **pas pu être vérifié** d'ici.

## Bannière Safari (Smart App Banner)

Définir `NEXT_PUBLIC_APP_STORE_ID` (ball-manager-web, Vercel) une fois l'app publiée. La bannière apparaît alors sur l'espace public, et le bouton « Installer » (PWA) disparaît sur iPhone.
