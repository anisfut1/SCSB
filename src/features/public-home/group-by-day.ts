/**
 * Regroupe des matchs par JOUR (fuseau du club) — retour du club, 2026-10-01 :
 * « quand il y a plusieurs matchs le même jour, faut pas annoncer plusieurs
 * fois la même date ». L'ordre des matchs est conservé ; les matchs sans date
 * sont regroupés à la fin (« Date à confirmer »).
 */
export interface DayGroup<T> {
  key: string;
  label: string;
  items: T[];
}

export function groupByDay<T>(items: readonly T[], dateOf: (item: T) => string | null, timezone: string): DayGroup<T>[] {
  const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
  const labelFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: timezone, weekday: "long", day: "numeric", month: "long" });
  const groups = new Map<string, DayGroup<T>>();
  for (const item of items) {
    const iso = dateOf(item);
    const key = iso ? keyFmt.format(new Date(iso)) : "unknown";
    let group = groups.get(key);
    if (!group) {
      const label = iso ? labelFmt.format(new Date(iso)) : "Date à confirmer";
      group = { key, label: label.charAt(0).toUpperCase() + label.slice(1), items: [] };
      groups.set(key, group);
    }
    group.items.push(item);
  }
  const all = [...groups.values()];
  return [...all.filter((g) => g.key !== "unknown"), ...all.filter((g) => g.key === "unknown")];
}
