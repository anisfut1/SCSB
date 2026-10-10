import { useEffect, useState } from "react";
import { ApiUnreachableError } from "@/lib/api/errors";
import { getPublicClub, type PublicClubDto } from "@/lib/api/publicTables";

/**
 * Chargement côté client d'un écran (les pages serveur du site ne sont pas
 * embarquées). `offline` distingue « pas de réseau » d'une vraie erreur.
 */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]): { data: T | null; error: Error | null; offline: boolean } {
  const [state, setState] = useState<{ data: T | null; error: Error | null; offline: boolean }>({ data: null, error: null, offline: false });
  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => !cancelled && setState({ data, error: null, offline: false }))
      .catch((error: unknown) => !cancelled && setState({ data: null, error: error instanceof Error ? error : new Error("Chargement impossible."), offline: error instanceof ApiUnreachableError }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

const clubs = new Map<string, Promise<PublicClubDto>>();

/** Infos publiques du club (nom, logo, fuseau), une fois par session de l'app. */
export function loadClub(slug: string): Promise<PublicClubDto> {
  let cached = clubs.get(slug);
  if (!cached) {
    cached = getPublicClub(slug).catch((error: unknown) => {
      clubs.delete(slug);
      throw error;
    });
    clubs.set(slug, cached);
  }
  return cached;
}
