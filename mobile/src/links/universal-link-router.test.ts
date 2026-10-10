import { describe, expect, it } from "vitest";
import { createDeduper, normalizePath, resolveLink } from "./universal-link-router";

describe("UniversalLinkRouter", () => {
  it("URL valide → écran de l'app, même chemin que le web (ancre et filtres conservés)", () => {
    expect(resolveLink("https://www.ball-manager.fr/public/sc-sete-basket/matchs/m1#convocation")).toEqual({ kind: "navigate", clubSlug: "sc-sete-basket", path: "/public/sc-sete-basket/matchs/m1#convocation" });
    expect(resolveLink("https://ball-manager.fr/public/sc-sete-basket/derogations/r1")).toEqual({ kind: "navigate", clubSlug: "sc-sete-basket", path: "/public/sc-sete-basket/derogations/r1" });
    expect(resolveLink("https://www.ball-manager.fr/public/sc-sete-basket/entrainements?equipe=t1&seance=o1")).toEqual({ kind: "navigate", clubSlug: "sc-sete-basket", path: "/public/sc-sete-basket/entrainements?equipe=t1&seance=o1" });
  });

  it("destination d'une notification push (chemin relatif) : même routeur", () => {
    expect(resolveLink("/public/sc-sete-basket/matchs/m1#convocation")).toEqual({ kind: "navigate", clubSlug: "sc-sete-basket", path: "/public/sc-sete-basket/matchs/m1#convocation" });
  });

  it("domaine étranger ou http : rejeté", () => {
    expect(resolveLink("https://evil.example/public/sc-sete-basket/accueil")).toEqual({ kind: "reject", reason: "invalid-domain" });
    expect(resolveLink("http://www.ball-manager.fr/public/x/accueil")).toEqual({ kind: "reject", reason: "invalid-domain" });
    expect(resolveLink("pas une url")).toEqual({ kind: "reject", reason: "malformed" });
  });

  it("route inconnue : repli propre (accueil de l'app ou du club)", () => {
    expect(resolveLink("https://www.ball-manager.fr/tarifs")).toEqual({ kind: "home" });
    expect(resolveLink("https://www.ball-manager.fr/public/sc-sete-basket/inconnu/42")).toEqual({ kind: "navigate", clubSlug: "sc-sete-basket", path: "/public/sc-sete-basket/accueil" });
    expect(resolveLink("https://www.ball-manager.fr/public/sc-sete-basket")).toEqual({ kind: "navigate", clubSlug: "sc-sete-basket", path: "/public/sc-sete-basket/accueil" });
    expect(resolveLink("https://www.ball-manager.fr/public/Mauvais_Slug/accueil")).toEqual({ kind: "home" });
  });

  it("lien personnel (query ou fragment) : échange, jamais conservé dans le chemin", () => {
    expect(resolveLink("https://www.ball-manager.fr/public/sc-sete-basket/accueil?token=abc123")).toEqual({ kind: "bootstrap", clubSlug: "sc-sete-basket", token: "abc123", path: "/public/sc-sete-basket/accueil" });
    expect(resolveLink("https://www.ball-manager.fr/public/sc-sete-basket/tables#token=xyz")).toEqual({ kind: "bootstrap", clubSlug: "sc-sete-basket", token: "xyz", path: "/public/sc-sete-basket/tables" });
  });

  it("lien de connexion à usage unique", () => {
    const code = "c".repeat(43);
    expect(resolveLink(`https://www.ball-manager.fr/public/sc-sete-basket/connexion/code/${code}`)).toEqual({ kind: "login-code", clubSlug: "sc-sete-basket", code });
  });

  it("espace club par compte : Safari ; routes techniques : jamais un écran", () => {
    expect(resolveLink("https://www.ball-manager.fr/c/sc-sete-basket/admin/sync")).toEqual({ kind: "external", url: "https://www.ball-manager.fr/c/sc-sete-basket/admin/sync" });
    expect(resolveLink("https://www.ball-manager.fr/public/sc-sete-basket/auth/app?state=x")).toEqual({ kind: "navigate", clubSlug: "sc-sete-basket", path: "/public/sc-sete-basket/accueil" });
  });

  it("normalisation : doublons de /, / final, tentative de remontée refusée", () => {
    expect(normalizePath("/public//x/matchs/")).toBe("/public/x/matchs");
    expect(normalizePath("/public/x/%2e%2e/c")).toBeNull();
    expect(resolveLink("https://www.ball-manager.fr/public/x/..%2F..%2Fc/admin")).toEqual({ kind: "reject", reason: "malformed" });
  });

  it("un même lien livré deux fois au démarrage n'est traité qu'une fois", () => {
    let t = 0;
    const accept = createDeduper(3000, () => t);
    expect(accept("https://www.ball-manager.fr/public/x/accueil")).toBe(true);
    t = 500;
    expect(accept("https://www.ball-manager.fr/public/x/accueil")).toBe(false);
    t = 4000;
    expect(accept("https://www.ball-manager.fr/public/x/accueil")).toBe(true);
  });
});
