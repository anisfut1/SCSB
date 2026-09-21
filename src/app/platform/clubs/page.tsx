import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { computeClubCapabilities } from "@/lib/tenancy/club-capabilities";
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
 * indicateurs simples FFBB/FBI/e-Marque par club (§45 du brief FBI) — aucune
 * donnée sportive détaillée n'est nécessaire ici, juste "est-ce que ça
 * fonctionne pour ce club". Réservé au platform_admin (voir /platform/layout.tsx).
 */
export default async function PlatformClubsPage() {
  const supabase = createAdminSupabaseClient();
  const [{ data: clubs }, { data: fbiStatuses }] = await Promise.all([
    supabase.from("clubs").select("id, name, slug, ffbb_club_id, status, ffbb_enabled, created_at").order("created_at", { ascending: false }),
    supabase.from("fbi_integration_status").select("club_id, configured, last_login_success"),
  ]);

  const fbiStatusByClub = new Map((fbiStatuses ?? []).map((s) => [s.club_id, s]));

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
        {clubs && clubs.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-3 text-sm">
            {clubs.map((club) => {
              const fbiStatus = fbiStatusByClub.get(club.id);
              const capabilities = computeClubCapabilities({
                ffbbEnabled: club.ffbb_enabled,
                fbiConfigured: fbiStatus?.configured ?? false,
                fbiConnected: fbiStatus?.last_login_success ?? false,
              });

              return (
                <li key={club.id} className="flex flex-col gap-1 border-b border-black/5 pb-3 last:border-0 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/c/${club.slug}/dashboard`} className="font-medium hover:underline">
                      {club.name}
                    </Link>
                    <span className="ml-2 text-black/60 dark:text-white/60">/c/{club.slug} · {club.ffbb_club_id}</span>
                    <span className={`ml-2 ${club.status === "active" ? "text-green-700 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {club.status}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <StatusBadge ok={capabilities.ffbb} label="FFBB" />
                    <StatusBadge ok={capabilities.fbi} label="FBI" />
                    <StatusBadge ok={capabilities.emarque} label="e-Marque" />
                  </div>
                </li>
              );
            })}
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
