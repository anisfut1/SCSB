"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarCheck2, Megaphone, Pencil, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import { Notice } from "@/components/ui/Notice";
import { SectionHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api/client";
import type { MatchTeamLifeDto } from "@/lib/api/teamLife";
import { ConvocationSheet } from "./ConvocationSheet";
import type { TeamLifeClient } from "./team-life-client";

const CHANGE_LABEL: Record<string, string> = { DATE: "la date ou l'heure", VENUE: "le lieu", STATUS: "le statut (annulé / reporté)" };

/**
 * Bloc « Disponibilités et convocation » du détail d'un match, pour le coach
 * de l'équipe ou un admin (club : compte ; public : lien personnel). Rien
 * pour les autres (l'API répond 403 → bloc absent). Trois étapes distinctes :
 * demander les disponibilités → préparer la convocation → suivre les
 * confirmations.
 */
export function MatchTeamLifePanel({ client, matchId, timezone }: { client: TeamLifeClient; matchId: string; timezone: string }) {
  const [data, setData] = useState<MatchTeamLifeDto | null>(null);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "select" | "preview">(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    client
      .match(matchId)
      .then((d) => !cancelled && setData(d))
      .catch((err: unknown) => {
        if (cancelled) return;
        // Pas coach de cette équipe (403), match sans équipe (409), lien absent : bloc absent.
        if (err instanceof ApiError && (err.status === 403 || err.status === 404 || err.status === 409 || err.status === 400 || err.isUnauthorized)) setHidden(true);
        else setError(err instanceof Error ? err.message : "Chargement impossible.");
      });
    return () => {
      cancelled = true;
    };
  }, [client, matchId]);

  if (hidden) return null;
  if (!data) {
    return error ? <Notice tone="danger">{error}</Notice> : <Skeleton className="h-40 w-full rounded-[18px]" />;
  }

  const a = data.availability;
  const conv = data.convocation;
  const sent = conv && conv.revision > 0 ? conv : null;

  async function openAvailability() {
    setBusy(true);
    setError(null);
    try {
      setData(await client.openAvailability(matchId));
      flash("Disponibilités demandées : les joueurs et parents les voient sur leur accueil.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  }

  const groups = [
    { key: "AVAILABLE", title: "Disponibles", tone: "text-success" },
    { key: "UNCERTAIN", title: "Incertains", tone: "text-warning" },
    { key: null, title: "Sans réponse", tone: "text-muted" },
    { key: "UNAVAILABLE", title: "Indisponibles", tone: "text-danger" },
  ] as const;

  return (
    <section id="vie-equipe" aria-labelledby="vie-equipe-title" className="flex scroll-mt-24 flex-col gap-4">
      <SectionHeader id="vie-equipe-title" title="Disponibilités et convocation" description="Disponible, convoqué et confirmé sont trois étapes distinctes. Rien n'est envoyé aux familles avant « Envoyer la convocation »." />
      {data.matchClosed ? <Notice tone="info">Match passé, annulé ou reporté : plus de demande ni de confirmation possible.</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground [&_svg]:size-[18px] [&_svg]:text-accent-text">
            <Users aria-hidden /> 1. Disponibilités
          </h3>
          {!a.openedAt && !data.matchClosed ? (
            <Button variant="primary" size="sm" loading={busy} onClick={() => void openAvailability()}>
              Demander les disponibilités
            </Button>
          ) : null}
        </div>
        {!a.openedAt ? (
          <p className="type-meta">Les joueurs et parents de l&apos;équipe répondront Disponible / Indisponible / Incertain depuis leur accueil. Aucune convocation n&apos;est créée à cette étape.</p>
        ) : (
          <>
            <Counts
              items={[
                ["Disponibles", a.counts.available, "text-success"],
                ["Indisponibles", a.counts.unavailable, "text-danger"],
                ["Incertains", a.counts.uncertain, "text-warning"],
                ["Sans réponse", a.counts.noResponse, "text-muted"],
              ]}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {groups.map((g) => {
                const names = a.roster.filter((r) => r.response === g.key).map((r) => `${r.licencie.firstName} ${r.licencie.lastName}`);
                if (names.length === 0) return null;
                return (
                  <div key={g.title}>
                    <p className={cn("text-[12px] font-semibold uppercase tracking-wide", g.tone)}>{g.title}</p>
                    <p className="mt-1 text-[14px] text-foreground">{names.join(", ")}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground [&_svg]:size-[18px] [&_svg]:text-accent-text">
            <Megaphone aria-hidden /> 2. Convocation
          </h3>
          {!data.matchClosed ? (
            sent ? (
              <Button variant="secondary" size="sm" icon={<Pencil />} onClick={() => setSheet("select")}>
                Modifier la convocation
              </Button>
            ) : (
              <Button variant="primary" size="sm" icon={<Send />} onClick={() => setSheet("select")}>
                Préparer la convocation
              </Button>
            )
          ) : null}
        </div>

        {sent && sent.matchChanges.length ? (
          <Notice
            tone="warning"
            icon={<AlertTriangle />}
            action={
              data.matchClosed ? null : (
                <Button size="sm" variant="secondary" onClick={() => setSheet("preview")}>
                  Mettre à jour la convocation
                </Button>
              )
            }
          >
            Le match a été modifié depuis l&apos;envoi de la convocation ({sent.matchChanges.map((c) => CHANGE_LABEL[c]).join(", ")}). Les familles voient toujours la version envoyée.
          </Notice>
        ) : null}
        {sent && sent.hasUnsentChanges && !data.matchClosed ? (
          <Notice tone="info" action={<Button size="sm" variant="secondary" onClick={() => setSheet("preview")}>Envoyer la mise à jour</Button>}>
            Des modifications ne sont pas encore envoyées : les familles voient la version précédente.
          </Notice>
        ) : null}

        {!sent ? (
          <p className="type-meta">{conv ? "Brouillon en cours (jamais visible des familles)." : "Choisis les joueurs, l'heure et le lieu de rendez-vous, puis vérifie l'aperçu avant d'envoyer."}</p>
        ) : (
          <>
            <Counts
              items={[
                ["Convoqués", sent.counts.convoked, "text-foreground"],
                ["Confirmés", sent.counts.confirmed, "text-success"],
                ["Refus", sent.counts.declined, "text-danger"],
                ["En attente", sent.counts.pending, "text-muted"],
              ]}
            />
            <ul className="flex flex-col divide-y divide-border rounded-[14px] border border-border">
              {sent.recipients.map((r) => (
                <li key={r.licencie.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[14px]">
                  <span className="min-w-0 truncate text-foreground">
                    {r.licencie.firstName} {r.licencie.lastName}
                  </span>
                  <span className={cn("shrink-0 text-[13px] font-medium", r.response === "CONFIRMED" ? "text-success" : r.response === "DECLINED" ? "text-danger" : "text-muted")}>
                    {r.response === "CONFIRMED" ? "Confirmé" : r.response === "DECLINED" ? "A décliné la convocation" : "En attente"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="type-meta flex items-center gap-1.5 [&_svg]:size-3.5">
              <CalendarCheck2 aria-hidden />
              Envoyée{sent.revision > 1 ? ` (mise à jour n° ${sent.revision - 1})` : ""}.
            </p>
          </>
        )}
      </Card>

      {sheet ? (
        <ConvocationSheet
          client={client}
          data={data}
          timezone={timezone}
          initialStep={sheet}
          onClose={() => setSheet(null)}
          onSent={(dto) => {
            setData(dto);
            flash(dto.convocation && dto.convocation.revision > 1 ? "Mise à jour envoyée." : "Convocation envoyée : elle apparaît sur l'accueil de chaque famille.");
          }}
        />
      ) : null}
      {toast ? <Toast message={toast} /> : null}
    </section>
  );
}

function Counts({ items }: { items: (readonly [string, number, string])[] }) {
  return (
    <dl className="grid grid-cols-4 gap-2">
      {items.map(([label, value, tone]) => (
        <div key={label} className="flex flex-col items-center rounded-[12px] border border-border bg-surface-raised px-1 py-2.5 text-center">
          <dd className={cn("type-numeric text-[20px] font-semibold", tone)}>{value}</dd>
          <dt className="text-[11.5px] font-medium leading-tight text-muted">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
