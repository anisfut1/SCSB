import Image from "next/image";
import { cn } from "@/components/ui/cn";
import mark from "./ball-manager-mark.png";

/**
 * Marque de la plateforme Ball Manager (logo « BM » ballon orange sur tuile
 * noire, fourni par le club, 2026-10-02) — mêmes visuels que le favicon
 * (src/app/favicon.ico, icon.png, apple-icon.png).
 */
export function BrandMark({ className }: { className?: string }) {
  return <Image src={mark} alt="" aria-hidden width={32} height={32} loading="eager" className={cn("inline-block size-8 shrink-0 rounded-[10px]", className)} />;
}
