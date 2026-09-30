import { describe, expect, it } from "vitest";
import { FALLBACK_ACCENT, contrastRatio, deriveClubAccent, monogram } from "./accent";

describe("deriveClubAccent", () => {
  it("falls back to the platform accent for a missing or malformed color", () => {
    expect(deriveClubAccent(null).accent).toBe(FALLBACK_ACCENT);
    expect(deriveClubAccent("not-a-color").accent).toBe(FALLBACK_ACCENT);
  });

  it("accepts 3-digit hex", () => {
    expect(deriveClubAccent("#f00").accent).toBe("#FF0000");
  });

  it.each(["#2F5BFF", "#E30613", "#FFD500", "#00A651", "#FFFFFF", "#111111", "#7FDBFF"])(
    "keeps text-grade accent readable on light surfaces for %s",
    (color) => {
      const { text } = deriveClubAccent(color);
      expect(contrastRatio(text, "#ECEAE4")).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("picks a dark ink on light accents and a white ink on dark accents", () => {
    expect(deriveClubAccent("#FFD500").ink).toBe("#17171A");
    expect(deriveClubAccent("#1B2A6B").ink).toBe("#FFFFFF");
  });
});

describe("monogram", () => {
  it("skips generic club words", () => {
    expect(monogram("SC Sète Basket")).toBe("S");
    expect(monogram("Basket Club Florensac - 1")).toBe("F1");
    expect(monogram("Montpellier Méditerranée")).toBe("MM");
  });

  it("never returns an empty string", () => {
    expect(monogram("")).toBe("?");
    expect(monogram(null)).toBe("?");
    expect(monogram("Basket Club")).toBe("BC");
  });
});
