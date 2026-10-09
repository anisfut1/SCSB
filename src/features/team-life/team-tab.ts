/** Onglets de la page Équipe — module partagé serveur / client (pas de "use client" : appelé par les pages serveur). */
export type TeamTab = "apercu" | "planning" | "effectif";

export function teamTabOf(value: string | string[] | undefined): TeamTab {
  return value === "planning" || value === "effectif" ? value : "apercu";
}
