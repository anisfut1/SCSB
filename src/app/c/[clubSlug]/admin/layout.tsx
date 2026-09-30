import type { ReactNode } from "react";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";

/**
 * Espace club_admin (ex-super_admin, voir docs/MULTI_TENANCY.md §9) : tous
 * les droits SUR CE CLUB, jamais sur la plateforme (voir /platform pour
 * l'opérateur SaaS). `requireClubAdminContext` est la seconde barrière
 * (après RLS) qui empêche un simple membre d'accéder à ces pages. La
 * navigation admin vit dans la sidebar (section « Administration »).
 */
export default async function ClubAdminLayout({ children, params }: { children: ReactNode; params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  await requireClubAdminContext(clubSlug);
  return <>{children}</>;
}
