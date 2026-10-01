import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

/** Gymnases du club (planning des demandes de dérogation). Les rôles Coach / Coordinateur se posent sur les licenciés (/joueurs). */
export type ClubVenueAdminDto = components["schemas"]["ClubVenueAdminDto"];
export type UpdateClubVenueDto = components["schemas"]["UpdateClubVenueDto"];

export async function listClubVenues(fetcher: ApiFetcher, clubId: string): Promise<ClubVenueAdminDto[]> {
  const { venues } = await fetcher<{ venues: ClubVenueAdminDto[] }>(`/v1/clubs/${clubId}/venues`);
  return venues;
}

export async function updateClubVenue(fetcher: ApiFetcher, clubId: string, venueId: string, body: UpdateClubVenueDto): Promise<ClubVenueAdminDto> {
  const { venue } = await fetcher<{ venue: ClubVenueAdminDto }>(`/v1/clubs/${clubId}/venues/${venueId}`, { method: "PATCH", body });
  return venue;
}
