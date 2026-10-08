import { describe, expect, it } from "vitest";
import { addDaysToDateString, isValidTimezone, currentOrNextWeekendSaturday, formatWeekendLabel, todayInTimezone, weekendRangeForSaturday } from "./timezone";

const PARIS = "Europe/Paris";

describe("weekendRangeForSaturday", () => {
  it("borne le week-end (samedi 00:00 -> lundi 00:00) en heure d'hiver (Europe/Paris = UTC+1)", () => {
    const { from, to } = weekendRangeForSaturday("2026-01-17", PARIS); // samedi 17 -> lundi 19 janvier 2026
    expect(from).toBe("2026-01-16T23:00:00.000Z");
    expect(to).toBe("2026-01-18T23:00:00.000Z");
  });

  it("borne le week-end en heure d'été (Europe/Paris = UTC+2)", () => {
    const { from, to } = weekendRangeForSaturday("2026-07-04", PARIS); // samedi 4 -> lundi 6 juillet 2026
    expect(from).toBe("2026-07-03T22:00:00.000Z");
    expect(to).toBe("2026-07-05T22:00:00.000Z");
  });

  it("recalcule chaque borne indépendamment autour d'un changement d'heure (jamais start + 48h)", () => {
    // Bascule heure d'été -> hiver en France le dimanche 25 octobre 2026, à l'intérieur du week-end du 24-25.
    const { from, to } = weekendRangeForSaturday("2026-10-24", PARIS);
    expect(from).toBe("2026-10-23T22:00:00.000Z"); // samedi encore en heure d'été (UTC+2)
    expect(to).toBe("2026-10-25T23:00:00.000Z"); // lundi déjà en heure d'hiver (UTC+1) : 49h réelles, jamais 48h fixes
  });
});

describe("todayInTimezone", () => {
  it("lit la date dans le fuseau demandé, pas celle du serveur", () => {
    // 23:30 UTC un 14 janvier = déjà le 15 janvier à Paris (UTC+1).
    expect(todayInTimezone(PARIS, new Date("2026-01-14T23:30:00.000Z"))).toBe("2026-01-15");
  });
});

describe("currentOrNextWeekendSaturday", () => {
  it("renvoie aujourd'hui si on est déjà samedi", () => {
    // 3 octobre 2026 est un samedi.
    expect(currentOrNextWeekendSaturday(PARIS, new Date("2026-10-03T10:00:00.000Z"))).toBe("2026-10-03");
  });

  it("renvoie le samedi de LA MÊME journée si on est dimanche (jamais celui de la semaine suivante)", () => {
    // Dimanche 4 octobre 2026 -> samedi 3 octobre 2026 (même week-end), pas le 10.
    expect(currentOrNextWeekendSaturday(PARIS, new Date("2026-10-04T10:00:00.000Z"))).toBe("2026-10-03");
  });

  it("renvoie le prochain samedi un jour de semaine", () => {
    // Mardi 29 septembre 2026 -> samedi 3 octobre 2026.
    expect(currentOrNextWeekendSaturday(PARIS, new Date("2026-09-29T10:00:00.000Z"))).toBe("2026-10-03");
  });
});

describe("addDaysToDateString", () => {
  it("avance/recule en gérant le débordement de mois", () => {
    expect(addDaysToDateString("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDaysToDateString("2026-10-01", -1)).toBe("2026-09-30");
  });

  it("avance/recule d'une semaine pour naviguer d'une journée de championnat à l'autre", () => {
    expect(addDaysToDateString("2026-10-03", 7)).toBe("2026-10-10");
    expect(addDaysToDateString("2026-10-03", -7)).toBe("2026-09-26");
  });
});

describe("formatWeekendLabel", () => {
  it("formate un week-end au sein du même mois", () => {
    expect(formatWeekendLabel("2026-10-03")).toBe("Week-end du 3 au 4 octobre");
  });

  it("formate un week-end à cheval sur 2 mois", () => {
    expect(formatWeekendLabel("2026-10-31")).toBe("Week-end du 31 octobre au 1 novembre");
  });
});

describe("isValidTimezone", () => {
  it("accepte un fuseau IANA connu", () => {
    expect(isValidTimezone("Europe/Paris")).toBe(true);
    expect(isValidTimezone("America/Martinique")).toBe(true);
  });

  it("rejette une chaîne arbitraire, vide ou mal casée", () => {
    expect(isValidTimezone("")).toBe(false);
    expect(isValidTimezone("xyz")).toBe(false);
    expect(isValidTimezone("europe/paris")).toBe(false);
    expect(isValidTimezone("Europe/Paris; DROP TABLE clubs")).toBe(false);
  });
});
