/**
 * Sous-ensemble minimal (et volontairement indépendant, voir README.md
 * "Pourquoi dupliquer") des types de src/types/database.ts — uniquement les
 * tables et colonnes que LE WORKER touche réellement. La source de vérité
 * du schéma reste supabase/migrations/.
 */
export type FbiJobType = "test_connection" | "discover_emarque";
export type FbiJobStatus = "pending" | "claimed" | "running" | "succeeded" | "failed";
export type EmarqueMatchStatus =
  | "not_applicable"
  | "pending"
  | "waiting_for_emarque"
  | "discovered"
  | "downloading"
  | "downloaded"
  | "parsing"
  | "imported"
  | "error"
  | "needs_review";
export type MatchDocumentType = "emarque_zip" | "match_sheet" | "summary" | "shot_chart" | "other";
export type MatchDocumentStatus = "downloaded" | "parsing" | "imported" | "error";

// `type`, pas `interface` : voir src/types/database.ts pour l'explication
// complète (postgrest-js exige `Record<string, unknown>` pour `Row`, et
// seul un alias de type sur un littéral d'objet obtient la signature
// d'index implicite qui satisfait cette contrainte — une interface reste
// "ouverte" et fait silencieusement collapser tout le schéma en `never`).
export type FbiJobRow = {
  id: string;
  club_id: string;
  match_id: string | null;
  type: FbiJobType;
  status: FbiJobStatus;
  attempt_count: number;
  max_attempts: number;
  scheduled_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
  started_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  result: unknown;
  created_at: string;
};

type Table<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] };
type Fn<Args, Returns> = { Args: Args; Returns: Returns };

export interface WorkerDatabase {
  public: {
    Tables: {
      fbi_jobs: Table<
        FbiJobRow,
        {
          id?: string;
          club_id: string;
          match_id?: string | null;
          type: FbiJobType;
          status?: FbiJobStatus;
          attempt_count?: number;
          scheduled_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
          last_error?: string | null;
          result?: unknown;
        }
      >;
      fbi_credentials: Table<
        {
          club_id: string;
          username: string;
          password_ciphertext: string;
          password_iv: string;
          password_auth_tag: string;
        },
        never
      >;
      fbi_integration_status: Table<
        { club_id: string; configured: boolean },
        {
          club_id: string;
          configured?: boolean;
          last_test_at?: string;
          last_test_success?: boolean;
          last_test_message?: string;
          last_login_at?: string;
          last_login_success?: boolean;
          last_job_at?: string;
          last_job_status?: string;
          last_error?: string | null;
          updated_at?: string;
        }
      >;
      matches: Table<
        { id: string; club_id: string; numero: string | null; match_datetime: string | null; emarque_status: EmarqueMatchStatus },
        { emarque_status?: EmarqueMatchStatus }
      >;
      match_documents: Table<
        {
          id: string;
          club_id: string;
          match_id: string;
          type: MatchDocumentType;
          source: "fbi";
          filename: string | null;
          mime_type: string | null;
          sha256: string;
          storage_path: string;
          status: MatchDocumentStatus;
          discovered_at: string;
          downloaded_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          club_id: string;
          match_id: string;
          type: MatchDocumentType;
          source?: "fbi";
          filename?: string | null;
          mime_type?: string | null;
          sha256: string;
          storage_path: string;
          status?: MatchDocumentStatus;
          downloaded_at?: string | null;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      claim_next_fbi_job: Fn<{ p_worker_id: string }, FbiJobRow | null>;
    };
    Enums: Record<string, never>;
  };
}
