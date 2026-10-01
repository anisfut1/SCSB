import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import type { DerogationRequestStatus, DerogationRequestSummaryDto } from "@/lib/api/derogationRequests";

/**
 * Carte d'accueil des demandes de dérogation internes : compteurs réels
 * (jamais estimés). Coordinateur : nouvelles / en cours / en attente du
 * coach. Coach : à revoir / envoyées / en cours.
 */
export function DashboardRequestsCard({ requests, manager, href }: { requests: DerogationRequestSummaryDto[]; manager: boolean; href: string }) {
  const count = (status: DerogationRequestStatus) => requests.filter((r) => r.status === status).length;
  const rows = manager
    ? [
        { label: "Nouvelles", value: count("REQUESTED"), highlight: true },
        { label: "En cours", value: count("IN_PROGRESS"), highlight: false },
        { label: "Attente coach", value: count("NEEDS_CHANGE"), highlight: false },
      ]
    : [
        { label: "À revoir", value: count("NEEDS_CHANGE"), highlight: true },
        { label: "Envoyées", value: count("REQUESTED"), highlight: false },
        { label: "En cours", value: count("IN_PROGRESS"), highlight: false },
      ];

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader
        icon={<CalendarClock />}
        title={manager ? "Demandes de dérogation" : "Mes demandes de dérogation"}
        description={manager ? "Envoyées par les coachs." : "Suivi de tes demandes au coordinateur."}
      />
      <dl className="grid grid-cols-3 gap-2">
        {rows.map((row) => (
          <div key={row.label} className={cn("flex flex-col gap-1 rounded-[var(--radius-md)] border px-3 py-2.5", row.highlight && row.value > 0 ? "border-accent-border bg-accent-softer" : "border-border bg-surface")}>
            <dt className="text-[11.5px] font-medium leading-tight text-muted">{row.label}</dt>
            <dd className="type-numeric text-[22px] font-medium leading-none text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
      <Link href={href} className="inline-flex items-center gap-1.5 self-start text-[13.5px] font-medium text-accent-text underline-offset-4 hover:underline">
        Ouvrir les dérogations
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </Card>
  );
}
