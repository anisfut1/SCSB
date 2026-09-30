import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { BrandMark } from "@/components/brand/BrandMark";

export default function NotFound() {
  return (
    <main id="main" className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      <div aria-hidden className="court-pattern pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative flex max-w-md flex-col items-center gap-4">
        <BrandMark className="size-10 rounded-[12px]" />
        <p className="type-numeric text-6xl font-medium leading-none text-foreground">404</p>
        <h1 className="type-title text-foreground">Page introuvable</h1>
        <p className="text-[15px] text-muted">Cette page n&apos;existe pas ou plus.</p>
        <ButtonLink href="/" variant="primary" icon={<Compass />} className="mt-2">
          Retour à l&apos;accueil
        </ButtonLink>
      </div>
    </main>
  );
}
