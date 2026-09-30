import type { ReactNode } from "react";
import { requirePlatformAdmin } from "@/lib/auth/platform";
import { listUserClubs } from "@/lib/tenancy/club-context";
import { AppShell } from "@/components/shell/AppShell";
import { buildPlatformNav } from "@/components/shell/nav";
import { getShellIdentity } from "@/components/shell/session";

/**
 * Espace réservé à l'opérateur de la plateforme SaaS (§40 du brief SaaS) :
 * jamais accessible à un simple club_admin, complètement séparé de
 * /c/{slug}/admin (voir docs/MULTI_TENANCY.md).
 */
export default async function PlatformLayout({ children }: { children: ReactNode }) {
  await requirePlatformAdmin();
  const [clubs, identity] = await Promise.all([listUserClubs(), getShellIdentity()]);

  return (
    <AppShell
      variant="platform"
      sections={buildPlatformNav()}
      current={null}
      workspaces={clubs.map((c) => ({ slug: c.slug, name: c.name, logoUrl: c.logoUrl }))}
      user={identity.user}
      isPlatformAdmin
    >
      {children}
    </AppShell>
  );
}
