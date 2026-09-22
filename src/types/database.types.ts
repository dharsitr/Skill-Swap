export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SkillType = "teach" | "learn";
export type SessionStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          name: string;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_skills: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          type: SkillType;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          type: SkillType;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_id?: string;
          type?: SkillType;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_skills_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      availability: {
        Row: {
          id: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availability_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          id: string;
          teacher_id: string;
          learner_id: string;
          skill_id: string;
          scheduled_at: string;
          duration: number;
          status: SessionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          learner_id: string;
          skill_id: string;
          scheduled_at: string;
          duration: number;
          status?: SessionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          learner_id?: string;
          skill_id?: string;
          scheduled_at?: string;
          duration?: number;
          status?: SessionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_learner_id_fkey";
            columns: ["learner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      credits: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      handle_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience Type Aliases
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type ProfileRow = Tables<"profiles">;
export type ProfileInsert = Inserts<"profiles">;
export type ProfileUpdate = Updates<"profiles">;

export type SkillDbRow = Tables<"skills">;
export type SkillDbInsert = Inserts<"skills">;
export type SkillDbUpdate = Updates<"skills">;

export type UserSkillRow = Tables<"user_skills">;
export type UserSkillInsert = Inserts<"user_skills">;
export type UserSkillUpdate = Updates<"user_skills">;

export type AvailabilityRow = Tables<"availability">;
export type AvailabilityInsert = Inserts<"availability">;
export type AvailabilityUpdate = Updates<"availability">;

export type SessionDbRow = Tables<"sessions">;
export type SessionDbInsert = Inserts<"sessions">;
export type SessionDbUpdate = Updates<"sessions">;

export type CreditRow = Tables<"credits">;
export type CreditInsert = Inserts<"credits">;
export type CreditUpdate = Updates<"credits">;

export type NotificationDbRow = Tables<"notifications">;
export type NotificationDbInsert = Inserts<"notifications">;
export type NotificationDbUpdate = Updates<"notifications">;
