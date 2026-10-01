import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

/** Membres & rôles du club (club_admin) — coachs (portée équipe) et coordinateur (`correspondant_club`). */
export type ClubMemberDto = components["schemas"]["ClubMemberDto"];
export type RoleGrantDto = components["schemas"]["RoleGrantDto"];
export type ClubVenueAdminDto = components["schemas"]["ClubVenueAdminDto"];
export type UpdateClubVenueDto = components["schemas"]["UpdateClubVenueDto"];

export async function listMembers(fetcher: ApiFetcher, clubId: string): Promise<ClubMemberDto[]> {
  const { members } = await fetcher<{ members: ClubMemberDto[] }>(`/v1/clubs/${clubId}/members`);
  return members;
}

export async function setMemberRoles(fetcher: ApiFetcher, clubId: string, membershipId: string, roles: RoleGrantDto[]): Promise<ClubMemberDto[]> {
  const { members } = await fetcher<{ members: ClubMemberDto[] }>(`/v1/clubs/${clubId}/members/${membershipId}/roles`, { method: "PUT", body: { roles } });
  return members;
}

export async function inviteMember(fetcher: ApiFetcher, clubId: string, email: string, roles: RoleGrantDto[]): Promise<ClubMemberDto[]> {
  const { members } = await fetcher<{ members: ClubMemberDto[] }>(`/v1/clubs/${clubId}/members`, { method: "POST", body: { email, roles } });
  return members;
}

export async function listClubVenues(fetcher: ApiFetcher, clubId: string): Promise<ClubVenueAdminDto[]> {
  const { venues } = await fetcher<{ venues: ClubVenueAdminDto[] }>(`/v1/clubs/${clubId}/venues`);
  return venues;
}

export async function updateClubVenue(fetcher: ApiFetcher, clubId: string, venueId: string, body: UpdateClubVenueDto): Promise<ClubVenueAdminDto> {
  const { venue } = await fetcher<{ venue: ClubVenueAdminDto }>(`/v1/clubs/${clubId}/venues/${venueId}`, { method: "PATCH", body });
  return venue;
}
