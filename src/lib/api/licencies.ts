import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type LicencieDto = components["schemas"]["LicencieDto"];
export type LicencieProfileDto = components["schemas"]["LicencieProfileDto"];
export type LicencieMatchDto = components["schemas"]["LicencieMatchDto"];
export type UpdateLicencieProfileDto = components["schemas"]["UpdateLicencieProfileDto"];

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
