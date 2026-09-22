import { describe, expect, it } from "vitest";
import { currentSeasonStart } from "./season";

describe("currentSeasonStart", () => {
  it("renvoie le 1er août de l'année en cours quand on est en septembre (nouvelle saison démarrée)", () => {
    const start = currentSeasonStart(new Date(2026, 8, 22)); // 22 septembre 2026
    expect(start).toEqual(new Date(2026, 7, 1));
  });

  it("renvoie le 1er août de l'année PRÉCÉDENTE quand on est en mars (saison entamée depuis l'automne)", () => {
    const start = currentSeasonStart(new Date(2027, 2, 15)); // 15 mars 2027
    expect(start).toEqual(new Date(2026, 7, 1));
  });

  it("bascule sur le nouveau 1er août pile le jour J", () => {
    expect(currentSeasonStart(new Date(2026, 7, 1))).toEqual(new Date(2026, 7, 1));
    expect(currentSeasonStart(new Date(2026, 6, 31))).toEqual(new Date(2025, 7, 1));
  });
});
