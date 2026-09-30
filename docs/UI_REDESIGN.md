# Refonte UI/UX — inventaire et suivi

Source de vérité visuelle : [`design-system/scsb/MASTER.md`](../design-system/scsb/MASTER.md).
Périmètre : frontend uniquement. Aucune route, aucun contrat API, aucune logique métier modifiés
(seul ajout côté client API : `api.me()` pour lire `GET /v1/me`, déjà exposé par club-manager-api,
afin d'afficher le `displayName` réel au lieu de l'email).

Inventaire établi à partir de `src/app/**` (page/layout/error/not-found/loading) et des composants
réellement importés par chaque route — pas depuis une liste supposée.

## Routes

Légende : **R** = redesign effectué · **M** = responsive vérifié (390 / 768 / 1440)

### Racine et authentification

| Route | Fichiers | Composants | R | M |
|---|---|---|---|---|
| `/login` | `app/login/page.tsx` | `features/auth/LoginForm` | [ ] | [ ] |
| `/` (sélection de club) | `app/page.tsx` | — | [ ] | [ ] |
| erreur globale | `app/error.tsx` | — | [ ] | [ ] |
| 404 globale | `app/not-found.tsx` | — | [ ] | [ ] |
| chargement | `app/loading.tsx` *(nouveau)* | `Skeleton` | [ ] | [ ] |

### Espace club — `/c/[clubSlug]/*`

| Route | Fichiers | Composants | R | M |
|---|---|---|---|---|
| layout club | `c/[clubSlug]/layout.tsx` | AppShell, Sidebar, MobileNav, WorkspaceSwitcher | [ ] | [ ] |
| chargement club | `c/[clubSlug]/loading.tsx` *(nouveau)* | `Skeleton` | [ ] | [ ] |
| Accueil | `c/[clubSlug]/dashboard/page.tsx` | KPI, prochains matchs, statut intégrations | [ ] | [ ] |
| Matchs | `c/[clubSlug]/matchs/page.tsx` | FilterBar, MatchCard, `HomeMatchesAgenda` | [ ] | [ ] |
| Détail match | `c/[clubSlug]/matchs/[id]/page.tsx` | Scoreboard, Tabs, `DerogationCard`, `CreateDerogationAction`, `RespondToDerogationAction` | [ ] | [ ] |
| Joueurs | `c/[clubSlug]/joueurs/page.tsx` | `RosterBoard`, `ImportLicenciesPanel` | [ ] | [ ] |
| Fiche joueur | `c/[clubSlug]/joueurs/[licencieId]/page.tsx` | `LicencieProfileEditForm` | [ ] | [ ] |
| Tables de marque | `c/[clubSlug]/tables/page.tsx` | `DaySummary`, `TablesBoard`, `TableMatchCard`, `TableAssignmentSlot`, `TableSuggestionsSheet` | [ ] | [ ] |
| Accès publics tables | `c/[clubSlug]/tables/public-access/page.tsx` | `PublicLinkBanner`, `PublicAccessList` | [ ] | [ ] |

### Administration club — `/c/[clubSlug]/admin/*`

| Route | Fichiers | Composants | R | M |
|---|---|---|---|---|
| layout admin | `admin/layout.tsx` | garde d'accès uniquement (nav déplacée dans la sidebar) | [ ] | [ ] |
| Intégrations | `admin/integrations/page.tsx` | IntegrationCard FFBB/FBI/e-Marque, `TriggerFfbbSyncButton` | [ ] | [ ] |
| FBI | `admin/integrations/fbi/page.tsx` | `FbiCredentialsForm`, `TestFbiConnectionButton`, `ProcessFbiJobsButton`, `ParseFbiDocumentsButton`, `ReconcileFbiScheduleButton`, `CheckAllDerogationsButton` | [ ] | [ ] |
| Synchronisation | `admin/sync/page.tsx` | monitoring par source, statuts e-Marque | [ ] | [ ] |
| Anomalies | `admin/issues/page.tsx` | `ResolveIssueButton` | [ ] | [ ] |
| Dérogations | `admin/derogations/page.tsx` | `DerogationsList`, `RespondToDerogationAction` | [ ] | [ ] |
| Équipes | `admin/teams/page.tsx` | `TeamsManager` | [ ] | [ ] |
| Paramètres | `admin/settings/page.tsx` | `ClubSettingsForm` | [ ] | [ ] |

### Plateforme — `/platform/*`

| Route | Fichiers | Composants | R | M |
|---|---|---|---|---|
| layout plateforme | `platform/layout.tsx` | AppShell variante plateforme | [ ] | [ ] |
| Clubs | `platform/clubs/page.tsx` | table premium / cartes mobile, `CreateClubForm`, `MaintenanceActions` | [ ] | [ ] |

### Vue publique sans compte — `/public/[clubSlug]/*`

| Route | Fichiers | Composants | R | M |
|---|---|---|---|---|
| Matchs publics | `public/[clubSlug]/matchs/page.tsx` | PublicShell, MatchCard | [ ] | [ ] |
| Détail match public | `public/[clubSlug]/matchs/[id]/page.tsx` | Scoreboard, Tabs | [ ] | [ ] |
| Tables publiques | `public/[clubSlug]/tables/page.tsx` | `PublicTablesApp`, `ClaimView`, `BoardView`, `PublicMatchCard` | [ ] | [ ] |

## Composants partagés

| Ancien | Nouveau |
|---|---|
| `components/nav/AppHeader.tsx` | remplacé par `components/layout/*` (AppShell, Sidebar, Topbar, MobileNav, WorkspaceSwitcher, UserMenu) |
| `components/nav/ClubSwitcher.tsx` (`<select>` natif) | remplacé par `components/layout/WorkspaceSwitcher.tsx` |
| `components/ui/Card.tsx` (carte unique sans variante) | réécrit : `Card`, `CardHeader`, variantes `raised` / `interactive` / `glow` |
| `components/ui/Sheet.tsx` | réécrit sur les tokens, bottom sheet mobile + panneau desktop |

## Fonctionnalités non concernées

Aucune route supprimée ni ajoutée côté produit. Les modules futurs (disponibilités, etc.) n'apparaissent
nulle part dans la navigation tant qu'ils n'existent pas.
