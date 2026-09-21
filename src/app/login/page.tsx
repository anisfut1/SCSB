import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PLATFORM_NAME } from "@/config/site";
import { LoginForm } from "@/features/auth/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-xl font-semibold">{PLATFORM_NAME}</h1>
        <p className="mb-8 text-center text-sm text-black/60 dark:text-white/60">
          Application interne — connexion réservée aux comptes créés par le club.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
