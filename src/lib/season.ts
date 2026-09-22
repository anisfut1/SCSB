/**
 * 1er août de la saison de basket en cours (convention française : la
 * saison court d'août à juin). `now` injectable pour les tests — jamais
 * `new Date()` codé en dur dans la logique elle-même.
 */
export function currentSeasonStart(now: Date = new Date()): Date {
  const seasonStartYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1; // getMonth() 7 = août
  return new Date(seasonStartYear, 7, 1);
}
