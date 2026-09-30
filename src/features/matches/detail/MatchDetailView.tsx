import type { ReactNode } from "react";
import { BarChart3, FileText, Info, Scale, Users } from "lucide-react";
import { TabsNav } from "@/components/ui/Tabs";
import type { DerogationStatusDto, MatchDetailsDto, MatchDocumentDto } from "@/lib/api/matches";
import { DerogationCard } from "../DerogationCard";
import { MATCH_TABS, type MatchTab } from "./labels";
import { CompositionPanel, EmarquePanel, InformationsPanel, OfficialsPanel, StatsPanel } from "./Panels";
import { Scoreboard, type ScoreboardTeam } from "./Scoreboard";

const TAB_ICONS: Record<MatchTab, ReactNode> = {
  informations: <Info />,
  composition: <Users />,
  statistiques: <BarChart3 />,
  officiels: <Scale />,
  emarque: <FileText />,
};

/**
 * Fiche match partagée entre l'espace club et la vue publique. `mode`
 * public ⇒ `isAdmin` ignoré (jamais d'action), pas de lien vers les fiches
 * joueurs (protégées par un compte).
 */
export function MatchDetailView({
  match,
  derogation,
  documents,
  tab,
  basePath,
  club,
  derogationClubId,
  mode,
  isAdmin,
  playerBasePath,
}: {
  match: MatchDetailsDto;
  derogation: DerogationStatusDto | null;
  documents: MatchDocumentDto[] | null;
  tab: MatchTab;
  basePath: string;
  club: { name: string; logoUrl: string | null };
  /** Identifiant transmis à DerogationCard (clubId côté club, slug côté public — inchangé). */
  derogationClubId: string;
  mode: "club" | "public";
  isAdmin: boolean;
  playerBasePath?: string;
}) {
  const admin = mode === "club" && isAdmin;
  // match.teamName vient de teams.name (via team_id) — souvent null en
  // pratique (constaté en production le 2026-09-24 : team_id absent sur
  // tout l'historique synchronisé avant l'introduction des équipes) : se
  // rabattre sur le nom du club plutôt qu'un "Équipe" générique.
  const ours: ScoreboardTeam = { name: match.teamName ?? club.name, logoUrl: club.logoUrl, isClub: true };
  const theirs: ScoreboardTeam = { name: match.opponentName ?? "?", logoUrl: match.opponentLogoUrl, isClub: false };
  const [home, away] = match.isHome ? [ours, theirs] : [theirs, ours];
  const detailHref = `${basePath}/${match.id}`;

  return (
    <div className="flex flex-col gap-6">
      <Scoreboard match={match} home={home} away={away} />

      <TabsNav
        label="Sections de la fiche match"
        items={MATCH_TABS.map((t) => ({ href: `${detailHref}?tab=${t.value}`, label: t.label, icon: TAB_ICONS[t.value], active: tab === t.value }))}
      />

      <div className="[animation:rise-in_var(--duration-slow)_var(--ease-out)]" key={tab}>
        {tab === "informations" ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <InformationsPanel match={match} home={home} away={away} />
            <DerogationCard clubId={derogationClubId} matchId={match.id} derogation={derogation} isAdmin={admin} />
          </div>
        ) : null}
        {tab === "composition" ? <CompositionPanel match={match} home={home} away={away} /> : null}
        {tab === "statistiques" ? <StatsPanel match={match} home={home} away={away} playerBasePath={mode === "club" ? playerBasePath : undefined} /> : null}
        {tab === "officiels" ? <OfficialsPanel match={match} /> : null}
        {tab === "emarque" ? <EmarquePanel match={match} documents={documents ?? []} mode={mode} isAdmin={admin} /> : null}
      </div>
    </div>
  );
}
