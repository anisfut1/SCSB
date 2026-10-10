"use client";

import { useState } from "react";
import { BellRing, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TeamLifeMatchDto } from "@/lib/api/teamLife";
import { matchTitle, shortDateTime } from "./labels";

/** Texte de relance à partager (WhatsApp…) : prénoms seulement, jamais de coordonnées. */
export function reminderText(kind: "availability" | "convocation", match: Pick<TeamLifeMatchDto, "team" | "opponent" | "startsAt">, firstNames: string[], timezone: string): string {
  const what = kind === "availability" ? "donner vos disponibilités" : "confirmer la convocation";
  return `Rappel : merci de ${what} sur Ball Manager pour ${matchTitle(match)} (${shortDateTime(match.startsAt, timezone)}). En attente : ${firstNames.join(", ")}.`;
}

/**
 * Relance en un clic des sans réponse (retour du club, 2026-10-10). Marque
 * la relance : « Le coach attend ta réponse » sur l'accueil des personnes
 * concernées. Aucun email / push en V1 : on propose aussi de partager le
 * texte (groupe WhatsApp de l'équipe, SMS…) depuis le téléphone du coach.
 */
export function RemindBlock({
  kind,
  match,
  firstNames,
  remindedAt,
  timezone,
  onRemind,
}: {
  kind: "availability" | "convocation";
  match: Pick<TeamLifeMatchDto, "team" | "opponent" | "startsAt">;
  firstNames: string[];
  remindedAt: string | null;
  timezone: string;
  onRemind: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  if (firstNames.length === 0) return null;
  const text = reminderText(kind, match, firstNames, timezone);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function remind() {
    setBusy(true);
    try {
      await onRemind();
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    try {
      if (canShare) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Partage annulé par l'utilisateur : rien à faire.
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-[12px] border border-border bg-surface-muted px-3.5 py-3">
      <p className="text-[13.5px] text-foreground">
        <span className="font-medium">{firstNames.length} sans réponse</span> : {firstNames.join(", ")}
      </p>
      {remindedAt ? <p className="type-meta">Relancé {shortDateTime(remindedAt, timezone).toLowerCase()} — visible sur leur accueil.</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={remindedAt ? "secondary" : "primary"} icon={<BellRing />} loading={busy} onClick={() => void remind()}>
          {remindedAt ? "Relancer à nouveau" : `Relancer (${firstNames.length})`}
        </Button>
        <Button size="sm" variant="ghost" icon={canShare ? <Share2 /> : <Copy />} onClick={() => void share()}>
          {copied ? "Message copié" : canShare ? "Partager le message" : "Copier le message"}
        </Button>
      </div>
    </div>
  );
}
