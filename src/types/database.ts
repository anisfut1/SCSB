/**
 * Types du schéma PostgreSQL — écrits à la main.
 *
 * À remplacer/compléter par `supabase gen types typescript` dès qu'un vrai
 * projet Supabase existe (voir README). En attendant, ce fichier doit rester
 * synchronisé manuellement avec `supabase/migrations/`.
 *
 * Note : `Relationships: []`, ainsi que `Views`/`Functions` vides sur le
 * schéma `public`, sont requis par le typage générique de
 * `@supabase/postgrest-js` (voir `GenericTable`/`GenericSchema`) — ce ne
 * sont pas des données, juste la forme attendue par la lib. `Table<Row,
 * Insert>` factorise cette forme pour éviter la répétition.
 */

type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export type AppRole =
  | "super_admin"
  | "correspondant_club"
  | "responsable_tables"
  | "coach"
  | "joueur"
  | "parent";

export type MatchStatus = "scheduled" | "played" | "postponed" | "cancelled" | "forfeit";
export type EmarqueMatchStatus = "not_applicable" | "pending" | "waiting_for_emarque" | "imported" | "error" | "needs_review";
export type SyncProvider = "ffbb" | "fbi";
export type SyncStatus = "running" | "success" | "partial" | "error";
export type EmarqueImportStatus = "discovered" | "downloading" | "downloaded" | "parsing" | "imported" | "error" | "needs_review";
export type TeamSide = "home" | "away";
export type CoachRole = "principal" | "adjoint";
export type RefereeRole = "referee_1" | "referee_2" | "referee_3";
export type TableOfficialRole = "scorer" | "assistant_scorer" | "timekeeper" | "shot_clock_operator" | "commissioner" | "other";

export interface Database {
  public: {
    Tables: {
      club: Table<
        { id: string; name: string; ffbb_club_id: string; created_at: string },
        { id?: string; name: string; ffbb_club_id: string; created_at?: string }
      >;

      licencies: Table<
        {
          id: string;
          club_id: string;
          first_name: string;
          last_name: string;
          birth_date: string | null;
          license_number: string | null;
          email: string | null;
          phone: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          club_id: string;
          first_name: string;
          last_name: string;
          birth_date?: string | null;
          license_number?: string | null;
          email?: string | null;
          phone?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;

      profiles: Table<
        { user_id: string; licencie_id: string | null; display_name: string | null; created_at: string; updated_at: string },
        { user_id: string; licencie_id?: string | null; display_name?: string | null; created_at?: string; updated_at?: string }
      >;

      user_roles: Table<
        { id: string; user_id: string; role: AppRole; scope_team_id: string | null; created_at: string },
        { id?: string; user_id: string; role: AppRole; scope_team_id?: string | null; created_at?: string }
      >;

      teams: Table<
        { id: string; club_id: string; name: string; category: string | null; active: boolean; created_at: string; updated_at: string },
        { id?: string; club_id: string; name: string; category?: string | null; active?: boolean; created_at?: string; updated_at?: string }
      >;

      competitions: Table<
        {
          id: string;
          ffbb_competition_id: string;
          name: string;
          code: string | null;
          sexe: string | null;
          type_competition: string | null;
          category_code: string | null;
          category_label: string | null;
          phase_code: string | null;
          live_stat: boolean;
          emarque_v2: boolean;
          publication_internet: boolean;
          season: string | null;
          parent_ffbb_competition_id: string | null;
          raw_ffbb_payload: unknown;
          ffbb_last_seen_at: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          ffbb_competition_id: string;
          name: string;
          code?: string | null;
          sexe?: string | null;
          type_competition?: string | null;
          category_code?: string | null;
          category_label?: string | null;
          phase_code?: string | null;
          live_stat?: boolean;
          emarque_v2?: boolean;
          publication_internet?: boolean;
          season?: string | null;
          parent_ffbb_competition_id?: string | null;
          raw_ffbb_payload?: unknown;
          ffbb_last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;

      pools: Table<
        {
          id: string;
          ffbb_pool_id: string;
          competition_id: string;
          name: string;
          raw_ffbb_payload: unknown;
          ffbb_last_seen_at: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          ffbb_pool_id: string;
          competition_id: string;
          name: string;
          raw_ffbb_payload?: unknown;
          ffbb_last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;

      venues: Table<
        {
          id: string;
          ffbb_venue_id: string | null;
          name: string | null;
          commune: string | null;
          raw_ffbb_payload: unknown;
          ffbb_last_seen_at: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          ffbb_venue_id?: string | null;
          name?: string | null;
          commune?: string | null;
          raw_ffbb_payload?: unknown;
          ffbb_last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;

      ffbb_team_engagements: Table<
        {
          id: string;
          team_id: string;
          ffbb_engagement_id: string;
          competition_id: string;
          pool_id: string | null;
          season: string | null;
          name: string | null;
          numero_equipe: string | null;
          raw_ffbb_payload: unknown;
          ffbb_last_seen_at: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          team_id: string;
          ffbb_engagement_id: string;
          competition_id: string;
          pool_id?: string | null;
          season?: string | null;
          name?: string | null;
          numero_equipe?: string | null;
          raw_ffbb_payload?: unknown;
          ffbb_last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;

      matches: Table<
        {
          id: string;
          ffbb_match_id: string;
          ffbb_unique_key: string | null;
          ffbb_gs_id: string | null;
          numero: string | null;
          team_id: string | null;
          competition_id: string | null;
          pool_id: string | null;
          journee: string | null;
          match_datetime: string | null;
          is_home: boolean | null;
          opponent_name: string | null;
          opponent_ffbb_organisme_id: string | null;
          venue_id: string | null;
          venue_raw_label: string | null;
          score_home: number | null;
          score_away: number | null;
          status: MatchStatus;
          emarque_status: EmarqueMatchStatus;
          emarque_discovery_attempt_count: number;
          emarque_next_discovery_attempt_at: string | null;
          raw_ffbb_payload: unknown;
          ffbb_last_seen_at: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          ffbb_match_id: string;
          ffbb_unique_key?: string | null;
          ffbb_gs_id?: string | null;
          numero?: string | null;
          team_id?: string | null;
          competition_id?: string | null;
          pool_id?: string | null;
          journee?: string | null;
          match_datetime?: string | null;
          is_home?: boolean | null;
          opponent_name?: string | null;
          opponent_ffbb_organisme_id?: string | null;
          venue_id?: string | null;
          venue_raw_label?: string | null;
          score_home?: number | null;
          score_away?: number | null;
          status?: MatchStatus;
          emarque_status?: EmarqueMatchStatus;
          emarque_discovery_attempt_count?: number;
          emarque_next_discovery_attempt_at?: string | null;
          raw_ffbb_payload?: unknown;
          ffbb_last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;

      match_change_history: Table<
        {
          id: string;
          match_id: string;
          sync_run_id: string | null;
          field_name: string;
          old_value: string | null;
          new_value: string | null;
          detected_at: string;
        },
        {
          id?: string;
          match_id: string;
          sync_run_id?: string | null;
          field_name: string;
          old_value?: string | null;
          new_value?: string | null;
          detected_at?: string;
        }
      >;

      sync_runs: Table<
        {
          id: string;
          provider: SyncProvider;
          started_at: string;
          finished_at: string | null;
          status: SyncStatus;
          stats: unknown;
          error_log: string | null;
          created_at: string;
        },
        {
          id?: string;
          provider: SyncProvider;
          started_at?: string;
          finished_at?: string | null;
          status?: SyncStatus;
          stats?: unknown;
          error_log?: string | null;
          created_at?: string;
        }
      >;

      fbi_credentials: Table<
        {
          id: string;
          club_id: string;
          username: string;
          password_ciphertext: string;
          password_iv: string;
          password_auth_tag: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          club_id: string;
          username: string;
          password_ciphertext: string;
          password_iv: string;
          password_auth_tag: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;

      fbi_integration_status: Table<
        {
          id: string;
          club_id: string;
          configured: boolean;
          last_test_at: string | null;
          last_test_success: boolean | null;
          last_test_message: string | null;
          last_login_at: string | null;
          last_login_success: boolean | null;
          last_job_at: string | null;
          last_job_status: string | null;
          last_error: string | null;
          updated_at: string;
        },
        {
          id?: string;
          club_id: string;
          configured?: boolean;
          last_test_at?: string | null;
          last_test_success?: boolean | null;
          last_test_message?: string | null;
          last_login_at?: string | null;
          last_login_success?: boolean | null;
          last_job_at?: string | null;
          last_job_status?: string | null;
          last_error?: string | null;
          updated_at?: string;
        }
      >;

      emarque_imports: Table<
        {
          id: string;
          match_id: string;
          source: "fbi";
          file_hash: string | null;
          source_file_name: string | null;
          storage_path: string | null;
          status: EmarqueImportStatus;
          parser_version: string | null;
          quality_warnings: unknown;
          discovered_at: string;
          downloaded_at: string | null;
          imported_at: string | null;
          last_error: string | null;
          attempt_count: number;
          next_attempt_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          match_id: string;
          source?: "fbi";
          file_hash?: string | null;
          source_file_name?: string | null;
          storage_path?: string | null;
          status?: EmarqueImportStatus;
          parser_version?: string | null;
          quality_warnings?: unknown;
          discovered_at?: string;
          downloaded_at?: string | null;
          imported_at?: string | null;
          last_error?: string | null;
          attempt_count?: number;
          next_attempt_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;

      match_participants: Table<
        {
          id: string;
          match_id: string;
          emarque_import_id: string;
          team_side: TeamSide;
          jersey_number: string | null;
          first_name: string | null;
          last_name: string | null;
          license_number: string | null;
          is_captain: boolean;
          is_starter: boolean | null;
          licencie_id: string | null;
          extraction_confidence: number | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          match_id: string;
          emarque_import_id: string;
          team_side: TeamSide;
          jersey_number?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          license_number?: string | null;
          is_captain?: boolean;
          is_starter?: boolean | null;
          licencie_id?: string | null;
          extraction_confidence?: number | null;
          created_at?: string;
          updated_at?: string;
        }
      >;

      match_coaches: Table<
        {
          id: string;
          match_id: string;
          emarque_import_id: string;
          team_side: TeamSide;
          role: CoachRole;
          first_name: string | null;
          last_name: string | null;
          license_number: string | null;
          licencie_id: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          match_id: string;
          emarque_import_id: string;
          team_side: TeamSide;
          role?: CoachRole;
          first_name?: string | null;
          last_name?: string | null;
          license_number?: string | null;
          licencie_id?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;

      match_officials: Table<
        {
          id: string;
          match_id: string;
          emarque_import_id: string;
          role: RefereeRole;
          first_name: string | null;
          last_name: string | null;
          license_number: string | null;
          licencie_id: string | null;
          created_at: string;
        },
        {
          id?: string;
          match_id: string;
          emarque_import_id: string;
          role: RefereeRole;
          first_name?: string | null;
          last_name?: string | null;
          license_number?: string | null;
          licencie_id?: string | null;
          created_at?: string;
        }
      >;

      match_table_officials: Table<
        {
          id: string;
          match_id: string;
          emarque_import_id: string;
          role: TableOfficialRole;
          first_name: string | null;
          last_name: string | null;
          license_number: string | null;
          licencie_id: string | null;
          extraction_confidence: number | null;
          created_at: string;
        },
        {
          id?: string;
          match_id: string;
          emarque_import_id: string;
          role: TableOfficialRole;
          first_name?: string | null;
          last_name?: string | null;
          license_number?: string | null;
          licencie_id?: string | null;
          extraction_confidence?: number | null;
          created_at?: string;
        }
      >;

      player_match_stats: Table<
        {
          id: string;
          match_id: string;
          participant_id: string;
          seconds_played: number | null;
          points: number | null;
          shots_made: number | null;
          three_points_made: number | null;
          two_points_interior_made: number | null;
          two_points_exterior_made: number | null;
          free_throws_made: number | null;
          fouls_committed: number | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          match_id: string;
          participant_id: string;
          seconds_played?: number | null;
          points?: number | null;
          shots_made?: number | null;
          three_points_made?: number | null;
          two_points_interior_made?: number | null;
          two_points_exterior_made?: number | null;
          free_throws_made?: number | null;
          fouls_committed?: number | null;
          created_at?: string;
          updated_at?: string;
        }
      >;

      shot_events: Table<
        {
          id: string;
          match_id: string;
          participant_id: string | null;
          team_side: TeamSide;
          period: number | null;
          made: boolean;
          shot_type: string | null;
          x: number | null;
          y: number | null;
          created_at: string;
        },
        {
          id?: string;
          match_id: string;
          participant_id?: string | null;
          team_side: TeamSide;
          period?: number | null;
          made: boolean;
          shot_type?: string | null;
          x?: number | null;
          y?: number | null;
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
    };
  };
}
