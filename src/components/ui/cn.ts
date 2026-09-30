/** Concatène des classes en ignorant les valeurs falsy — pas de dépendance, pas de fusion Tailwind implicite. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
