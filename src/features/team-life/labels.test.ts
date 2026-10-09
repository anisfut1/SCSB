import { describe, expect, it } from "vitest";
import { countsSummary, relativeDay, seasonEndKey, seriesLabel, timeOf } from "./labels";

describe("libellés Vie d'équipe", () => {
  it("heure murale du club, été comme hiver", () => {
    expect(timeOf("2026-10-13T17:00:00.000Z", "Europe/Paris")).toBe("19:00");
    expect(timeOf("2026-11-10T18:00:00.000Z", "Europe/Paris")).toBe("19:00");
  });
  it("aujourd'hui / demain dans le fuseau du club", () => {
    const now = new Date("2026-10-13T08:00:00.000Z");
    expect(relativeDay("2026-10-13T17:00:00.000Z", "Europe/Paris", now)).toBe("aujourd'hui");
    expect(relativeDay("2026-10-14T17:00:00.000Z", "Europe/Paris", now)).toBe("demain");
    expect(relativeDay("2026-10-16T17:00:00.000Z", "Europe/Paris", now)).toBe("vendredi 16 oct.");
  });
  it("créneau et fin de saison", () => {
    expect(seriesLabel({ weekday: 2, startTime: "19:00", endTime: "20:30" })).toBe("Mardi 19:00–20:30");
    expect(seasonEndKey("2026-10-09")).toBe("2027-06-30");
    expect(seasonEndKey("2027-03-01")).toBe("2027-06-30");
  });
  it("résumé des réponses sans zéros inutiles", () => {
    expect(countsSummary({ present: 8, absent: 1, uncertain: 0, noResponse: 3 })).toBe("8 présents · 1 absent · 3 sans réponse");
    expect(countsSummary({ present: 0, absent: 0, uncertain: 0, noResponse: 0 })).toBe("Aucun joueur dans l'effectif");
  });
});
