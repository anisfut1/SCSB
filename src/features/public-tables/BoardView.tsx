"use client";

import { useCallback, useEffect, useState } from "react";
import { listPublicTableAssignments, type PublicTableAssignmentsForMatchDto } from "@/lib/api/publicTables";
import { ApiError } from "@/lib/api/client";
import { addDaysToDateString, currentOrNextWeekendSaturday, formatWeekendLabel, weekendRangeForSaturday } from "@/lib/timezone";
import { PublicMatchCard } from "./PublicMatchCard";

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
  onLogout,
}: {
  clubSlug: string;
  clubTimezone: string;
  token: string;
  me: { id: string; firstName: string; lastName: string };
  onLogout: () => void;
}) {
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Tables de marque</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Bonjour {me.firstName} {me.lastName} — {formatWeekendLabel(saturday)}
          </p>
        </div>
        <button type="button" onClick={onLogout} className="shrink-0 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
          Ce n&apos;est pas moi
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" onClick={() => setSaturday((s) => addDaysToDateString(s, -7))} className="rounded-full border border-black/15 px-3 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
          ← Journée précédente
        </button>
        <button type="button" onClick={() => setSaturday((s) => addDaysToDateString(s, 7))} className="rounded-full border border-black/15 px-3 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
          Journée suivante →
        </button>
        <button
          type="button"
          onClick={() => setSaturday(defaultSaturday)}
          className={`rounded-full border px-3 py-1 ${
            saturday === defaultSaturday ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          }`}
        >
          Ce week-end
        </button>
      </div>

      {toast ? (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          {toast}
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {matches === null ? (
        <p className="text-sm text-black/50 dark:text-white/50">Chargement…</p>
      ) : matches.length === 0 ? (
        <p className="rounded-lg border border-black/10 bg-black/[0.02] p-4 text-sm text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">Aucun match à domicile cette journée.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {matches.map((match) => (
            <PublicMatchCard key={match.match.id} clubSlug={clubSlug} token={token} meId={me.id} match={match} onChanged={handleChanged} />
          ))}
        </div>
      )}
    </div>
  );
}
