import Link from "next/link";
import { getPlatformClubs } from "@/lib/auth/platform";
import { Card } from "@/components/ui/Card";
import { CreateClubForm } from "@/features/platform/CreateClubForm";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={ok ? "text-green-700 dark:text-green-400" : "text-black/40 dark:text-white/40"}>
      {label} {ok ? "✅" : "❌"}
    </span>
  );
}

/**
 * Onboarding d'un nouveau club sans toucher au code (§30 du brief SaaS), et
 * indicateurs simples FFBB/FBI/e-Marque par club (§45 du brief FBI) — §24
 * de la demande : `GET /v1/platform/clubs`, capabilities déjà calculées
 * côté backend (`PlatformClubDto`), plus aucun accès Supabase direct ni
 * service_role. Réservé au platform_admin (voir /platform/layout.tsx).
 */
export default async function PlatformClubsPage() {
  const clubs = await getPlatformClubs();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Clubs de la plateforme</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Réservé à l&apos;opérateur de la plateforme (platform_admin). La gestion quotidienne d&apos;un club se fait
          depuis /c/{"{"}slug{"}"}/admin, jamais ici.
        </p>
      </div>

      <Card title="Clubs existants">
        {clubs.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-3 text-sm">
            {clubs.map((club) => (
              <li
                key={club.id}
                className="flex flex-col gap-1 border-b border-black/5 pb-3 last:border-0 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link href={`/c/${club.slug}/dashboard`} className="font-medium hover:underline">
                    {club.name}
                  </Link>
                  <span className="ml-2 text-black/60 dark:text-white/60">
                    /c/{club.slug} · {club.ffbbClubId}
                  </span>
                  <span className={`ml-2 ${club.status === "active" ? "text-green-700 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {club.status}
                  </span>
                </div>
                <div className="flex gap-3 text-xs">
                  <StatusBadge ok={club.ffbb} label="FFBB" />
                  <StatusBadge ok={club.fbi} label="FBI" />
                  <StatusBadge ok={club.emarque} label="e-Marque" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">Aucun club pour l&apos;instant.</p>
        )}
      </Card>

      <Card title="Créer un club">
        <CreateClubForm />
      </Card>
    </div>
  );
}
