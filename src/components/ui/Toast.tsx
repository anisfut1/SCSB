import type { ReactNode } from "react";
import { CheckCircle2, Info, OctagonAlert } from "lucide-react";
import { cn } from "./cn";

/**
 * Toast flottant (confirmation d'action) — au-dessus de la barre de
 * navigation mobile, `role=status` (annoncé sans voler le focus).
 */
export function Toast({ message, tone = "success" }: { message: ReactNode; tone?: "success" | "info" | "danger" }) {
  const icons = { success: <CheckCircle2 className="text-success" />, info: <Info className="text-info" />, danger: <OctagonAlert className="text-danger" /> };
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+12px)] z-[65] flex justify-center px-4 lg:bottom-6 lg:pl-[var(--sidebar-width)]">
      <p
        role={tone === "danger" ? "alert" : "status"}
        className={cn(
          "pointer-events-auto flex max-w-md items-start gap-2.5 rounded-[14px] border border-border bg-surface-raised px-4 py-3 text-sm text-foreground shadow-3 [animation:rise-in_var(--duration-slow)_var(--ease-out)] [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
        )}
      >
        <span aria-hidden className="inline-flex">{icons[tone]}</span>
        <span className="text-reflow">{message}</span>
      </p>
    </div>
  );
}
