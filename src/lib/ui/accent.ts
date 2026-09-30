import type { CSSProperties } from "react";

/** Repli plateforme quand un club n'a pas (ou a une mauvaise) couleur — voir design-system/scsb/MASTER.md §3.3. */
export const FALLBACK_ACCENT = "#2F5BFF";

/** Fond d'application le plus foncé des neutres clairs (`--surface-muted`). */
const DARKEST_LIGHT_SURFACE = "#ECEAE4";
const INK_DARK = "#17171A";
const INK_LIGHT = "#FFFFFF";

type Rgb = [number, number, number];

function parseHex(value: string | null | undefined): Rgb | null {
  if (!value) return null;
  const hex = value.trim().replace(/^#/, "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [luminance(parseHex(a) ?? [0, 0, 0]), luminance(parseHex(b) ?? [0, 0, 0])].sort((x, y) => y - x) as [number, number];
  return (la + 0.05) / (lb + 0.05);
}

function mixTowardBlack(rgb: Rgb, amount: number): Rgb {
  return rgb.map((c) => c * (1 - amount)) as Rgb;
}

export interface ClubAccent {
  accent: string;
  ink: string;
  text: string;
}

/**
 * Dérive, à partir de N'IMPORTE QUELLE couleur de club (rouge, jaune, vert…),
 * les trois teintes dont l'interface a besoin :
 * - `accent` : la couleur telle quelle (fond du bouton primaire, puces actives) ;
 * - `ink` : blanc ou graphite, celui qui contraste le mieux sur `accent` ;
 * - `text` : `accent` assombri jusqu'à ≥ 4.5:1 sur la surface la plus foncée
 *   des neutres clairs — un club jaune garde une identité jaune, mais ses
 *   liens et icônes actives restent lisibles.
 */
export function deriveClubAccent(color: string | null | undefined): ClubAccent {
  const rgb = parseHex(color) ?? (parseHex(FALLBACK_ACCENT) as Rgb);
  const accent = toHex(rgb);

  const ink = contrastRatio(INK_LIGHT, accent) >= contrastRatio(INK_DARK, accent) ? INK_LIGHT : INK_DARK;

  let text = accent;
  for (let step = 1; step <= 20 && contrastRatio(text, DARKEST_LIGHT_SURFACE) < 4.5; step += 1) {
    text = toHex(mixTowardBlack(rgb, step * 0.05));
  }

  return { accent, ink, text };
}

/** Variables CSS posées sur le shell (voir globals.css) — le reste (`soft`, `border`, `glow`) est dérivé en CSS via `color-mix`. */
export function clubAccentStyle(color: string | null | undefined): CSSProperties {
  const { accent, ink, text } = deriveClubAccent(color);
  return {
    "--club-accent": accent,
    "--club-accent-ink": ink,
    "--club-accent-text": text,
  } as CSSProperties;
}

/** Initiales d'un nom de club/équipe pour le monogramme de repli (jamais un faux logo). */
export function monogram(name: string | null | undefined): string {
  if (!name) return "?";
  const words = name
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 0 && !/^(de|du|des|la|le|les|et|d|l|club|basket|bc|sc)$/i.test(w));
  const source = words.length > 0 ? words : name.split(/\s+/).filter(Boolean);
  return source
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
