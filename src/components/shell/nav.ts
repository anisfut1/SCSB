import type { ClubRole } from "@/lib/permissions/roles";
import { hasAnyRole, isClubAdmin } from "@/lib/permissions/roles";

/**
 * Configuration de navigation (sérialisable : passée des Server Components
 * au shell client). N'expose QUE des routes réelles, et seulement aux rôles
 * que la page derrière laisse entrer — mêmes règles que les guards
 * `require*Context` (sinon : aller-retour redirigé vers le dashboard).
 */
export type NavIcon =
  | "home"
  | "matches"
  | "players"
  | "tables"
  | "integrations"
  | "teams"
  | "sync"
  | "issues"
  | "derogations"
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
    { href: `${base}/joueurs`, label: "Joueurs", icon: "players", prefix: true },
  ];
  if (hasAnyRole(roles, ["club_admin", "responsable_tables"])) {
    main.push({ href: `${base}/tables`, label: "Tables de marque", icon: "tables", prefix: true });
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
        { href: `${base}/admin/derogations`, label: "Dérogations", icon: "derogations" },
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

/** Barre du bas mobile : 3–4 destinations fréquentes + « Menu ». */
export function buildMobilePrimary(sections: NavSection[]): NavItem[] {
  return sections[0]?.items.slice(0, 4) ?? [];
}

export function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  return Boolean(item.prefix) && pathname.startsWith(`${item.href}/`);
}
