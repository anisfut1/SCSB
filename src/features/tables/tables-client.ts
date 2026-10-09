import { browserApi } from "@/lib/api/browserClient";
import { deletePublicTableAssignment, getPublicTableSuggestions, putPublicTableAssignment, setPublicRefereeStatus } from "@/lib/api/publicTables";
import type { TableAssignmentResultDto, TableAssignmentRole, TableSuggestionsDto } from "@/lib/api/tables";

/**
 * Actions de la vue « désigner » des Tables de marque, quel que soit le
 * point d'entrée : espace club connecté (club_admin / responsable_tables)
 * ou espace public d'un coach / admin du club via son lien personnel
 * (retour du club, 2026-10-02 : « comme un admin général »). Mêmes cartes,
 * mêmes suggestions — le serveur revérifie les droits à chaque appel.
 */
export interface TablesClient {
  suggestions(matchId: string, role: TableAssignmentRole): Promise<TableSuggestionsDto>;
  /** `ignoreMatchConflict` : désigner quand même quelqu'un dont l'équipe joue sur ce créneau (seul MATCH_CONFLICT est levé côté serveur). */
  assign(matchId: string, role: TableAssignmentRole, licencieId: string, options?: { ignoreMatchConflict?: boolean }): Promise<TableAssignmentResultDto>;
  unassign(matchId: string, role: TableAssignmentRole): Promise<void>;
  setRefereeStatus(matchId: string, noRefereeNeeded: boolean): Promise<unknown>;
}

export function clubTablesClient(clubId: string): TablesClient {
  return {
    suggestions: (matchId, role) => browserApi.tables.suggestions(clubId, matchId, role),
    assign: (matchId, role, licencieId, options) => browserApi.tables.assign(clubId, matchId, role, { licencieId, ...(options?.ignoreMatchConflict ? { ignoreMatchConflict: true } : {}) }),
    unassign: (matchId, role) => browserApi.tables.unassign(clubId, matchId, role),
    setRefereeStatus: (matchId, noRefereeNeeded) => browserApi.tables.setRefereeStatus(clubId, matchId, noRefereeNeeded),
  };
}

export function publicTablesClient(clubSlug: string, token: string): TablesClient {
  return {
    suggestions: (matchId, role) => getPublicTableSuggestions(clubSlug, token, matchId, role),
    assign: (matchId, role, licencieId, options) => putPublicTableAssignment(clubSlug, token, matchId, role, licencieId, options?.ignoreMatchConflict),
    unassign: (matchId, role) => deletePublicTableAssignment(clubSlug, token, matchId, role),
    setRefereeStatus: (matchId, noRefereeNeeded) => setPublicRefereeStatus(clubSlug, token, matchId, noRefereeNeeded),
  };
}
