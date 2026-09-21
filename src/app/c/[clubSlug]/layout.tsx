import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { requireClubContext, listUserClubs } from "@/lib/tenancy/club-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/AppHeader";

/**
 * Layout racine de tout l'espace club (/c/{slug}/...). Résout le
 * ClubContext UNE fois ici (voir src/lib/tenancy/club-context.ts) — les
 * pages filles n'ont qu'à relire `params.clubSlug` pour retrouver le même
 * contexte si elles en ont besoin côté service (§36 du brief SaaS).
 */
export default async function ClubLayout({ children, params }: { children: ReactNode; params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  // requireClubContext() redirige déjà vers /login si non connecté ; l'utilisateur est donc garanti non-null ici.
  const context = await requireClubContext(clubSlug);
  const user = (await getCurrentUser())!;

  const [{ data: profile }, allClubs] = await Promise.all([
    (await createServerSupabaseClient()).from("profiles").select("display_name").eq("user_id", user.id).single(),
    listUserClubs(user.id),
  ]);

  const otherClubs = allClubs.filter((c) => c.slug !== clubSlug).map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader
        displayName={profile?.display_name ?? user.email ?? "utilisateur"}
        club={{ name: context.club.name, slug: context.club.slug }}
        otherClubs={otherClubs}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
