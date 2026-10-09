import type { Metadata, Viewport } from "next";
import { PLATFORM_NAME } from "@/config/site";
import { Geist, Geist_Mono, Instrument_Serif, Space_Grotesk } from "next/font/google";
import { PwaRegister } from "@/features/pwa/PwaRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Display éditorial (titres de page, scoreboard) — design-system/scsb/MASTER.md §4. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

/** Données chiffrées (scores, horaires, KPI) — chiffres tabulaires. */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Icônes : conventions de fichiers Next (src/app/favicon.ico, icon.png, apple-icon.png).
  title: PLATFORM_NAME,
  description: "Plateforme de gestion sportive multi-clubs (calendrier, feuilles de match, statistiques)",
  // PWA : le manifeste vient de src/app/manifest.ts (ou de celui du club, voir /public/[clubSlug]/layout.tsx).
  applicationName: PLATFORM_NAME,
  appleWebApp: { capable: true, title: PLATFORM_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f3ef",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
