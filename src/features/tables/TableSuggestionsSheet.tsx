"use client";

import { useEffect, useMemo, useState } from "react";
import { Clipboard, Clock, MapPin, Navigation, Search, Sparkles, UserRound } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { SuggestionReasonCode, TableAssignmentRole, TableAssignmentResultDto, TableSuggestionCandidateDto, TableSuggestionsDto, TableUnavailableCandidateDto, UnavailableReasonCode } from "@/lib/api/tables";
import { TABLE_ROLE_LABELS, chooseRolePanelTitle } from "./role-labels";

const REASON_ICON: Record<SuggestionReasonCode, typeof Clock> = {
  NEXT_HOME_MATCH: Clock,
  PREVIOUS_HOME_MATCH: Clock,
  SAME_VENUE: MapPin,
  SEASON_DUTY_COUNT: Clipboard,
};

const UNAVAILABLE_ICON: Record<UnavailableReasonCode, typeof Navigation> = {
  MATCH_CONFLICT: Navigation,
  TABLE_ASSIGNMENT_CONFLICT: Clipboard,
  ALREADY_ASSIGNED_ON_MATCH: UserRound,
};

function matchesSearch(query: string, name: string, teams: { name: string }[]): boolean {
  if (!query.trim()) return true;
  const haystack = `${name} ${teams.map((t) => t.name).join(" ")}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function CandidateRow({ candidate, onChoose, choosing }: { candidate: TableSuggestionCandidateDto; onChoose: () => void; choosing: boolean }) {
  const name = `${candidate.licencie.firstName} ${candidate.licencie.lastName}`;
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-black/10 p-3 dark:border-white/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-black/90 dark:text-white/90">{name}</span>
          {candidate.teams.length > 0 ? <span className="text-xs text-black/50 dark:text-white/50">{candidate.teams.map((t) => t.name).join(", ")}</span> : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            candidate.eligibility === "RECOMMENDED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60"
          }`}
        >
          {candidate.eligibility === "RECOMMENDED" ? "Recommandé" : "Potentiellement disponible"}
        </span>
      </div>

      <ul className="flex flex-col gap-1">
        {candidate.reasons.map((reason) => {
          const Icon = REASON_ICON[reason.code];
          return (
            <li key={reason.code} className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {reason.label}
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-2">
        {candidate.isCurrentHolder ? (
          <span className="flex items-center gap-1 text-xs font-medium text-black/50 dark:text-white/50">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Affecté actuellement
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onChoose}
          disabled={choosing || candidate.isCurrentHolder}
          className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          {candidate.isCurrentHolder ? "Déjà affecté" : choosing ? "…" : "Choisir"}
        </button>
      </div>
    </li>
  );
}

function UnavailableRow({ candidate }: { candidate: TableUnavailableCandidateDto }) {
  const name = `${candidate.licencie.firstName} ${candidate.licencie.lastName}`;
  const Icon = UNAVAILABLE_ICON[candidate.reasonCode];
  return (
    <li className="flex flex-col gap-1.5 rounded-lg border border-black/10 p-3 opacity-60 dark:border-white/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-black/90 dark:text-white/90">{name}</span>
          {candidate.teams.length > 0 ? <span className="text-xs text-black/50 dark:text-white/50">{candidate.teams.map((t) => t.name).join(", ")}</span> : null}
        </div>
        <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300">Indisponible</span>
      </div>
      <span className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {candidate.reason}
      </span>
    </li>
  );
}

/**
 * Panneau "Choisir un marqueur/chronométreur/délégué de club" (§70-§78 de
 * la demande). Charge les suggestions à l'ouverture (STRICTEMENT en
 * lecture, §39 — ne crée jamais rien tant que "Choisir" n'est pas cliqué),
 * les sépare en 3 sections jamais mélangées (§43), et ne transforme une
 * suggestion en affectation réelle que via `PUT`, sur clic explicite.
 *
 * Aucun bouton ne peut remplir plusieurs postes à la fois — un seul appel
 * PUT par clic, pour le rôle affiché par ce panneau (§67 : jamais
 * "Affecter automatiquement" / "Remplir les tables").
 */
export function TableSuggestionsSheet({
  clubId,
  matchId,
  role,
  open,
  onClose,
  onAssigned,
}: {
  clubId: string;
  matchId: string;
  role: TableAssignmentRole;
  open: boolean;
  onClose: () => void;
  onAssigned: (result: TableAssignmentResultDto) => void;
}) {
  const [data, setData] = useState<TableSuggestionsDto | null>(null);
  // `true` dès le montage (jamais mis à `true` depuis l'effet lui-même,
  // interdit par react-hooks/set-state-in-effect) : `TableMatchCard` ne
  // monte ce composant QUE quand un poste est ouvert (voir plus bas), donc
  // le montage EST le début du chargement.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [choosingId, setChoosingId] = useState<string | null>(null);

  /**
   * `TableMatchCard` ne monte ce composant QUE quand un poste est ouvert
   * (`{openRole ? <TableSuggestionsSheet ... /> : null}`) et le démonte à
   * la fermeture : chaque ouverture est donc déjà un montage frais (état
   * initial `data: null`/`search: ""` via `useState`), jamais besoin de
   * réinitialiser manuellement dans l'effet — un seul chargement au
   * montage, jamais réexécuté tant que `role`/`matchId` ne changent pas.
   */
  useEffect(() => {
    let cancelled = false;
    browserApi.tables
      .suggestions(clubId, matchId, role)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Impossible de charger les suggestions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clubId, matchId, role]);

  const filtered = useMemo(() => {
    if (!data) return null;
    return {
      recommended: data.recommended.filter((c) => matchesSearch(search, `${c.licencie.firstName} ${c.licencie.lastName}`, c.teams)),
      available: data.available.filter((c) => matchesSearch(search, `${c.licencie.firstName} ${c.licencie.lastName}`, c.teams)),
      unavailable: data.unavailable.filter((c) => matchesSearch(search, `${c.licencie.firstName} ${c.licencie.lastName}`, c.teams)),
    };
  }, [data, search]);

  async function choose(licencieId: string) {
    setChoosingId(licencieId);
    setError(null);
    try {
      const result = await browserApi.tables.assign(clubId, matchId, role, { licencieId });
      onAssigned(result);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && (err.code === "TABLE_ASSIGNMENT_CONFLICT" || err.code === "ALREADY_ASSIGNED_ON_MATCH" || err.status === 409)) {
        setError(`${err.message} — les suggestions ci-dessous ont été actualisées.`);
        setLoading(true);
        browserApi.tables
          .suggestions(clubId, matchId, role)
          .then(setData)
          .catch(() => undefined)
          .finally(() => setLoading(false));
      } else {
        setError(err instanceof ApiError ? err.message : "Affectation impossible.");
      }
    } finally {
      setChoosingId(null);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={chooseRolePanelTitle(role)}>
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-2 rounded-md border border-black/15 px-2.5 py-1.5 dark:border-white/20">
          <Search className="h-4 w-4 shrink-0 text-black/40 dark:text-white/40" aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un nom, une équipe…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-black/40 dark:placeholder:text-white/40"
          />
        </label>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-black/50 dark:text-white/50">Chargement des suggestions…</p>
        ) : filtered ? (
          <div className="flex flex-col gap-5">
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">Recommandés</h3>
              {filtered.recommended.length === 0 ? (
                <p className="text-sm text-black/40 dark:text-white/40">Aucun candidat recommandé pour ce poste.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {filtered.recommended.map((c) => (
                    <CandidateRow key={c.licencie.id} candidate={c} onChoose={() => choose(c.licencie.id)} choosing={choosingId === c.licencie.id} />
                  ))}
                </ul>
              )}
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">Potentiellement disponibles</h3>
              {filtered.available.length === 0 ? (
                <p className="text-sm text-black/40 dark:text-white/40">Aucun autre candidat sans conflit connu.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {filtered.available.map((c) => (
                    <CandidateRow key={c.licencie.id} candidate={c} onChoose={() => choose(c.licencie.id)} choosing={choosingId === c.licencie.id} />
                  ))}
                </ul>
              )}
            </section>

            {filtered.unavailable.length > 0 ? (
              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">Indisponibles</h3>
                <ul className="flex flex-col gap-2">
                  {filtered.unavailable.map((c) => (
                    <UnavailableRow key={c.licencie.id} candidate={c} />
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}

        <p className="text-xs text-black/40 dark:text-white/40">Aucune suggestion n&apos;est affectée automatiquement — {TABLE_ROLE_LABELS[role].toLowerCase()} choisi uniquement sur clic « Choisir ».</p>
      </div>
    </Sheet>
  );
}
