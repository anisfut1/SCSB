import Link from "next/link";
import { requireAnyClubRoleContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { addDaysToDateString, currentOrNextWeekendSaturday, formatWeekendLabel, weekendRangeForSaturday } from "@/lib/timezone";
import { DaySummary } from "@/features/tables/DaySummary";
import { TablesBoard } from "@/features/tables/TablesBoard";

/**
 * Page "Tables de marque" (§64-§69 de la demande) : vue PAR JOURNÉE — au
 * sens basket, une journée de championnat couvre tout le week-end (samedi +
 * dimanche), pas un seul jour calendaire (retour du club, 2026-09-28 : "au
 * lieu de fonctionner par jour, fonctionne par journée (1 journée = semaine
 * weekend)"). Matchs à domicile uniquement (§4/§36 — un match extérieur ne
 * sert qu'à calculer l'indisponibilité, jamais affiché ici), chaque match =
 * une card avec ses 3 postes. Accessible à club_admin ET responsable_tables
 * (§31, même porte que club-manager-api — voir `requireAnyClubRole` côté API).
 *
 * Aucune donnée factice avant que le backend soit prêt (§68) : cette page
 * n'existe QUE depuis que les 4 routes Tables de marque sont réellement
 * exposées par club-manager-api.
 */
export default async function TablesPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug } = await params;
  const club = await requireAnyClubRoleContext(clubSlug, ["club_admin", "responsable_tables"]);

  const resolvedSearchParams = await searchParams;
  const requestedWeekend = typeof resolvedSearchParams.weekend === "string" ? resolvedSearchParams.weekend : null;
  const saturday = requestedWeekend && /^\d{4}-\d{2}-\d{2}$/.test(requestedWeekend) ? requestedWeekend : currentOrNextWeekendSaturday(club.timezone);

  const { from, to } = weekendRangeForSaturday(saturday, club.timezone);
  const matches = await api.tables.list(club.id, { from, to });

  const previousWeekend = addDaysToDateString(saturday, -7);
  const nextWeekend = addDaysToDateString(saturday, 7);
  const defaultWeekend = currentOrNextWeekendSaturday(club.timezone);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Tables de marque</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">{formatWeekendLabel(saturday)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href={`/c/${clubSlug}/tables?weekend=${previousWeekend}`} className="rounded-full border border-black/15 px-3 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
          ← Journée précédente
        </Link>
        <Link href={`/c/${clubSlug}/tables?weekend=${nextWeekend}`} className="rounded-full border border-black/15 px-3 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
          Journée suivante →
        </Link>
        <Link
          href={`/c/${clubSlug}/tables?weekend=${defaultWeekend}`}
          className={`rounded-full border px-3 py-1 ${
            saturday === defaultWeekend ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          }`}
        >
          Ce week-end
        </Link>
      </div>

      <DaySummary matches={matches} />

      <TablesBoard clubId={club.id} matches={matches} />
    </div>
  );
}
