"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarDays, CalendarPlus, ClipboardList, Megaphone, Shirt, Trophy } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { formatShortDateTime } from "@/features/derogation-requests/labels";
import { MatchCard } from "@/features/matches/MatchCard";
import { IdentifyView } from "@/features/public/IdentifyView";
import { usePublicIdentity, type PublicIdentity } from "@/features/public/PublicIdentityProvider";
import { TABLE_ROLE_LABELS } from "@/features/tables/role-labels";
import { ApiError } from "@/lib/api/client";
import { getPublicHome, type HomeRelation, type PublicHomeDto } from "@/lib/api/publicHome";

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
  if (identity === null) {
    return (
      <IdentifyView
        clubSlug={clubSlug}
        clubName={club.name}
        returnTo="accueil"
        title="Mon espace"
        description="Retrouve ton nom pour recevoir ton lien personnel par email : ton équipe, tes prochains matchs et tes tables de marque au même endroit."
      />
    );
  }
  return <PersonalHome key={identity.token} clubSlug={clubSlug} club={club} identity={identity} onForget={forget} />;
}

function PersonalHome({ clubSlug, club, identity, onForget }: { clubSlug: string; club: HomeClub; identity: PublicIdentity; onForget: () => void }) {
  const [home, setHome] = useState<PublicHomeDto | null>(null);
  const [error, setError] = useState<Error | null>(null);
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
          home.roles.coach || home.roles.coordinator || home.roles.admin ? (
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
          ) : null
        }
      />

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
            <ul className="flex flex-col gap-3">
              {home.upcoming.map(({ match, relations }) => (
                <li key={match.id} className="flex flex-col gap-1.5">
                  {home.teams.length > 1 || relations.includes("COACH") ? (
                    <p className="flex flex-wrap gap-1.5">
                      {relations.map((r) => (
                        <StatusBadge key={r} size="sm" tone={r === "COACH" ? "info" : "accent"} icon={r === "COACH" ? <Megaphone /> : <Shirt />}>
                          {RELATION_LABEL[r]}
                        </StatusBadge>
                      ))}
                    </p>
                  ) : null}
                  <MatchCard match={match} href={`${base}/matchs/${match.id}`} club={cardClub} />
                </li>
              ))}
            </ul>
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
              <ul className="flex flex-col gap-3">
                {home.recentResults.map(({ match }) => (
                  <li key={match.id}>
                    <MatchCard match={match} href={`${base}/matchs/${match.id}`} club={cardClub} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
