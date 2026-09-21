import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

/**
 * Racine de l'application. Le middleware a déjà redirigé vers /login tout
 * visiteur non authentifié pour cette route (elle n'est pas dans
 * PUBLIC_PATHS) ; `requireUser` reste une seconde barrière défensive.
 * Une fois connecté, il n'y a pour l'instant qu'une seule destination.
 */
export default async function HomePage() {
  await requireUser();
  redirect("/dashboard");
}
