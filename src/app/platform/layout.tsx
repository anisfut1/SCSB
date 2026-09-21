import type { ReactNode } from "react";
import { requirePlatformAdmin } from "@/lib/auth/platform";
import { getCurrentUser } from "@/lib/auth/session";
import { AppHeader } from "@/components/nav/AppHeader";

/**
 * Espace réservé à l'opérateur de la plateforme SaaS (§40 du brief SaaS) :
 * jamais accessible à un simple club_admin, complètement séparé de
 * /c/{slug}/admin (voir docs/MULTI_TENANCY.md).
 */
export default async function PlatformLayout({ children }: { children: ReactNode }) {
  await requirePlatformAdmin();
  const user = (await getCurrentUser())!;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader displayName={user.email ?? "platform admin"} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
