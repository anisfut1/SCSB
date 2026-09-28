import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type LicencieDto = components["schemas"]["LicencieDto"];
export type LicencieProfileDto = components["schemas"]["LicencieProfileDto"];
export type LicencieMatchDto = components["schemas"]["LicencieMatchDto"];
export type UpdateLicencieProfileDto = components["schemas"]["UpdateLicencieProfileDto"];
export type ImportLicencieRowDto = components["schemas"]["ImportLicencieRowDto"];
export type ImportLicenciesDto = components["schemas"]["ImportLicenciesDto"];
export type ImportLicenciesResultDto = components["schemas"]["ImportLicenciesResultDto"];
export type AutoAssignTeamsResultDto = components["schemas"]["AutoAssignTeamsResultDto"];

/** GET /v1/clubs/:clubId/licencies — roster du club (tri par nom, voir docs/LICENCIES.md côté club-manager-api). */
export async function listLicencies(fetcher: ApiFetcher, clubId: string): Promise<LicencieDto[]> {
  const { licencies } = await fetcher<{ licencies: LicencieDto[] }>(`/v1/clubs/${clubId}/licencies`);
  return licencies;
}

/** GET /v1/clubs/:clubId/licencies/:licencieId — la fiche joueur (identité, historique des matchs, statistiques par match). */
export async function getLicencieProfile(fetcher: ApiFetcher, clubId: string, licencieId: string): Promise<LicencieProfileDto> {
  return fetcher<LicencieProfileDto>(`/v1/clubs/${clubId}/licencies/${licencieId}`);
}

/**
 * PATCH /v1/clubs/:clubId/licencies/:licencieId/profile — le serveur
 * applique la restriction de champs (admin vs licencié lui-même) et
 * rejette (400) tout champ hors de la population autorisée pour
 * l'appelant, voir docs/LICENCIES.md côté club-manager-api.
 */
export async function updateLicencieProfile(fetcher: ApiFetcher, clubId: string, licencieId: string, body: UpdateLicencieProfileDto): Promise<LicencieDto> {
  return fetcher<LicencieDto>(`/v1/clubs/${clubId}/licencies/${licencieId}/profile`, { method: "PATCH", body });
}

/**
 * POST /v1/clubs/:clubId/licencies/import (club_admin) — import en masse
 * depuis un export FBI collé/importé ("Voici la liste des licenciés,
 * ajoute les tous stp, a lavenir yen aura dautres, faudra ignorer les
 * doublons dans les exports", demande du club, 2026-09-28). Dédoublonné
 * côté serveur par `ffbbLicenceId` ("N° national") — voir docs/LICENCIES.md
 * côté club-manager-api. `timeoutMs` généreux : un import peut porter sur
 * plusieurs centaines de lignes.
 */
export async function importLicencies(fetcher: ApiFetcher, clubId: string, body: ImportLicenciesDto): Promise<ImportLicenciesResultDto> {
  return fetcher<ImportLicenciesResultDto>(`/v1/clubs/${clubId}/licencies/import`, { method: "POST", body, timeoutMs: 60_000 });
}

/**
 * POST /v1/clubs/:clubId/licencies/auto-assign-teams (club_admin) —
 * répartition automatique best-effort des licenciés sans équipe, à partir
 * de la catégorie/du sexe FFBB connus ("on a une info pour commencer déjà
 * a les mettre dans les équipes, si ya 2 equipes pour 1 catégorie, met
 * tous dans 1 seule pour linstant", demande du club, 2026-09-28). Reste un
 * point de départ, jamais une vérité définitive — voir docs/LICENCIES.md
 * côté club-manager-api.
 */
export async function autoAssignTeams(fetcher: ApiFetcher, clubId: string): Promise<AutoAssignTeamsResultDto> {
  return fetcher<AutoAssignTeamsResultDto>(`/v1/clubs/${clubId}/licencies/auto-assign-teams`, { method: "POST", timeoutMs: 30_000 });
}
