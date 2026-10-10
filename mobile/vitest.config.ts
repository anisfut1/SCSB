import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: [{ find: /^@\//, replacement: `${path.resolve(dirname, "../src")}/` }] },
  test: { root: dirname, environment: "node", include: ["src/**/*.test.ts"] },
});
