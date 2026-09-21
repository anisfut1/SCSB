import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * FBI est une couche d'ENRICHISSEMENT, jamais un prérequis (brief produit
 * "FBI EST FACULTATIF"). Ce module centralise la question "que peut faire
 * ce club ?" pour éviter de disperser des `if (fbiCredentials)` dans
 * React/les services — un seul endroit à faire évoluer si un nouveau
 * niveau d'intégration apparaît.
 */
export interface ClubCapabilities {
  /** Synchronisation FFBB publique — calendrier, résultats. Toujours vraie sauf club explicitement désactivé. */
  ffbb: boolean;
  /** Identifiants FBI enregistrés pour ce club (configured=true), indépendamment du succès de connexion. */
  fbi: boolean;
  /** FBI configuré ET la dernière connexion a réussi : l'enrichissement e-Marque peut réellement tourner. */
  emarque: boolean;
}

type Client = SupabaseClient<Database>;

export const PUBLIC_ONLY_CAPABILITIES: ClubCapabilities = { ffbb: true, fbi: false, emarque: false };

/**
 * Calcule les capacités réelles d'un club à partir de son état en base.
 * Fonction pure séparée de `getClubCapabilities` pour rester testable sans
 * client Supabase (voir club-capabilities.test.ts).
 */
export function computeClubCapabilities(input: { ffbbEnabled: boolean; fbiConfigured: boolean; fbiConnected: boolean }): ClubCapabilities {
  return {
    ffbb: input.ffbbEnabled,
    fbi: input.fbiConfigured,
    emarque: input.fbiConfigured && input.fbiConnected,
  };
}

/**
 * Résout les capacités d'un club depuis la base. `fbiConnected` reflète la
 * DERNIÈRE connexion réussie observée (`fbi_integration_status.last_login_success`)
 * — un club FBI configuré mais dont la dernière tentative a échoué garde
 * `fbi: true` (il a des identifiants) mais `emarque: false` (rien ne tourne
 * tant que la connexion n'est pas rétablie).
 */
export async function getClubCapabilities(supabase: Client, clubId: string): Promise<ClubCapabilities> {
  const [{ data: club }, { data: fbiStatus }] = await Promise.all([
    supabase.from("clubs").select("ffbb_enabled").eq("id", clubId).maybeSingle(),
    supabase.from("fbi_integration_status").select("configured, last_login_success").eq("club_id", clubId).maybeSingle(),
  ]);

  return computeClubCapabilities({
    ffbbEnabled: club?.ffbb_enabled ?? true,
    fbiConfigured: fbiStatus?.configured ?? false,
    fbiConnected: fbiStatus?.last_login_success ?? false,
  });
}
