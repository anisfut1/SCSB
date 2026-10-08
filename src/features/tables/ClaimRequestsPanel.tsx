"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Hourglass, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Field";
import { SectionHeader } from "@/components/ui/PageHeader";
import { PersonAvatar } from "@/components/ui/Avatar";
import { useConfirm } from "@/components/ui/Dialog";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { ClaimRequestDto } from "@/lib/api/tables";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

/**
 * Demandes de lien pour une fiche sans adresse email (retour du club,
 * 2026-10-08 : « si ce n'est pas son mail, c'est l'admin qui décide de lui
 * envoyer ou non, pour éviter qu'un mec fasse envoyer 40 mails »). Rien n'est
 * envoyé à la personne avant l'approbation. Masqué quand il n'y en a aucune.
 */
export function ClaimRequestsPanel({ clubId, requests }: { clubId: string; requests: ClaimRequestDto[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  if (requests.length === 0) return null;

  async function decide(request: ClaimRequestDto, decision: "approve" | "reject") {
    const name = `${request.licencie.firstName} ${request.licencie.lastName}`;
    const ok = await confirm(
      decision === "approve"
        ? {
            title: `Envoyer le lien de ${name} ?`,
            description: `Le lien personnel part à ${request.requestedEmail ?? "l'adresse demandée"}, qui devient l'adresse de sa fiche. Fais-le seulement si tu es sûr·e que c'est la sienne.`,
            confirmLabel: "Approuver et envoyer",
          }
        : {
            title: "Refuser la demande ?",
            description: `Rien n'est envoyé et l'adresse saisie est effacée. ${request.licencie.firstName} pourra refaire une demande.`,
            confirmLabel: "Refuser",
            destructive: true,
          },
    );
    if (!ok) return;

    setBusy(`${request.id}:${decision}`);
    setError(null);
    try {
      await browserApi.tables.decideClaimRequest(clubId, request.id, decision);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible pour le moment.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="Demandes à valider"
        description={`${requests.length} demande${requests.length > 1 ? "s" : ""} de lien pour une fiche sans email. Rien n'est envoyé avant ta décision.`}
      />
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
      <ul className="surface-card divide-y divide-border overflow-hidden">
        {requests.map((request) => {
          const name = `${request.licencie.firstName} ${request.licencie.lastName}`;
          return (
            <li key={request.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <PersonAvatar name={name} size="sm" />
              <div className="flex min-w-0 flex-1 basis-48 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{name}</span>
                <span className="type-meta truncate">
                  <Hourglass className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />
                  {request.requestedEmail ?? "Adresse inconnue"} · {dateFormat.format(new Date(request.createdAt))}
                </span>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="secondary" size="sm" icon={<X />} loading={busy === `${request.id}:reject`} disabled={busy !== null} onClick={() => decide(request, "reject")}>
                  Refuser
                </Button>
                <Button variant="primary" size="sm" icon={<Check />} loading={busy === `${request.id}:approve`} disabled={busy !== null} onClick={() => decide(request, "approve")}>
                  Approuver
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {confirmDialog}
    </section>
  );
}
