import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/config/env.public";
import { PUBLIC_PATHS } from "@/config/site";

/**
 * Protège l'application par défaut : toute route est privée sauf celles
 * listées dans `PUBLIC_PATHS`. Ce choix (liste blanche courte plutôt que
 * liste noire des routes protégées) évite d'oublier de protéger un futur
 * module (matchs, dérogations, tables...) ajouté dans les phases suivantes.
 *
 * Rafraîchit aussi le cookie de session Supabase sur chaque requête, comme
 * recommandé par @supabase/ssr pour Next.js App Router.
 *
 * Note : ce fichier suit la convention `proxy.ts` (anciennement
 * `middleware.ts`, renommée à partir de Next.js 16).
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf les assets statiques Next.js, les fichiers
     * publics et les endpoints internes (aucun `/api/internal` en Phase 0,
     * réservé pour la synchronisation FFBB en Phase 1).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
