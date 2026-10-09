import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildManifest } from "./manifest";

describe("manifeste PWA", () => {
  it("plateforme : standalone, nom, icônes 192/512/maskable", () => {
    const m = buildManifest();
    expect(m).toMatchObject({ name: "Ball Manager", display: "standalone", scope: "/" });
    const sizes = (m.icons ?? []).map((i) => `${i.sizes}:${i.purpose}`);
    expect(sizes).toEqual(expect.arrayContaining(["192x192:any", "512x512:any", "512x512:maskable"]));
  });
  it("club : ouvre l'accueil du club, périmètre limité, aucun jeton", () => {
    const m = buildManifest("sc-sete-basket");
    expect(m.start_url).toBe("/public/sc-sete-basket/accueil?source=pwa");
    expect(m.scope).toBe("/public/sc-sete-basket/");
    expect(m.id).toBe("/public/sc-sete-basket/");
    expect(JSON.stringify(m)).not.toMatch(/token/i);
  });
  it("les icônes référencées existent dans public/", () => {
    for (const icon of buildManifest().icons ?? []) {
      expect(() => readFileSync(path.join(process.cwd(), "public", icon.src))).not.toThrow();
    }
  });
});

describe("service worker (garde-fous statiques)", () => {
  const sw = readFileSync(path.join(process.cwd(), "public/sw.js"), "utf8");
  it("ne met en cache que le statique : jamais d'API/HTML personnalisé", () => {
    expect(sw).toContain('"/_next/static/"');
    expect(sw).toContain("request.method !== \"GET\"");
    expect(sw).toContain("url.origin !== self.location.origin");
    expect(sw.match(/cache\.put/g)).toHaveLength(1);
  });
  it("mise à jour contrôlée : skipWaiting uniquement sur message", () => {
    expect(sw.match(/skipWaiting\(\)/g)).toHaveLength(1);
    expect(sw).toContain("SKIP_WAITING");
  });
});
