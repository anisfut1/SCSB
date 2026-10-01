"use client";

import { useEffect, useRef, useState } from "react";
import { monogram } from "@/lib/ui/accent";
import { cn } from "./cn";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Tailles FIXES (jamais un padding en %) : un `padding` en pourcentage est
 * calculé sur la largeur du PARENT, pas de l'élément — constaté en
 * production (2026-10-01) : dans la topbar mobile le médaillon gonflait à
 * ~100 px, et dans les cartes de match la zone de l'image tombait à 0 px
 * (logos FFBB présents mais invisibles, cadres blancs vides).
 */
const sizes: Record<LogoSize, { box: string; pad: string; text: string }> = {
  xs: { box: "size-6 rounded-[7px]", pad: "p-0.5", text: "text-[9px]" },
  sm: { box: "size-8 rounded-[9px]", pad: "p-1", text: "text-[11px]" },
  md: { box: "size-10 rounded-[11px]", pad: "p-1", text: "text-[13px]" },
  lg: { box: "size-14 rounded-[14px]", pad: "p-1.5", text: "text-base" },
  xl: { box: "size-20 rounded-[18px]", pad: "p-2", text: "text-xl" },
};

/**
 * Logo d'équipe/club : image réelle en `object-contain` sur un socle neutre
 * (jamais déformée), sinon — ou si l'image ne charge pas — monogramme
 * typographique. `alt` vide car le nom est toujours affiché à côté.
 */
export function TeamLogo({
  name,
  src,
  size = "md",
  accent = false,
  className,
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: LogoSize;
  accent?: boolean;
  className?: string;
}) {
  const s = sizes[size];
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Une image en échec AVANT l'hydratation (rendu serveur) ne déclenche
  // jamais `onError` côté React : on vérifie son état réel au montage.
  useEffect(() => {
    const img = imgRef.current;
    if (src && img && img.complete && img.naturalWidth === 0) setFailedSrc(src);
  }, [src]);

  if (src && failedSrc !== src) {
    return (
      <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden border border-border bg-white shadow-[var(--shadow-inset-highlight),var(--shadow-1)]", s.box, s.pad, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- logos distants hétérogènes (FFBB/Storage) */}
        <img ref={imgRef} src={src} alt="" decoding="async" onError={() => setFailedSrc(src)} className="block h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "type-numeric inline-flex shrink-0 select-none items-center justify-center border font-semibold tracking-tight shadow-[var(--shadow-inset-highlight)]",
        accent ? "border-accent-border bg-accent-soft text-accent-text" : "border-border bg-surface-muted text-muted",
        s.box,
        s.text,
        className,
      )}
    >
      {monogram(name ?? "")}
    </span>
  );
}

/** Logo du club courant : monogramme teinté par l'accent si pas d'image. */
export function ClubLogo(props: { name: string; src?: string | null; size?: LogoSize; className?: string }) {
  return <TeamLogo {...props} accent />;
}
