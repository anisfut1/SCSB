import type { ReactNode } from "react";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/session";
import { AppHeader } from "@/components/nav/AppHeader";

const ADMIN_NAV = [
  { href: "/admin/integrations", label: "Intégrations" },
  { href: "/admin/sync", label: "Synchronisation" },
  { href: "/admin/issues", label: "Anomalies" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireSuperAdmin();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader displayName={user.email ?? "admin"} />
      <nav className="border-b border-black/10 dark:border-white/10">
        <ul className="mx-auto flex w-full max-w-3xl gap-4 overflow-x-auto px-4 text-sm">
          {ADMIN_NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="inline-block whitespace-nowrap py-3 hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
