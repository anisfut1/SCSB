import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { buildCspReportOnly, originOf, securityHeaders } from "./security-headers";

const options = { supabaseUrl: "https://abcd1234.supabase.co/", apiUrl: "https://api.exemple.test:8443/v1", isDev: false };

describe("originOf", () => {
  it("réduit une URL à son origine", () => {
    expect(originOf("https://abcd1234.supabase.co/auth/v1")).toBe("https://abcd1234.supabase.co");
    expect(originOf("https://api.exemple.test:8443/v1")).toBe("https://api.exemple.test:8443");
  });

  it("ignore l'absent, l'invalide et les schémas non http(s) (jamais d'exception au build)", () => {
    expect(originOf(undefined)).toBeNull();
    expect(originOf("pas une url")).toBeNull();
    expect(originOf("javascript:alert(1)")).toBeNull();
    expect(originOf("ftp://hote.test")).toBeNull();
  });
});

describe("buildCspReportOnly", () => {
  const csp = buildCspReportOnly(options);

  it("autorise Supabase et l'API uniquement en connect-src (origines exactes, sans chemin)", () => {
    expect(csp).toContain("connect-src 'self' https://abcd1234.supabase.co https://api.exemple.test:8443;");
  });

  it("verrouille les vecteurs inutilisés", () => {
    for (const d of ["frame-src 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "default-src 'self'", "font-src 'self'"]) expect(csp).toContain(d);
  });

  it("n'autorise aucun logo distant en img-src (les hôtes réels doivent apparaître en violation)", () => {
    expect(csp).toContain("img-src 'self' data: blob:;");
    expect(csp).not.toMatch(/img-src[^;]*https:/);
  });

  it("n'a ni report-uri ni report-to (aucun collecteur : un rapport contiendrait l'URL, donc un éventuel jeton)", () => {
    expect(csp).not.toMatch(/report-(uri|to)/);
  });

  it("n'ajoute 'unsafe-eval' qu'en développement", () => {
    expect(csp).not.toContain("unsafe-eval");
    expect(buildCspReportOnly({ ...options, isDev: true })).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });

  it("sans variables d'environnement : policy valide limitée à 'self'", () => {
    expect(buildCspReportOnly({})).toContain("connect-src 'self';");
  });

  it("dédoublonne les origines et accepte des origines supplémentaires", () => {
    const withDup = buildCspReportOnly({ supabaseUrl: "https://a.test", apiUrl: "https://a.test/x", extraConnectOrigins: ["https://nouveau-back.test"] });
    expect(withDup).toContain("connect-src 'self' https://a.test https://nouveau-back.test;");
  });
});

describe("securityHeaders", () => {
  it("la politique complète est en Report-Only ; le seul en-tête CSP appliqué ne contient que frame-ancestors 'none'", () => {
    const headers = securityHeaders(options);
    const enforced = headers.filter((h) => h.key.toLowerCase() === "content-security-policy");

    expect(headers.map((h) => h.key.toLowerCase())).toContain("content-security-policy-report-only");
    expect(enforced).toEqual([{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" }]);
  });

  it("pose X-Frame-Options: DENY (appliqué), cohérent avec frame-ancestors 'none'", () => {
    const map = Object.fromEntries(securityHeaders(options).map((h) => [h.key, h.value]));

    expect(map["X-Frame-Options"]).toBe("DENY");
    expect(map["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  });

  it("pose les en-têtes complémentaires attendus, sans HSTS (laissé à Vercel)", () => {
    const map = Object.fromEntries(securityHeaders(options).map((h) => [h.key, h.value]));

    expect(map["X-Content-Type-Options"]).toBe("nosniff");
    expect(map["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(map["Permissions-Policy"]).toContain("camera=()");
    expect(map).not.toHaveProperty("Strict-Transport-Security");
  });
});

describe("next.config.ts : headers() réellement exposés par Next", () => {
  it("applique les en-têtes à toutes les routes ; la CSP appliquée se limite à frame-ancestors", async () => {
    const rules = await nextConfig.headers!();

    expect(rules).toHaveLength(1);
    expect(rules[0]!.source).toBe("/(.*)");
    const keys = rules[0]!.headers.map((h) => h.key.toLowerCase());
    expect(keys).toContain("content-security-policy-report-only");
    expect(keys).toContain("x-frame-options");
    const enforced = rules[0]!.headers.filter((h) => h.key.toLowerCase() === "content-security-policy");
    expect(enforced.map((h) => h.value)).toEqual(["frame-ancestors 'none'"]);
  });

  it("les origines de connect-src viennent des variables NEXT_PUBLIC_* (valeurs factices de vitest.setup.ts)", async () => {
    const rules = await nextConfig.headers!();
    const csp = rules[0]!.headers.find((h) => h.key === "Content-Security-Policy-Report-Only")!.value;

    expect(csp).toContain("https://test-project.supabase.co");
    expect(csp).toContain("https://api.test.example.com");
  });
});
