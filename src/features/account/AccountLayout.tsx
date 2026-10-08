import type { ReactNode } from "react";
import Link from "next/link";
import { PLATFORM_NAME } from "@/config/site";
import { BrandMark } from "@/components/brand/BrandMark";

/** Mise en page des écrans de compte (bienvenue, mot de passe oublié) — même identité que la page de connexion. */
export function AccountLayout({ eyebrow, title, lead, children }: { eyebrow: string; title: ReactNode; lead?: ReactNode; children: ReactNode }) {
  return (
    <main id="main" className="flex min-h-dvh flex-1 flex-col px-6 py-8 sm:px-12">
      <Link href="/login" className="flex items-center gap-2.5 self-start">
        <BrandMark />
        <span className="text-sm font-semibold tracking-tight text-foreground">{PLATFORM_NAME}</span>
      </Link>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 [animation:rise-in_var(--duration-slow)_var(--ease-out)]">
        <p className="type-eyebrow">{eyebrow}</p>
        <h1 className="type-display mt-3 text-foreground">{title}</h1>
        {lead ? <p className="mt-3 text-[15px] leading-relaxed text-muted">{lead}</p> : null}
        <div className="mt-10">{children}</div>
      </div>
    </main>
  );
}
