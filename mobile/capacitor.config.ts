import type { CapacitorConfig } from "@capacitor/cli";

/**
 * App iOS Ball Manager. Le bundle est LOCAL (webDir) : pas de site distant en
 * production. `CAP_SERVER_URL` n'existe que pour le développement (live reload).
 */
const devServer = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "fr.ballmanager.app",
  appName: "Ball Manager",
  webDir: "dist",
  ios: {
    // Le contenu gère lui-même les zones sûres (encoche, barre d'accueil) via env(safe-area-inset-*).
    contentInset: "never",
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
  },
  ...(devServer ? { server: { url: devServer, cleartext: true } } : {}),
};

export default config;
