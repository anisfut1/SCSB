import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

/**
 * Tableau premium (desktop). En mobile, les pages lui préfèrent une liste de
 * cartes ; si un tableau reste nécessaire, il défile horizontalement dans
 * son propre conteneur (jamais la page entière).
 */
export function Table({ caption, className, children }: { caption?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          {children}
        </table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-border bg-surface/80">{children}</thead>;
}

export function Th({ className, align = "left", ...props }: ComponentProps<"th"> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      scope="col"
      className={cn(
        "type-eyebrow h-10 whitespace-nowrap px-4 font-medium",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...props}
    />
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("transition-colors duration-150 hover:bg-surface/70", className)} {...props} />;
}

export function Td({ className, align = "left", numeric, ...props }: ComponentProps<"td"> & { align?: "left" | "right" | "center"; numeric?: boolean }) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-foreground",
        align === "right" && "text-right",
        align === "center" && "text-center",
        numeric && "type-numeric",
        className,
      )}
      {...props}
    />
  );
}
