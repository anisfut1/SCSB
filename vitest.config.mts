import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Environnement `node` par défaut ; un test qui a besoin du DOM le déclare par fichier (`// @vitest-environment jsdom`, Q-009).
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
