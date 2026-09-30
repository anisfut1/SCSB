import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList, FileText } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { PLATFORM_NAME } from "@/config/site";
import { BrandMark } from "@/components/brand/BrandMark";
import { CourtVisual } from "@/components/brand/CourtVisual";
import { LoginForm } from "@/features/auth/LoginForm";

const FEATURES = [
  { icon: <CalendarDays />, title: "Calendrier FFBB", text: "Matchs, horaires et résultats synchronisés automatiquement." },
  { icon: <FileText />, title: "Feuilles e-Marque", text: "Compositions, officiels et statistiques lus sur chaque feuille." },
  { icon: <ClipboardList />, title: "Tables de marque", text: "Des suggestions expliquées, un poste à la fois." },
];

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main id="main" className="grid min-h-dvh flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight text-foreground">{PLATFORM_NAME}</span>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 [animation:rise-in_var(--duration-slow)_var(--ease-out)]">
          <p className="type-eyebrow">Espace club</p>
          <h1 className="type-display mt-3 text-foreground">
            Bon retour<span className="text-accent-text">.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">Application interne — connexion réservée aux comptes créés par le club.</p>
          <div className="mt-10">
            <LoginForm />
          </div>
        </div>

        <p className="type-meta text-xs">Besoin d&apos;un accès ? Contactez l&apos;administrateur de votre club.</p>
      </section>

      <aside aria-hidden className="relative hidden overflow-hidden border-l border-border bg-surface lg:block">
        <CourtVisual className="absolute inset-0 size-full" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-8 bg-gradient-to-t from-surface via-surface/90 to-transparent p-12 pt-32">
          <p className="type-title max-w-md text-foreground">La vie du club, de la feuille de match au tableau de bord.</p>
          <ul className="grid max-w-xl grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="surface-glass flex flex-col gap-2 rounded-[var(--radius-lg)] border border-border p-4 shadow-2">
                <span className="inline-flex size-8 items-center justify-center rounded-[9px] border border-accent-border bg-accent-soft text-accent-text [&_svg]:size-4">{f.icon}</span>
                <span className="text-sm font-medium text-foreground">{f.title}</span>
                <span className="type-meta text-xs leading-snug">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
