"use client";

import { useEffect, useState } from "react";
import { Repeat, Shirt } from "lucide-react";
import { StatusBadge, type BadgeTone } from "@/components/ui/Badge";
import { FormMessage } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/components/ui/cn";
import type { LaundryCandidateDto, LaundryDto } from "@/lib/api/teamLife";
import type { TeamLifeClient } from "./team-life-client";

const STATUS: Record<LaundryCandidateDto["status"], { label: string; tone: BadgeTone }> = {
  CONFIRMED: { label: "Convocation confirmée", tone: "success" },
  CONVOKED: { label: "Convoqué·e", tone: "info" },
  AVAILABLE: { label: "Disponible", tone: "success" },
  UNCERTAIN: { label: "Incertain·e", tone: "warning" },
  NO_RESPONSE: { label: "Sans réponse", tone: "neutral" },
  NOT_CONVOKED: { label: "Non convoqué·e", tone: "neutral" },
  DECLINED: { label: "A décliné", tone: "danger" },
  UNAVAILABLE: { label: "Indisponible", tone: "danger" },
};

export function laundryCountLabel(n: number): string {
  return n === 0 ? "0 lavage cette saison" : `${n} lavage${n > 1 ? "s" : ""} cette saison`;
}

/**
 * Maillots : le logiciel SUGGÈRE (personnes concernées par le match, moins de
 * lavages cette saison d'abord), le coach DÉCIDE en touchant un nom. Rien
 * n'est attribué automatiquement.
 */
export function LaundrySheet({ client, matchId, currentLicencieId, onClose, onAssigned }: { client: TeamLifeClient; matchId: string; currentLicencieId: string | null; onClose: () => void; onAssigned: (dto: LaundryDto) => void }) {
  const [candidates, setCandidates] = useState<LaundryCandidateDto[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    client
      .laundrySuggestions(matchId)
      .then((r) => !cancelled && setCandidates(r.candidates))
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : "Chargement impossible."));
    return () => {
      cancelled = true;
    };
  }, [client, matchId]);

  async function choose(licencieId: string) {
    setBusy(licencieId);
    setError(null);
    try {
      onAssigned(await client.assignLaundry(matchId, licencieId));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Attribution impossible.");
    } finally {
      setBusy(null);
    }
  }

  const suggested = candidates?.filter((c) => c.suggested) ?? [];
  const others = candidates?.filter((c) => !c.suggested) ?? [];

  const list = (items: LaundryCandidateDto[]) => (
    <ul className="flex flex-col divide-y divide-border rounded-[14px] border border-border bg-surface-raised">
      {items.map((c) => {
        const status = STATUS[c.status];
        const current = c.licencie.id === currentLicencieId;
        return (
          <li key={c.licencie.id}>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void choose(c.licencie.id)}
              className={cn("flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-muted disabled:opacity-60", current && "bg-accent-soft")}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-medium text-foreground">{c.label}</p>
                <p className="type-meta flex flex-wrap items-center gap-x-2">
                  <span className="type-numeric">{laundryCountLabel(c.seasonCount)}</span>
                  {c.repeat ? (
                    <span className="inline-flex items-center gap-1 [&_svg]:size-3.5">
                      <Repeat aria-hidden /> match précédent
                    </span>
                  ) : null}
                </p>
              </div>
              <StatusBadge size="sm" tone={status.tone}>
                {current ? "Actuellement" : status.label}
              </StatusBadge>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <Sheet open onClose={onClose} title="Lavage des maillots" description="Suggestions : joueurs concernés par le match, ceux qui ont le moins lavé cette saison d'abord. Touche un nom pour l'attribuer.">
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
      {!candidates ? (
        error ? null : <ListSkeleton rows={5} />
      ) : candidates.length === 0 ? (
        <p className="type-meta">Aucun joueur n&apos;est rattaché à cette équipe (liste des joueurs).</p>
      ) : (
        <div className="flex flex-col gap-5">
          {suggested.length ? (
            <section className="flex flex-col gap-2">
              <h3 className="type-eyebrow flex items-center gap-1.5 text-success [&_svg]:size-3.5">
                <Shirt aria-hidden /> Suggérés
              </h3>
              {list(suggested)}
            </section>
          ) : null}
          {others.length ? (
            <section className="flex flex-col gap-2">
              <h3 className="type-eyebrow">Autres</h3>
              {list(others)}
            </section>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}
