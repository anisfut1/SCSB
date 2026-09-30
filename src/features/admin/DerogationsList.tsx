"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { DataList } from "@/components/ui/DataList";
import { EmptyState } from "@/components/ui/States";
import { Notice } from "@/components/ui/Notice";
import { cn } from "@/components/ui/cn";
import type { DerogationListItemDto } from "@/lib/api/derogations";
import { RespondToDerogationAction } from "@/features/derogations/RespondToDerogationAction";

// `timeZone: "Europe/Paris"` explicite partout ci-dessous — jamais le
// fuseau ambiant du runtime (UTC côté rendu serveur Vercel, potentiellement
// différent aussi côté navigateur) : demande du club, 2026-09-27,
// "elle est a 18h sur notre outil" alors que FBI/FFBB disent 20h pour la
// MÊME rencontre — `match_datetime` était pourtant déjà stocké juste en
// UTC, seul l'affichage oubliait de reconvertir en heure française. Le
// basket géré ici n'existe qu'en France : toujours Europe/Paris.
function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) : "—";
}

/**
 * "en prenant le créneau du match de 15h" (demande du club, 2026-09-26) —
 * affiche la plage 2h COMPLÈTE du match déjà prévu, jamais juste son heure
 * de début, pour que l'alerte explique elle-même pourquoi il y a conflit.
 */
function formatSlotRange(matchDatetimeIso: string): string {
  const start = new Date(matchDatetimeIso);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const dateLabel = start.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
  const startLabel = start.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
  const endLabel = end.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
  return `${dateLabel} ${startLabel}–${endLabel}`;
}

/**
 * `demandeur` ("Domicile"/"Visiteur") est un jargon FBI relatif à CETTE
 * rencontre précise, jamais toujours "notre équipe" — demande du club,
 * 2026-09-27 : "c ecrit demandeur domicile mais je sais pas cest qui qui
 * joue à domicile" (ex. rencontre 9538 : Montpellier est domicile, Sète
 * est visiteur — "Domicile" y désigne donc Montpellier). Résolu vers le
 * nom réel via `domicile`/`visiteur` (mêmes champs bruts FBI que la page
 * de détail), jamais deviné : `null` si le libellé FBI n'est ni
 * "Domicile" ni "Visiteur" (valeur imprévue) ou si le nom correspondant
 * n'a pas pu être lu.
 */
function resolveDemandeurTeam(derogation: Pick<DerogationListItemDto, "demandeur" | "domicile" | "visiteur">): string | null {
  if (derogation.demandeur === "Domicile") return derogation.domicile;
  if (derogation.demandeur === "Visiteur") return derogation.visiteur;
  return null;
}

/**
 * "sur la page dérogation met moi un filtre avec des boutons pour choisir
 * par état" — les boutons sont générés DYNAMIQUEMENT à partir des `etat`
 * réellement présents dans la liste reçue de club-manager-api (jamais un
 * libellé FBI deviné/codé en dur : voir docs/FBI.md côté club-manager-api,
 * les vraies valeurs — "En Cours", "Acceptée par...", "Refusée" — ne sont
 * connues qu'à l'exécution). Filtre 100% client (la liste complète est déjà
 * chargée), aucun aller-retour serveur par clic.
 */
export function DerogationsList({ clubId, clubSlug, derogations }: { clubId: string; clubSlug: string; derogations: DerogationListItemDto[] }) {
  const [selectedEtat, setSelectedEtat] = useState<string | null>(null);

  const etatCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const derogation of derogations) {
      if (!derogation.etat) continue;
      counts.set(derogation.etat, (counts.get(derogation.etat) ?? 0) + 1);
    }
    // Tri alphabétique — pas d'ordre de priorité FBI connu/confirmé, jamais deviné.
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b, "fr"));
  }, [derogations]);

  const filtered = selectedEtat === null ? derogations : derogations.filter((d) => d.etat === selectedEtat);

  if (derogations.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock />}
        title="Aucune dérogation connue"
        description="Lance une vérification globale depuis Intégrations → FBI pour récupérer les demandes de dérogation connues de FBI."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Filtrer par état" className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <FilterButton active={selectedEtat === null} onClick={() => setSelectedEtat(null)} count={derogations.length}>
          Toutes
        </FilterButton>
        {etatCounts.map(([etat, count]) => (
          <FilterButton key={etat} active={selectedEtat === etat} onClick={() => setSelectedEtat(etat)} count={count}>
            {etat}
          </FilterButton>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucune dérogation pour cet état" description="Choisis un autre filtre ci-dessus." compact />
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((derogation) => {
            const demandeurTeam = resolveDemandeurTeam(derogation);
            return (
              <li key={derogation.id}>
                <Card data-glow={derogation.actionRequired || undefined}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="text-reflow flex-1">
                      <p className="type-eyebrow">{derogation.etat ?? "État inconnu"}</p>
                      <h2 className="type-card mt-1 text-foreground">
                        <Link href={`/c/${clubSlug}/matchs/${derogation.matchId}`} className="underline-offset-4 hover:text-accent-text hover:underline">
                          Rencontre {derogation.numero ?? "?"}
                          {/*
                           * `teamName` (ex. "Seniors 2") plutôt que `categoryLabel`
                           * (ex. "Seniors") — demande du club, 2026-09-26 : "faut
                           * préciser quelle équipe, seniors ya 4 equipes SM1 SM2
                           * SM3 SF, pareil sur dautres catégories". Repli sur
                           * `categoryLabel` si l'équipe du club n'a pas pu être
                           * résolue (match non retrouvé côté FFBB).
                           */}
                          {derogation.teamName ?? derogation.categoryLabel ? ` (${derogation.teamName ?? derogation.categoryLabel})` : ""} — vs {derogation.opponentName ?? "?"}
                        </Link>
                      </h2>
                      <p className="type-meta mt-1">Match FFBB : {formatDateTime(derogation.matchDatetime)}</p>
                    </div>
                    {/*
                     * "sur la derog si action besoin de ma part, faut un badge
                     * action requise" (demande du club, 2026-09-27) — vrai
                     * uniquement quand c'est au CLUB de répondre.
                     */}
                    {derogation.actionRequired ? (
                      <StatusBadge tone="warning" icon={<BellRing />}>
                        Action requise
                      </StatusBadge>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-col gap-5">
                    {derogation.scheduleConflict ? (
                      <Notice tone="danger" title="Conflit de créneau (un créneau de match dure 2h)">
                        Un match {derogation.scheduleConflict.teamName ? `de l'équipe ${derogation.scheduleConflict.teamName} ` : ""}est déjà prévu sur le créneau {formatSlotRange(derogation.scheduleConflict.matchDatetime)} — Rencontre{" "}
                        {derogation.scheduleConflict.numero ?? "?"} vs {derogation.scheduleConflict.opponentName ?? "?"}.
                      </Notice>
                    ) : null}

                    {derogation.actionRequired ? <RespondToDerogationAction clubId={clubId} derogationId={derogation.id} /> : null}

                    <DataList
                      columns={3}
                      items={[
                        { label: "État", value: derogation.etat ?? "—" },
                        // Une même rencontre peut avoir PLUSIEURS dérogations distinctes (docs/FBI.md côté club-manager-api) — la date de dépôt les distingue.
                        { label: "Date de dépôt", value: derogation.dateDepot ?? "—" },
                        { label: "Demandeur", value: `${derogation.demandeur ?? "—"}${demandeurTeam ? ` (${demandeurTeam})` : ""}` },
                        { label: "Rencontre initiale", value: `${derogation.dateRencontre ?? "—"} ${derogation.heure ?? ""}`.trim() },
                        { label: "Rencontre demandée", value: `${derogation.dateRencontreDemandee ?? "—"} ${derogation.heureDemandee ?? ""}`.trim() },
                        { label: "Date de dérogation", value: derogation.dateDerogation ?? "—" },
                        { label: "Motif de la demande", value: derogation.motif ?? "—", span: 2 },
                        { label: "Dernière vérification", value: formatDateTime(derogation.checkedAt) },
                      ]}
                    />

                    {derogation.adversaire || derogation.dateReponse || derogation.acceptation || derogation.motifRefus ? (
                      <div className="surface-panel flex flex-col gap-3 p-4">
                        <p className="type-eyebrow">Réponse de l&apos;adversaire</p>
                        <DataList
                          items={[
                            { label: "Adversaire", value: derogation.adversaire ?? "—" },
                            { label: "Date de réponse", value: derogation.dateReponse ?? "—" },
                            { label: "Acceptation", value: derogation.acceptation ?? "—" },
                            { label: "Motif de refus", value: derogation.motifRefus ?? "—" },
                          ]}
                        />
                      </div>
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, count, children }: { active: boolean; onClick: () => void; count: number; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-[10px] border px-3 text-[13px] font-medium transition-[background-color,border-color,box-shadow,color] duration-150",
        active ? "border-accent-border bg-accent-soft text-accent-text shadow-glow-xs" : "border-border bg-surface-raised text-muted shadow-1 hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
      <span className={cn("type-numeric rounded-full px-1.5 text-[11px] leading-5", active ? "bg-surface-raised/70" : "bg-surface-muted")}>{count}</span>
    </button>
  );
}
