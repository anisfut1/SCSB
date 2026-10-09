"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Dumbbell, Link2, MapPin, Megaphone, Trophy } from "lucide-react";
import { PersonAvatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import type { PlanningDto, PlanningEventDto, TeamOverviewDto } from "@/lib/api/teamLife";
import { convocationSummary, locationLabel, relativeDay, shortDateTime, timeOf } from "./labels";
import { PlanningView } from "./PlanningView";

import type { TeamTab } from "./team-tab";

/**
 * Page Équipe (Vie d'équipe, Lot 4) : Vue d'ensemble / Planning / Effectif.
 * Pas un CRM : prochain match, prochain entraînement, réponses attendues
 * (coach / admin) et la liste des membres. Mêmes écrans pour l'espace club
 * et l'espace public — seuls les chargeurs et les liens changent.
 */
export function TeamPageView({
  tab,
  basePath,
  timezone,
  loadOverview,
  loadPlanning,
  matchHref,
  trainingHref,
  manageTrainingsHref,
}: {
  tab: TeamTab;
  /** URL de la page (sans `?vue=`) pour les onglets. */
  basePath: string;
  timezone: string;
  loadOverview: () => Promise<TeamOverviewDto>;
  loadPlanning: (period: { from: string; to: string }) => Promise<PlanningDto>;
  matchHref: (matchId: string) => string;
  trainingHref?: (event: PlanningEventDto) => string | null;
  /** Coach / admin : gestion des entraînements de l'équipe. */
  manageTrainingsHref?: string;
}) {
  const [state, setState] = useState<{ data: TeamOverviewDto | null; error: Error | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadOverview()
      .then((data) => !cancelled && setState({ data, error: null }))
      .catch((err: unknown) => !cancelled && setState({ data: null, error: err instanceof Error ? err : new Error("Chargement impossible.") }));
    return () => {
      cancelled = true;
    };
  }, [loadOverview]);

  if (!state) return <ListSkeleton rows={5} />;
  if (state.error || !state.data) return <ErrorState title="Équipe indisponible" description={state.error?.message ?? "Chargement impossible."} />;
  const team = state.data;
  const coaches = team.roster.filter((r) => r.isCoach);
  const players = team.roster.filter((r) => !r.isCoach);
  const href = (t: TeamTab) => (t === "apercu" ? basePath : `${basePath}?vue=${t}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="type-eyebrow">Équipe</p>
        <h1 className="type-title">{team.team.name}</h1>
        <p className="type-meta">
          {players.length} joueur{players.length > 1 ? "s" : ""}
          {coaches.length ? ` · ${coaches.length} coach${coaches.length > 1 ? "s" : ""}` : ""}
        </p>
      </div>
      <SegmentedControl
        label="Sections de l'équipe"
        className="w-full sm:w-auto"
        items={[
          { href: href("apercu"), label: "Vue d'ensemble", active: tab === "apercu" },
          { href: href("planning"), label: "Planning", active: tab === "planning" },
          { href: href("effectif"), label: "Effectif", active: tab === "effectif" },
        ]}
      />
      {tab === "planning" ? (
        <PlanningView timezone={timezone} load={loadPlanning} matchHref={matchHref} trainingHref={trainingHref} />
      ) : tab === "effectif" ? (
        <RosterTab team={team} />
      ) : (
        <OverviewTab team={team} timezone={timezone} matchHref={matchHref} effectifHref={href("effectif")} manageTrainingsHref={team.canManage ? manageTrainingsHref : undefined} />
      )}
    </div>
  );
}

function OverviewTab({ team, timezone, matchHref, effectifHref, manageTrainingsHref }: { team: TeamOverviewDto; timezone: string; matchHref: (id: string) => string; effectifHref: string; manageTrainingsHref?: string }) {
  const m = team.nextMatch;
  const t = team.nextTraining;
  const coaches = team.roster.filter((r) => r.isCoach);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="flex flex-col gap-3">
        <h2 className="type-eyebrow flex items-center gap-1.5 [&_svg]:size-3.5">
          <Trophy aria-hidden /> Prochain match
        </h2>
        {m ? (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-[16px] font-semibold text-foreground">{m.opponent ? `${m.isHome === false ? "À" : "Contre"} ${m.opponent}` : "Adversaire à confirmer"}</p>
              <p className="type-meta type-numeric">{shortDateTime(m.startsAt, timezone)}</p>
              <p className="type-meta flex flex-wrap items-center gap-2">
                {m.isHome === null ? null : <StatusBadge size="sm" tone={m.isHome ? "accent" : "neutral"}>{m.isHome ? "Domicile" : "Extérieur"}</StatusBadge>}
                {m.venueName ? (
                  <span className="inline-flex min-w-0 items-center gap-1 [&_svg]:size-3.5">
                    <MapPin aria-hidden /> <span className="truncate">{m.venueName}</span>
                  </span>
                ) : null}
              </p>
            </div>
            {m.convocation ? (
              <p className="rounded-[12px] bg-surface-muted px-3 py-2 text-[13.5px] text-foreground">
                {m.convocation.sent ? (
                  <>Convocation envoyée : {convocationSummary(m.convocation)}</>
                ) : m.availability?.open ? (
                  <>Disponibilités demandées{m.availability.noResponse ? ` · ${m.availability.noResponse} sans réponse` : " · tout le monde a répondu"} — convocation à préparer</>
                ) : (
                  <>Disponibilités pas encore demandées</>
                )}
              </p>
            ) : null}
            <Link href={`${matchHref(m.id)}${team.canManage ? "#vie-equipe" : ""}`} className="inline-flex items-center gap-1 self-start text-[14px] font-medium text-accent-text hover:underline [&_svg]:size-4">
              {team.canManage ? "Gérer le match" : "Voir le match"} <ArrowRight aria-hidden />
            </Link>
          </>
        ) : (
          <p className="type-meta">Aucun match programmé.</p>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="type-eyebrow flex items-center gap-1.5 [&_svg]:size-3.5">
          <Dumbbell aria-hidden /> Prochain entraînement
        </h2>
        {t ? (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-[16px] font-semibold text-foreground first-letter:uppercase">{relativeDay(t.startsAt, timezone)}</p>
              <p className="type-meta type-numeric">
                {timeOf(t.startsAt, timezone)}–{timeOf(t.endsAt, timezone)}
              </p>
              {locationLabel(t.location) ? (
                <p className="type-meta inline-flex min-w-0 items-center gap-1 [&_svg]:size-3.5">
                  <MapPin aria-hidden /> <span className="truncate">{locationLabel(t.location)}</span>
                </p>
              ) : null}
            </div>
            {t.counts ? (
              <p className="rounded-[12px] bg-surface-muted px-3 py-2 text-[13.5px] text-foreground">
                {t.counts.present} présent{t.counts.present > 1 ? "s" : ""} · {t.counts.absent} absent{t.counts.absent > 1 ? "s" : ""}
                {t.counts.uncertain ? ` · ${t.counts.uncertain} incertain${t.counts.uncertain > 1 ? "s" : ""}` : ""}
                {t.counts.noResponse ? ` · ${t.counts.noResponse} sans réponse` : ""}
              </p>
            ) : null}
          </>
        ) : (
          <p className="type-meta">Aucun entraînement prévu dans les 30 prochains jours.</p>
        )}
        {manageTrainingsHref ? (
          <Link href={manageTrainingsHref} className="inline-flex items-center gap-1 self-start text-[14px] font-medium text-accent-text hover:underline [&_svg]:size-4">
            Gérer les entraînements <ArrowRight aria-hidden />
          </Link>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-3 lg:col-span-2">
        <h2 className="type-eyebrow flex items-center gap-1.5 [&_svg]:size-3.5">
          <Megaphone aria-hidden /> Encadrement
        </h2>
        {coaches.length ? (
          <ul className="flex flex-wrap gap-3">
            {coaches.map((c) => (
              <li key={c.licencie.id} className="flex items-center gap-2">
                <PersonAvatar name={`${c.licencie.firstName} ${c.licencie.lastName}`} src={c.licencie.photoUrl} />
                <span className="text-[14px] font-medium text-foreground">
                  {c.licencie.firstName} {c.licencie.lastName}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="type-meta">Aucun coach rattaché à cette équipe (liste des joueurs).</p>
        )}
        <Link href={effectifHref} scroll={false} className="inline-flex items-center gap-1 self-start text-[14px] font-medium text-accent-text hover:underline [&_svg]:size-4">
          Voir l&apos;effectif <ArrowRight aria-hidden />
        </Link>
      </Card>
    </div>
  );
}

function RosterTab({ team }: { team: TeamOverviewDto }) {
  if (!team.roster.length) return <EmptyState title="Effectif vide" description="Aucun licencié actif n'est rattaché à cette équipe (liste des joueurs)." />;
  const linked = team.canManage ? team.roster.filter((r) => r.hasPersonalLink).length : null;
  return (
    <div className="flex flex-col gap-3">
      {linked !== null ? (
        <p className="type-meta">
          {linked} / {team.roster.length} avec un lien personnel actif
        </p>
      ) : null}
      <ul className="flex flex-col divide-y divide-border rounded-[14px] border border-border bg-surface-raised">
        {team.roster.map((r) => (
          <li key={r.licencie.id} className="flex min-h-14 items-center gap-3 px-3.5 py-2.5">
            <PersonAvatar name={`${r.licencie.firstName} ${r.licencie.lastName}`} src={r.licencie.photoUrl} />
            <p className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-foreground">
              {r.licencie.firstName} {r.licencie.lastName}
            </p>
            {r.isCoach ? (
              <StatusBadge size="sm" tone="info" icon={<Megaphone />}>
                Coach
              </StatusBadge>
            ) : null}
            {r.hasPersonalLink === null ? null : r.hasPersonalLink ? (
              <StatusBadge size="sm" tone="success" icon={<Link2 />}>
                Lien actif
              </StatusBadge>
            ) : (
              <StatusBadge size="sm" tone="neutral">
                Sans lien
              </StatusBadge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
