import { describe, expect, it } from "vitest";
import { addDaysToDateString, dayRangeForDate, formatDayLabel, nextMatchWeekendDate, todayInTimezone } from "./timezone";

const PARIS = "Europe/Paris";

describe("dayRangeForDate", () => {
  it("borne le jour calendaire en heure d'hiver (Europe/Paris = UTC+1)", () => {
    const { from, to } = dayRangeForDate("2026-01-15", PARIS);
    expect(from).toBe("2026-01-14T23:00:00.000Z");
    expect(to).toBe("2026-01-15T23:00:00.000Z");
  });

  it("borne le jour calendaire en heure d'été (Europe/Paris = UTC+2)", () => {
    const { from, to } = dayRangeForDate("2026-07-04", PARIS);
    expect(from).toBe("2026-07-03T22:00:00.000Z");
    expect(to).toBe("2026-07-04T22:00:00.000Z");
  });

  it("recalcule chaque borne indépendamment autour d'un changement d'heure (jamais start + 24h)", () => {
    // Bascule heure d'été -> hiver en France le 25 octobre 2026.
    const { from, to } = dayRangeForDate("2026-10-25", PARIS);
    expect(from).toBe("2026-10-24T22:00:00.000Z"); // veille encore en heure d'été (UTC+2)
    expect(to).toBe("2026-10-25T23:00:00.000Z"); // ce jour-là bascule en heure d'hiver (UTC+1) : 25h réelles, jamais 24h fixes
  });
});

describe("todayInTimezone", () => {
  it("lit la date dans le fuseau demandé, pas celle du serveur", () => {
    // 23:30 UTC un 14 janvier = déjà le 15 janvier à Paris (UTC+1).
    expect(todayInTimezone(PARIS, new Date("2026-01-14T23:30:00.000Z"))).toBe("2026-01-15");
  });
});

describe("nextMatchWeekendDate", () => {
  it("renvoie aujourd'hui si on est déjà samedi", () => {
    // 3 octobre 2026 est un samedi.
    expect(nextMatchWeekendDate(PARIS, new Date("2026-10-03T10:00:00.000Z"))).toBe("2026-10-03");
  });

  it("renvoie aujourd'hui si on est déjà dimanche", () => {
    expect(nextMatchWeekendDate(PARIS, new Date("2026-10-04T10:00:00.000Z"))).toBe("2026-10-04");
  });

  it("renvoie le prochain samedi un jour de semaine", () => {
    // Mardi 29 septembre 2026 -> samedi 3 octobre 2026.
    expect(nextMatchWeekendDate(PARIS, new Date("2026-09-29T10:00:00.000Z"))).toBe("2026-10-03");
  });
});

describe("addDaysToDateString", () => {
  it("avance/recule en gérant le débordement de mois", () => {
    expect(addDaysToDateString("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDaysToDateString("2026-10-01", -1)).toBe("2026-09-30");
  });
});

describe("formatDayLabel", () => {
  it("formate en français, capitalisé", () => {
    expect(formatDayLabel("2026-10-03")).toBe("Samedi 3 octobre");
  });
});
