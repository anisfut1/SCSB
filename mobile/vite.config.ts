import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Bundle LOCAL de l'app iOS (docs/IOS_AUDIT.md §5) : il importe directement le
 * code du site (`@/` → ../src). Les seules différences sont des adaptateurs
 * (next/link, next/navigation, next/image → react-router / <img>).
 *
 * BM_API_URL (obligatoire en production) = la même valeur que
 * NEXT_PUBLIC_CLUB_MANAGER_API_URL côté Vercel.
 */
const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, "..");

export default defineConfig(({ mode }) => {
  const apiUrl = process.env.BM_API_URL ?? (mode === "production" ? "" : "http://localhost:3001");
  if (!apiUrl) throw new Error("BM_API_URL manquant : URL de ball-manager-back (même valeur que NEXT_PUBLIC_CLUB_MANAGER_API_URL sur Vercel).");
  const define: Record<string, string> = {
    "process.env.NEXT_PUBLIC_CLUB_MANAGER_API_URL": JSON.stringify(apiUrl),
    // L'app n'utilise pas Supabase directement (tout passe par l'API) : valeurs neutres pour la validation partagée.
    "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify("https://unused.invalid"),
    "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify("unused"),
    "process.env.NEXT_PUBLIC_PUBLIC_TOKEN_HEADER": JSON.stringify(""),
    "process.env.NEXT_PUBLIC_PUSH_ENABLED": JSON.stringify(""),
    "process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY": JSON.stringify(""),
    "process.env.NEXT_PUBLIC_APP_STORE_ID": JSON.stringify(""),
    "process.env.IOS_BUNDLE_ID": JSON.stringify(""),
    "process.env.APPLE_TEAM_ID": JSON.stringify(""),
    "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
    "import.meta.env.BM_APP_VERSION": JSON.stringify(process.env.npm_package_version ?? "1.0.0"),
    // Environnement APNs des jetons de CETTE build : `development` pour une build Xcode Debug
    // (sandbox), `production` (défaut) pour TestFlight / App Store. Voir docs/IOS_PUSH.md.
    "import.meta.env.BM_APNS_ENV": JSON.stringify(process.env.BM_APNS_ENV === "development" ? "development" : "production"),
  };
  return {
    root: dirname,
    plugins: [react(), tailwindcss()],
    define,
    resolve: {
      alias: [
        { find: /^next\/link$/, replacement: path.resolve(dirname, "src/shims/next-link.tsx") },
        { find: /^next\/navigation$/, replacement: path.resolve(dirname, "src/shims/next-navigation.ts") },
        { find: /^next\/image$/, replacement: path.resolve(dirname, "src/shims/next-image.tsx") },
        { find: /^@\//, replacement: `${path.resolve(root, "src")}/` },
        // UNE seule copie de React : celle du site (react-router en tirerait une autre version).
        { find: /^react$/, replacement: path.resolve(root, "node_modules/react") },
        { find: /^react\/(.*)$/, replacement: `${path.resolve(root, "node_modules/react")}/$1` },
        { find: /^react-dom$/, replacement: path.resolve(root, "node_modules/react-dom") },
        { find: /^react-dom\/(.*)$/, replacement: `${path.resolve(root, "node_modules/react-dom")}/$1` },
      ],
      // Une seule copie de React (celle du site).
      dedupe: ["react", "react-dom"],
    },
    server: { fs: { allow: [root] } },
    build: { outDir: "dist", emptyOutDir: true, sourcemap: false, target: "safari16" },
  };
});
