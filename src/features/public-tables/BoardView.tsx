"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listPublicTableAssignments, type PublicTableAssignmentsForMatchDto } from "@/lib/api/publicTables";
import { ApiError } from "@/lib/api/client";
import { addDaysToDateString, currentOrNextWeekendSaturday, formatWeekendLabel, weekendRangeForSaturday } from "@/lib/timezone";
import { CalendarCheck, ChevronLeft, ChevronRight, ClipboardList, LogOut } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { PublicMatchCard } from "./PublicMatchCard";
import { TableMatchCard } from "@/features/tables/TableMatchCard";
import { publicTablesClient } from "@/features/tables/tables-client";

/**
 * Vue "je me positionne" (retour du club, 2026-09-29) — même navigation
 * par journée/week-end que la vue admin (`@/lib/timezone`, fonctions
 * pures partagées), mais lecture ET écriture entièrement pilotées par le
 * jeton personnel, jamais une session Supabase.
 */
export function BoardView({
  clubSlug,
  clubTimezone,
  token,
  me,
  canManage,
  onLogout,
}: {
  clubSlug: string;
  clubTimezone: string;
  token: string;
  me: { id: string; firstName: string; lastName: string };
  /** Coach ou admin du club : mêmes cartes que l'admin (désigner, modifier, retirer, « pas besoin d'arbitre »). */
  canManage: boolean;
  onLogout: () => void;
}) {
  const client = useMemo(() => publicTablesClient(clubSlug, token), [clubSlug, token]);
  const [saturday, setSaturday] = useState(() => currentOrNextWeekendSaturday(clubTimezone));
  const [matches, setMatches] = useState<PublicTableAssignmentsForMatchDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const { from, to } = weekendRangeForSaturday(saturday, clubTimezone);
    listPublicTableAssignments(clubSlug, token, { from, to })
      .then((result) => {
        setMatches(result.matches);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.isUnauthorized) {
          onLogout();
          return;
        }
        setError(err instanceof ApiError ? err.message : "Impossible de charger les matchs.");
      });
  }, [clubSlug, clubTimezone, saturday, token, onLogout]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `refresh` change avec `saturday`, on ne veut relancer QUE sur ces dépendances explicites.
  }, [clubSlug, token, saturday]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  function handleChanged(message: string) {
    setToast(message);
    refresh();
  }

  const defaultSaturday = currentOrNextWeekendSaturday(clubTimezone);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={formatWeekendLabel(saturday)}
        title="Tables de marque"
        description={
          <>
            Bonjour <span className="font-medium text-foreground">{me.firstName} {me.lastName}</span> —{" "}
            {canManage ? "en tant que coach / admin du club, tu peux désigner, remplacer ou retirer n'importe qui (toi compris) sur les matchs à domicile." : "positionne-toi sur un poste libre des matchs à domicile."}
          </>
        }
        actions={
          <Button variant="ghost" onClick={onLogout} icon={<LogOut />}>
            Ce n&apos;est pas moi
          </Button>
        }
      />

      <nav aria-label="Choisir la journée" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <IconButton label="Journée précédente" variant="secondary" onClick={() => setSaturday((s) => addDaysToDateString(s, -7))}>
            <ChevronLeft />
          </IconButton>
          <p className="type-card min-w-0 flex-1 px-2 text-center text-foreground sm:min-w-[260px]" aria-live="polite">
            {formatWeekendLabel(saturday)}
          </p>
          <IconButton label="Journée suivante" variant="secondary" onClick={() => setSaturday((s) => addDaysToDateString(s, 7))}>
            <ChevronRight />
          </IconButton>
        </div>
        <Button
          variant={saturday === defaultSaturday ? "outline" : "ghost"}
          aria-pressed={saturday === defaultSaturday}
          onClick={() => setSaturday(defaultSaturday)}
          icon={<CalendarCheck />}
          className={saturday === defaultSaturday ? "border-accent-border bg-accent-soft text-accent-text" : undefined}
        >
          Ce week-end
        </Button>
      </nav>

      {toast ? <Toast message={toast} /> : null}
      {error ? <ErrorState title="Chargement impossible" description={error} /> : null}

      {matches === null ? (
        <ListSkeleton rows={3} />
      ) : matches.length === 0 ? (
        <EmptyState icon={<ClipboardList />} title="Aucun match à domicile cette journée" description="Passe à la journée suivante pour voir les prochains matchs." />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {matches.map((match) =>
            canManage ? (
              <TableMatchCard key={match.match.id} client={client} match={match} onChanged={handleChanged} />
            ) : (
              <PublicMatchCard key={match.match.id} clubSlug={clubSlug} token={token} meId={me.id} match={match} onChanged={handleChanged} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
