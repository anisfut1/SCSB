import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { requireClubContext, listUserClubs } from "@/lib/tenancy/club-context";
import { AppHeader } from "@/components/nav/AppHeader";

/**
 * Layout racine de tout l'espace club (/c/{slug}/...). Résout le
 * ClubContext UNE fois ici (voir src/lib/tenancy/club-context.ts) — les
 * pages filles n'ont qu'à relire `params.clubSlug` pour retrouver le même
 * contexte si elles en ont besoin côté service (§36 du brief SaaS).
 *
 * BACKEND_API_GAP (voir docs/MIGRATION_TO_API.md) : `GET /v1/me` ne
 * renvoie que `{ id, email }`, jamais un nom d'affichage (`profiles.
 * display_name` côté SCSB). Ce repository ne lit plus JAMAIS `profiles`
 * directement (table métier, §8/§28 de la demande) : l'email sert de nom
 * d'affichage en attendant que l'API l'expose.
 */
export default async function ClubLayout({ children, params }: { children: ReactNode; params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  // requireClubContext() redirige déjà vers /login si non connecté ; l'utilisateur est donc garanti non-null ici.
  const [club, user, allClubs] = await Promise.all([requireClubContext(clubSlug), getCurrentUser(), listUserClubs()]);

  const otherClubs = allClubs.filter((c) => c.slug !== clubSlug).map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader displayName={user?.email ?? "utilisateur"} club={{ name: club.name, slug: club.slug }} otherClubs={otherClubs} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
