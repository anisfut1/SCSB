import { CheckCircle2, Loader2, OctagonAlert } from "lucide-react";
import { cn } from "./cn";

export type ActionStatusValue = { kind: "pending" | "success" | "error"; text: string };

/**
 * Retour d'une action admin (en cours / réussie / en échec) : icône + texte,
 * annoncé aux lecteurs d'écran (`role=status`, ou `alert` en échec).
 */
export function ActionStatus({ status, className }: { status: ActionStatusValue | null; className?: string }) {
  if (!status) return null;
  const icon =
    status.kind === "pending" ? <Loader2 className="animate-spin text-muted" /> : status.kind === "success" ? <CheckCircle2 className="text-success" /> : <OctagonAlert className="text-danger" />;
  return (
    <p
      role={status.kind === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 text-[13px] leading-snug [&_svg]:mt-px [&_svg]:size-4 [&_svg]:shrink-0",
        status.kind === "success" ? "text-success" : status.kind === "error" ? "text-danger" : "text-muted",
        className,
      )}
    >
      <span aria-hidden className="inline-flex">
        {icon}
      </span>
      <span className="text-reflow">{status.text}</span>
    </p>
  );
}
