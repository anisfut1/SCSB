import type { MetadataRoute } from "next";
import { PLATFORM_NAME } from "@/config/site";

/** Couleurs de la charte (src/app/globals.css `--background`, `viewport.themeColor`). */
export const PWA_THEME_COLOR = "#f4f3ef";
export const PWA_BACKGROUND_COLOR = "#f4f3ef";

const ICONS: MetadataRoute.Manifest["icons"] = [
  { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

/**
 * Manifeste de la PWA. Jamais de jeton personnel ici (ni dans `start_url`) :
 * l'identité vient de la session (cookie HttpOnly), pas du raccourci.
 * Sans `clubSlug`, manifeste de la plateforme ; avec, il ouvre directement
 * l'accueil de CE club et limite la PWA à son espace (`scope`).
 */
export function buildManifest(clubSlug?: string): MetadataRoute.Manifest {
  const base = clubSlug ? `/public/${clubSlug}/` : "/";
  return {
    id: base,
    name: PLATFORM_NAME,
    short_name: PLATFORM_NAME,
    description: "Matchs, entraînements, convocations et tables de marque de votre club.",
    lang: "fr",
    dir: "ltr",
    start_url: clubSlug ? `${base}accueil?source=pwa` : "/?source=pwa",
    scope: base,
    display: "standalone",
    orientation: "portrait",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ["sports", "lifestyle"],
    icons: ICONS,
    ...(clubSlug
      ? {
          shortcuts: [
            { name: "Mon planning", url: `${base}planning?source=pwa`, icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
            { name: "Matchs", url: `${base}matchs?source=pwa`, icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
          ],
        }
      : {}),
  };
}
