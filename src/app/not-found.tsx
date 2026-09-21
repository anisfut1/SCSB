import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-lg font-semibold">Page introuvable</h1>
      <p className="max-w-sm text-sm text-black/60 dark:text-white/60">
        Cette page n&apos;existe pas ou plus.
      </p>
      <Link
        href="/"
        className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
