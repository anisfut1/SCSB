/**
 * Types du schéma PostgreSQL — écrits à la main pour la Phase 0.
 *
 * À remplacer/compléter par `supabase gen types typescript` dès qu'un vrai
 * projet Supabase existe (voir README). En attendant, ce fichier doit rester
 * synchronisé manuellement avec `supabase/migrations/`.
 *
 * Note : `Relationships: []`, ainsi que `Views`/`Functions` vides sur le
 * schéma `public`, sont requis par le typage générique de
 * `@supabase/postgrest-js` (voir `GenericTable`/`GenericSchema`) — ce ne
 * sont pas des données, juste la forme attendue par la lib.
 */

export type AppRole =
  | "super_admin"
  | "correspondant_club"
  | "responsable_tables"
  | "coach"
  | "joueur"
  | "parent";

export interface Database {
  public: {
    Tables: {
      club: {
        Row: {
          id: string;
          name: string;
          ffbb_club_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          ffbb_club_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["club"]["Insert"]>;
        Relationships: [];
      };
      licencies: {
        Row: {
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
        };
        Insert: {
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
        };
        Update: Partial<Database["public"]["Tables"]["licencies"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          licencie_id: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          licencie_id?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: AppRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
    };
  };
}
