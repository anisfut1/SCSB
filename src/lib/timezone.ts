/**
 * Petits utilitaires de date dans le fuseau D'UN CLUB (`club.timezone`),
 * pour la vue "par jour" du module Tables de marque (demande du club,
 * 2026-09-28, §77 : "Vue principale : claire, par jour"). Même technique
 * DST-safe (double conversion) que `computeDayRange`/`zonedWallTimeToUtc`
 * côté club-manager-api (src/util/timezone.ts) — jamais une approximation
 * en UTC pur ni `+24h` codé en dur.
 */

function zonedWallTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, second: number, timezone: string): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(utcGuess);

  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const readAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));

  const offsetMs = utcGuess.getTime() - readAsUtc;
  return new Date(utcGuess.getTime() + offsetMs);
}

/** Fenêtre `[from, to)` en UTC du jour calendaire `dateStr` ("YYYY-MM-DD"), dans `timezone`. Bornes recalculées indépendamment (jamais `start + 24h`, un changement d'heure peut tomber ce jour-là). */
export function dayRangeForDate(dateStr: string, timezone: string): { from: string; to: string } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const start = zonedWallTimeToUtc(year, month, day, 0, 0, 0, timezone);
  const end = zonedWallTimeToUtc(year, month, day + 1, 0, 0, 0, timezone); // Date.UTC gère nativement le débordement de jour, avant la double conversion.
  return { from: start.toISOString(), to: end.toISOString() };
}

/** Date calendaire ("YYYY-MM-DD") du jour actuel, telle que vue dans `timezone` — jamais celle du serveur (UTC sur Vercel). */
export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  // "en-CA" formate directement en YYYY-MM-DD, évite de réassembler les parts à la main.
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Prochain samedi (ou aujourd'hui si on est déjà samedi/dimanche) — date par défaut de la vue Tables de marque : "Tables de marque / Samedi 3 octobre". */
export function nextMatchWeekendDate(timezone: string, now: Date = new Date()): string {
  const today = todayInTimezone(timezone, now);
  const [year, month, day] = today.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = dimanche ... 6 = samedi, arithmétique calendaire pure (pas d'heure murale ici).
  if (weekday === 6 || weekday === 0) return today;
  const daysUntilSaturday = 6 - weekday;
  return addDaysToDateString(today, daysUntilSaturday);
}

export function addDaysToDateString(dateStr: string, delta: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** "Samedi 3 octobre" — jamais d'heure murale ici (`hour: 12` évite tout risque de bascule de jour DST dans le formatage lui-même). */
export function formatDayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  const label = d.toLocaleDateString("fr-FR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
