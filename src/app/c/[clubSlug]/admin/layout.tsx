import type { ReactNode } from "react";
import Link from "next/link";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";

/**
 * Espace club_admin (ex-super_admin, voir docs/MULTI_TENANCY.md §9) : tous
 * les droits SUR CE CLUB, jamais sur la plateforme (voir /platform pour
 * l'opérateur SaaS). `requireClubAdminContext` est la seconde barrière
 * (après RLS) qui empêche un simple membre d'accéder à ces pages.
 */
export default async function ClubAdminLayout({ children, params }: { children: ReactNode; params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  await requireClubAdminContext(clubSlug);

  const adminNav = [
    { href: `/c/${clubSlug}/admin/integrations`, label: "Intégrations" },
    { href: `/c/${clubSlug}/admin/teams`, label: "Équipes" },
    { href: `/c/${clubSlug}/admin/sync`, label: "Synchronisation" },
    { href: `/c/${clubSlug}/admin/issues`, label: "Anomalies" },
    { href: `/c/${clubSlug}/admin/settings`, label: "Réglages" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <nav className="border-b border-black/10 dark:border-white/10">
        <ul className="flex w-full gap-4 overflow-x-auto text-sm">
          {adminNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="inline-block whitespace-nowrap py-3 hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
