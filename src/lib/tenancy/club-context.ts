import "server-only";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { isClubAdmin } from "@/lib/permissions/roles";
import type { ClubRole, ClubStatus } from "@/types/database";

/**
 * Point d'entrée UNIQUE pour résoudre "quel club, avec quels droits" pour
 * une requête donnée (voir docs/MULTI_TENANCY.md). Toute page/service qui a
 * besoin du club courant doit passer par ce module plutôt que de
 * réimplémenter sa propre vérification d'appartenance — c'est ce qui rend
 * difficile d'oublier un scope `club_id` par erreur (§36/§58 du brief SaaS).
 */

export interface ClubSummary {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  accentColor: string | null;
  timezone: string;
  status: ClubStatus;
  ffbbClubId: string;
}

export interface ClubContext {
  club: ClubSummary;
  membershipId: string;
  roles: ClubRole[];
}

function mapClubRow(row: {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  accent_color: string | null;
  timezone: string;
  status: ClubStatus;
  ffbb_club_id: string;
}): ClubSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    logoUrl: row.logo_url,
    accentColor: row.accent_color,
    timezone: row.timezone,
    ffbbClubId: row.ffbb_club_id,
    status: row.status,
  };
}

/**
 * Résout le contexte club pour un slug d'URL et un utilisateur donnés.
 * Renvoie `null` aussi bien si le club n'existe pas QUE si l'utilisateur
 * n'en est pas membre actif : le code appelant ne doit jamais pouvoir
 * distinguer les deux cas (jamais révéler l'existence d'un club à un
 * non-membre), RLS ou pas — cohérent avec `notFound()` côté route.
 */
export async function getClubContext(slug: string, user: User): Promise<ClubContext | null> {
  const supabase = await createServerSupabaseClient();

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, slug, name, short_name, logo_url, accent_color, timezone, status, ffbb_club_id")
    .eq("slug", slug)
    .maybeSingle();

  if (clubError || !club) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("club_memberships")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError || !membership) return null;

  const { data: roleRows, error: rolesError } = await supabase.from("membership_roles").select("role").eq("membership_id", membership.id);

  if (rolesError) {
    throw new Error(`Impossible de charger les rôles du membership : ${rolesError.message}`);
  }

  return {
    club: mapClubRow(club),
    membershipId: membership.id,
    roles: (roleRows ?? []).map((r) => r.role),
  };
}

/** Variante stricte : 404 si le club n'existe pas ou n'a pas cet utilisateur pour membre. */
export async function requireClubContext(slug: string): Promise<ClubContext> {
  const user = await requireUser();
  const context = await getClubContext(slug, user);

  if (!context) notFound();

  return context;
}

/** Variante stricte réservée au club_admin de CE club (ex: /c/{slug}/admin/*). */
export async function requireClubAdminContext(slug: string): Promise<ClubContext> {
  const context = await requireClubContext(slug);

  if (!isClubAdmin(context.roles)) {
    redirect(`/c/${slug}/dashboard`);
  }

  return context;
}

export interface ClubMembershipSummary extends ClubSummary {
  roles: ClubRole[];
}

/** Liste des clubs actifs auxquels l'utilisateur appartient (club switcher, §14 du brief SaaS). */
export async function listUserClubs(userId: string): Promise<ClubMembershipSummary[]> {
  const supabase = await createServerSupabaseClient();

  const { data: memberships, error: membershipsError } = await supabase
    .from("club_memberships")
    .select("id, club_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (membershipsError) {
    throw new Error(`Impossible de lister les clubs de l'utilisateur : ${membershipsError.message}`);
  }

  if (!memberships || memberships.length === 0) return [];

  const clubIds = memberships.map((m) => m.club_id);
  const { data: clubs, error: clubsError } = await supabase
    .from("clubs")
    .select("id, slug, name, short_name, logo_url, accent_color, timezone, status, ffbb_club_id")
    .in("id", clubIds);

  if (clubsError) {
    throw new Error(`Impossible de charger les clubs de l'utilisateur : ${clubsError.message}`);
  }

  const membershipIdByClubId = new Map(memberships.map((m) => [m.club_id, m.id]));

  const { data: roleRows, error: rolesError } = await supabase
    .from("membership_roles")
    .select("membership_id, role")
    .in(
      "membership_id",
      memberships.map((m) => m.id),
    );

  if (rolesError) {
    throw new Error(`Impossible de charger les rôles de l'utilisateur : ${rolesError.message}`);
  }

  const rolesByMembershipId = new Map<string, ClubRole[]>();
  for (const row of roleRows ?? []) {
    const list = rolesByMembershipId.get(row.membership_id) ?? [];
    list.push(row.role);
    rolesByMembershipId.set(row.membership_id, list);
  }

  return (clubs ?? []).map((club) => ({
    ...mapClubRow(club),
    roles: rolesByMembershipId.get(membershipIdByClubId.get(club.id) ?? "") ?? [],
  }));
}
