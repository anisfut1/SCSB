"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarDays, CalendarPlus, CalendarRange, ClipboardList, Dumbbell, Megaphone, Shirt, Trophy } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { Sheet } from "@/components/ui/Sheet";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { formatShortDateTime } from "@/features/derogation-requests/labels";
import { MatchCard } from "@/features/matches/MatchCard";
import { IdentifyView } from "@/features/public/IdentifyView";
import { PublicLoginPanel } from "@/features/public/PublicLoginApp";
import { usePublicIdentity, type PublicIdentity } from "@/features/public/PublicIdentityProvider";
import { TABLE_ROLE_LABELS } from "@/features/tables/role-labels";
import { ActionCenter } from "@/features/team-life/ActionCenter";
import { ApiError } from "@/lib/api/client";
import { getPublicHome, type HomeRelation, type PublicHomeDto } from "@/lib/api/publicHome";
import { groupByDay } from "./group-by-day";

interface HomeClub {
  name: string;
  logoUrl: string | null;
  timezone: string;
}

const RELATION_LABEL: Record<HomeRelation, string> = { COACH: "Tu coaches", PLAYER: "Ton équipe" };

/**
 * Accueil personnel (retour du club, 2026-10-01 : « un onglet accueil pour
 * les coachs, il verra son agenda avec les matchs de ses équipes et où il
 * doit coacher. Pareil pour le joueur : en fonction de sa licence, on sait
 * son équipe »). Données réelles uniquement (club-manager-api `/home`).
 */
export function PublicHomeApp({ clubSlug, club }: { clubSlug: string; club: HomeClub }) {
  const { identity, forget } = usePublicIdentity();

  if (identity === undefined) return <ListSkeleton rows={5} />;
  if (identity === null) return <PublicLoginPanel returnTo="accueil" title="Mon espace" lead="Ton équipe, tes prochains matchs et tes tables de marque au même endroit : retrouve ton nom pour recevoir ton lien d'accès par email." />;
  return <PersonalHome key={identity.token} clubSlug={clubSlug} club={club} identity={identity} onForget={forget} />;
}

function PersonalHome({ clubSlug, club, identity, onForget }: { clubSlug: string; club: HomeClub; identity: PublicIdentity; onForget: () => void }) {
  const [home, setHome] = useState<PublicHomeDto | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [addingPerson, setAddingPerson] = useState(false);
  const base = `/public/${clubSlug}`;

  useEffect(() => {
    let cancelled = false;
    getPublicHome(clubSlug, identity.token)
      .then((result) => !cancelled && setHome(result))
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err : new Error("Chargement impossible.")));
    return () => {
      cancelled = true;
    };
  }, [clubSlug, identity.token]);

  if (error instanceof ApiError && error.isUnauthorized) {
    return <ErrorState title="Lien personnel expiré" description="Ton lien a été remplacé ou révoqué. Demande un nouveau lien." action={<Button onClick={onForget}>Demander un nouveau lien</Button>} />;
  }
  if (error) return <ErrorState title="Accueil indisponible" description={error.message} />;
  if (!home) return <ListSkeleton rows={5} />;

  const cardClub = { name: club.name, logoUrl: club.logoUrl };
  const coachTeams = home.teams.filter((t) => t.relation === "COACH");
  const playerTeams = home.teams.filter((t) => t.relation === "PLAYER");

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow={club.name}
        title={`Bonjour ${home.licencie.firstName}`}
        description={coachTeams.length ? "Ton agenda de coach et tes prochains rendez-vous au club." : "Ton équipe, tes prochains matchs et tes rendez-vous au club."}
        meta={
          <>
            {playerTeams.map((t) => (
              <StatusBadge key={`p-${t.id}`} tone="accent" icon={<Shirt />}>
                Joue en {t.name}
              </StatusBadge>
            ))}
            {coachTeams.map((t) => (
              <StatusBadge key={`c-${t.id}`} tone="info" icon={<Megaphone />}>
                Coach {t.name}
              </StatusBadge>
            ))}
            {home.roles.coordinator ? <StatusBadge tone="neutral">Coordinateur</StatusBadge> : null}
            {home.roles.admin ? <StatusBadge tone="neutral">Admin</StatusBadge> : null}
          </>
        }
        actions={
          <>
            <ButtonLink href={`${base}/planning`} variant="secondary" icon={<CalendarRange />}>
              Planning
            </ButtonLink>
            {home.roles.coach || home.roles.admin ? (
              <ButtonLink href={`${base}/entrainements`} variant="secondary" icon={<Dumbbell />}>
                Entraînements
              </ButtonLink>
            ) : null}
            {home.roles.coach || home.roles.coordinator || home.roles.admin ? (
              <>
              {home.roles.coach ? (
                <ButtonLink href={`${base}/derogations/nouvelle`} variant="secondary" icon={<CalendarPlus />}>
                  Demander une dérogation
                </ButtonLink>
              ) : null}
              <ButtonLink href={`${base}/derogations`} variant="ghost" icon={<CalendarClock />}>
                Dérogations
              </ButtonLink>
              </>
            ) : null}
          </>
        }
      />

      <ActionCenter clubSlug={clubSlug} timezone={club.timezone} activeToken={identity.token} onAddPerson={() => setAddingPerson(true)} />
      <Sheet
        open={addingPerson}
        onClose={() => setAddingPerson(false)}
        title="Ajouter un enfant"
        description="Un parent avec plusieurs enfants au club : retrouve le nom de l'autre enfant et ouvre son lien sur ce téléphone. Les entraînements de chacun s'afficheront ensemble ici."
        side="bottom"
      >
        <IdentifyView clubSlug={clubSlug} clubName={club.name} returnTo="accueil" searchFirst header={<span />} />
      </Sheet>

      {home.teams.length === 0 ? (
        <Notice tone="info">
          Aucune équipe n&apos;est encore associée à ton profil. Un responsable du club peut t&apos;ajouter à ton équipe {home.roles.coach ? "ou à celles que tu coaches " : ""}depuis la liste des joueurs.
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="agenda-title" className="flex flex-col gap-4">
          <SectionHeader
            id="agenda-title"
            title={coachTeams.length ? "Mon agenda" : "Prochains matchs"}
            description={coachTeams.length ? "Les matchs de tes équipes : où et quand tu coaches." : undefined}
            action={
              <ButtonLink href={`${base}/matchs`} variant="ghost" size="sm" iconRight={<ArrowRight />}>
                Tous les matchs
              </ButtonLink>
            }
          />
          {home.upcoming.length === 0 ? (
            <EmptyState compact icon={<CalendarDays />} title="Aucun match à venir" description={home.teams.length ? "Les prochains matchs de tes équipes apparaîtront ici dès leur publication par la FFBB." : "Ton agenda s'affichera dès qu'une équipe sera associée à ton profil."} />
          ) : (
            <DayGroups
              groups={groupByDay(home.upcoming, (e) => e.match.matchDatetime, club.timezone)}
              render={({ match, relations }) => (
                <div className="flex flex-col gap-1.5">
                  {home.teams.length > 1 || relations.includes("COACH") ? (
                    <p className="flex flex-wrap gap-1.5">
                      {relations.map((r) => (
                        <StatusBadge key={r} size="sm" tone={r === "COACH" ? "info" : "accent"} icon={r === "COACH" ? <Megaphone /> : <Shirt />}>
                          {RELATION_LABEL[r]}
                        </StatusBadge>
                      ))}
                    </p>
                  ) : null}
                  <MatchCard match={match} href={`${base}/matchs/${match.id}`} club={cardClub} hideDate />
                </div>
              )}
              itemKey={(e) => e.match.id}
            />
          )}
        </section>

        <aside className="flex flex-col gap-8">
          <section aria-labelledby="duties-title" className="flex flex-col gap-3">
            <SectionHeader id="duties-title" title="Mes tables de marque" as="h2" />
            {home.tableDuties.length === 0 ? (
              <p className="type-meta">
                Aucune table de marque prévue.{" "}
                <Link href={`${base}/tables`} className="font-medium text-accent-text underline-offset-2 hover:underline">
                  Se positionner
                </Link>
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {home.tableDuties.map((d) => (
                  <li key={`${d.matchId}-${d.role}`}>
                    <Card padded={false} className="flex items-start gap-3 p-3.5">
                      <span aria-hidden className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text [&_svg]:size-4">
                        <ClipboardList />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-foreground">{TABLE_ROLE_LABELS[d.role]}</p>
                        <p className="type-meta truncate">
                          <span className="type-numeric">{formatShortDateTime(d.matchDatetime, club.timezone)}</span>
                          {d.teamName ? ` · ${d.teamName}` : ""}
                          {d.opponentName ? ` vs ${d.opponentName}` : ""}
                        </p>
                      </div>
                    </Card>
                  </li>
                ))}
                <li>
                  <Link href={`${base}/tables`} className="type-meta font-medium text-accent-text underline-offset-2 hover:underline">
                    Voir les tables de marque
                  </Link>
                </li>
              </ul>
            )}
          </section>

          <section aria-labelledby="results-title" className="flex flex-col gap-3">
            <SectionHeader id="results-title" title="Derniers résultats" />
            {home.recentResults.length === 0 ? (
              <EmptyState compact icon={<Trophy />} title="Pas encore de résultat" description="Les scores de tes équipes apparaissent ici dès leur publication." />
            ) : (
              <DayGroups
                groups={groupByDay(home.recentResults, (e) => e.match.matchDatetime, club.timezone)}
                render={({ match }) => <MatchCard match={match} href={`${base}/matchs/${match.id}`} club={cardClub} hideDate />}
                itemKey={(e) => e.match.id}
                compact
              />
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

/** Un en-tête de date par jour, puis les matchs de ce jour (jamais la même date répétée sur chaque carte). */
function DayGroups<T>({ groups, render, itemKey, compact }: { groups: ReturnType<typeof groupByDay<T>>; render: (item: T) => React.ReactNode; itemKey: (item: T) => string; compact?: boolean }) {
  return (
    <ol className={compact ? "flex flex-col gap-5" : "flex flex-col gap-7"}>
      {groups.map((g) => (
        <li key={g.key} className="flex flex-col gap-2.5">
          <h3 className="flex items-baseline gap-2 border-b border-border pb-1.5">
            <span className={compact ? "text-[14px] font-semibold text-foreground" : "text-[15.5px] font-semibold text-foreground"}>{g.label}</span>
            {g.items.length > 1 ? <span className="type-meta">{g.items.length} matchs</span> : null}
          </h3>
          <ul className="flex flex-col gap-3">
            {g.items.map((item) => (
              <li key={itemKey(item)}>{render(item)}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
