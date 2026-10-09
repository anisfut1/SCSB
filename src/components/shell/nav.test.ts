import { describe, expect, it } from "vitest";
import { buildClubNav, buildMobilePrimary } from "./nav";

const hrefs = (roles: Parameters<typeof buildClubNav>[1]) => buildClubNav("demo", roles).flatMap((s) => s.items.map((i) => i.href));

describe("navigation — demandes de dérogation internes", () => {
  it("expose « Dérogations » aux coachs et au coordinateur, sans l'administration", () => {
    expect(hrefs(["coach"])).toContain("/c/demo/derogations");
    expect(hrefs(["correspondant_club"])).toContain("/c/demo/derogations");
    expect(hrefs(["coach"])).not.toContain("/c/demo/admin/derogations");
    expect(hrefs(["coach"])).not.toContain("/c/demo/admin/gymnases");
  });

  it("ne l'expose pas aux joueurs/parents", () => {
    expect(hrefs(["joueur"])).not.toContain("/c/demo/derogations");
  });

  it("club_admin : demandes internes + Gymnases + Dérogations FBI (statut officiel) séparées", () => {
    const sections = buildClubNav("demo", ["club_admin"]);
    const all = sections.flatMap((s) => s.items);
    expect(all.find((i) => i.href === "/c/demo/derogations")?.label).toBe("Dérogations");
    expect(all.find((i) => i.href === "/c/demo/admin/derogations")?.label).toBe("Dérogations FBI");
    expect(all.some((i) => i.href === "/c/demo/admin/gymnases")).toBe(true);
    expect(buildMobilePrimary(sections).map((i) => i.href)).toContain("/c/demo/derogations");
  });
});

describe("Vie d'équipe", () => {
  it("Planning pour tous, Entraînements pour admin et coach", () => {
    expect(hrefs(["joueur"])).toContain("/c/demo/planning");
    expect(hrefs(["joueur"])).not.toContain("/c/demo/entrainements");
    expect(hrefs(["coach"])).toContain("/c/demo/entrainements");
    expect(hrefs(["club_admin"])).toContain("/c/demo/entrainements");
  });
});
