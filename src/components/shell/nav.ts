import type { ClubRole } from "@/lib/permissions/roles";
import { DEROGATION_REQUEST_ROLES, hasAnyRole, isClubAdmin } from "@/lib/permissions/roles";

/**
 * Configuration de navigation (sérialisable : passée des Server Components
 * au shell client). N'expose QUE des routes réelles, et seulement aux rôles
 * que la page derrière laisse entrer — mêmes règles que les guards
 * `require*Context` (sinon : aller-retour redirigé vers le dashboard).
 */
export type NavIcon =
  | "home"
  | "matches"
  | "results"
  | "players"
  | "tables"
  | "integrations"
  | "teams"
  | "sync"
  | "issues"
  | "derogations"
  | "fbi"
  | "venues"
  | "settings"
  | "platform"
  | "clubs";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  /** `true` : actif aussi sur les sous-routes (ex. détail d'un match). */
  prefix?: boolean;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export function buildClubNav(slug: string, roles: readonly ClubRole[]): NavSection[] {
  const base = `/c/${slug}`;
  const main: NavItem[] = [
    { href: `${base}/dashboard`, label: "Accueil", icon: "home" },
    { href: `${base}/matchs`, label: "Matchs", icon: "matches", prefix: true },
    // Retour du club, 2026-10-01 : « ici aussi dans le menu me faut le classement, c'est pas only public ».
    { href: `${base}/resultats`, label: "Résultats", icon: "results" },
    { href: `${base}/joueurs`, label: "Joueurs", icon: "players", prefix: true },
  ];
  if (hasAnyRole(roles, ["club_admin", "responsable_tables"])) {
    main.push({ href: `${base}/tables`, label: "Tables de marque", icon: "tables", prefix: true });
  }
  // Demandes de dérogation internes (coach → coordinateur), retour du club 2026-10-01.
  if (hasAnyRole(roles, DEROGATION_REQUEST_ROLES)) {
    main.push({ href: `${base}/derogations`, label: "Dérogations", icon: "derogations", prefix: true });
  }

  const sections: NavSection[] = [{ items: main }];

  if (isClubAdmin(roles)) {
    sections.push({
      label: "Administration",
      items: [
        { href: `${base}/admin/integrations`, label: "Intégrations", icon: "integrations", prefix: true },
        { href: `${base}/admin/teams`, label: "Équipes", icon: "teams" },
        { href: `${base}/admin/sync`, label: "Synchronisation", icon: "sync" },
        { href: `${base}/admin/issues`, label: "Anomalies", icon: "issues" },
        { href: `${base}/admin/gymnases`, label: "Gymnases", icon: "venues" },
        // Statut OFFICIEL lu sur FBI (lecture seule) — distinct des demandes internes ci-dessus.
        { href: `${base}/admin/derogations`, label: "Dérogations FBI", icon: "fbi" },
        { href: `${base}/admin/settings`, label: "Réglages", icon: "settings" },
      ],
    });
  }

  return sections;
}

export function buildPlatformNav(): NavSection[] {
  return [
    {
      label: "Plateforme",
      items: [{ href: "/platform/clubs", label: "Clubs", icon: "clubs", prefix: true }],
    },
  ];
}

/**
 * Barre du bas mobile : Accueil, Matchs, Dérogations (demandes internes) — sinon Joueurs —,
 * Tables, puis « Menu » (toutes les autres sections). Retour du club,
 * 2026-10-01 : « dans le menu en bas remplace joueurs par dérogations ».
 */
export function buildMobilePrimary(sections: NavSection[]): NavItem[] {
  const all = sections.flatMap((section) => section.items);
  const pick = (icon: NavIcon) => all.find((item) => item.icon === icon);
  const third = pick("derogations") ?? pick("players");
  return [pick("home"), pick("matches"), third, pick("tables")].filter((item): item is NavItem => Boolean(item));
}

export function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  return Boolean(item.prefix) && pathname.startsWith(`${item.href}/`);
}
