import { BrandMark } from "@/components/brand/BrandMark";

/** Écran de lancement (lecture du Keychain) : jamais un écran blanc. */
export function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <BrandMark className="size-16 animate-pulse rounded-[18px]" />
    </div>
  );
}
