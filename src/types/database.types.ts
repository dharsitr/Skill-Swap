export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SkillType = "teach" | "learn";
export type SessionStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";
export type ConnectionStatus = "pending" | "accepted" | "declined" | "cancelled";
export type TransactionType =
  | "welcome_bonus"
  | "teach_reward"
  | "learn_spend"
  | "refund"
  | "adjustment";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          headline: string | null;
          bio: string | null;
          avatar_url: string | null;
          location: string | null;
          timezone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          headline?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          headline?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          timezone?: string | null;
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
          credit_amount: number;
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
          duration?: number;
          credit_amount?: number;
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
          credit_amount?: number;
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
          link_url: string | null;
          reference_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link_url?: string | null;
          reference_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          link_url?: string | null;
          reference_id?: string | null;
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
      connection_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: ConnectionStatus;
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: ConnectionStatus;
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: ConnectionStatus;
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "connection_requests_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "connection_requests_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          transaction_type: TransactionType;
          description: string;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          transaction_type: TransactionType;
          description: string;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          transaction_type?: TransactionType;
          description?: string;
          reference_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          joined_at: string;
          last_read_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          joined_at?: string;
          last_read_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
          last_read_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          updated_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          session_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey";
            columns: ["reviewee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          messages_enabled: boolean;
          connection_requests_enabled: boolean;
          session_reminders_enabled: boolean;
          session_updates_enabled: boolean;
          reviews_enabled: boolean;
          credit_activity_enabled: boolean;
          email_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          messages_enabled?: boolean;
          connection_requests_enabled?: boolean;
          session_reminders_enabled?: boolean;
          session_updates_enabled?: boolean;
          reviews_enabled?: boolean;
          credit_activity_enabled?: boolean;
          email_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          messages_enabled?: boolean;
          connection_requests_enabled?: boolean;
          session_reminders_enabled?: boolean;
          session_updates_enabled?: boolean;
          reviews_enabled?: boolean;
          credit_activity_enabled?: boolean;
          email_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      privacy_preferences: {
        Row: {
          id: string;
          user_id: string;
          profile_visibility: "public" | "connections" | "hidden";
          allow_connection_requests: "everyone" | "verified" | "none";
          show_online_status: boolean;
          show_availability: boolean;
          show_completed_sessions: boolean;
          show_rating_summary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_visibility?: "public" | "connections" | "hidden";
          allow_connection_requests?: "everyone" | "verified" | "none";
          show_online_status?: boolean;
          show_availability?: boolean;
          show_completed_sessions?: boolean;
          show_rating_summary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          profile_visibility?: "public" | "connections" | "hidden";
          allow_connection_requests?: "everyone" | "verified" | "none";
          show_online_status?: boolean;
          show_availability?: boolean;
          show_completed_sessions?: boolean;
          show_rating_summary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "privacy_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          default_session_duration: number;
          auto_accept_connections: boolean;
          cancellation_notice_hours: number;
          read_receipts_enabled: boolean;
          typing_indicators_enabled: boolean;
          message_sounds_enabled: boolean;
          theme: "light" | "dark" | "system";
          layout_density: "comfortable" | "compact";
          language: string;
          date_format: string;
          time_format: "12h" | "24h";
          preferred_camera_id: string | null;
          preferred_mic_id: string | null;
          preferred_speaker_id: string | null;
          video_quality: "480p" | "720p" | "1080p";
          mirror_video: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          default_session_duration?: number;
          auto_accept_connections?: boolean;
          cancellation_notice_hours?: number;
          read_receipts_enabled?: boolean;
          typing_indicators_enabled?: boolean;
          message_sounds_enabled?: boolean;
          theme?: "light" | "dark" | "system";
          layout_density?: "comfortable" | "compact";
          language?: string;
          date_format?: string;
          time_format?: "12h" | "24h";
          preferred_camera_id?: string | null;
          preferred_mic_id?: string | null;
          preferred_speaker_id?: string | null;
          video_quality?: "480p" | "720p" | "1080p";
          mirror_video?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          default_session_duration?: number;
          auto_accept_connections?: boolean;
          cancellation_notice_hours?: number;
          read_receipts_enabled?: boolean;
          typing_indicators_enabled?: boolean;
          message_sounds_enabled?: boolean;
          theme?: "light" | "dark" | "system";
          layout_density?: "comfortable" | "compact";
          language?: string;
          date_format?: string;
          time_format?: "12h" | "24h";
          preferred_camera_id?: string | null;
          preferred_mic_id?: string | null;
          preferred_speaker_id?: string | null;
          video_quality?: "480p" | "720p" | "1080p";
          mirror_video?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
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
      process_credit_transaction: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_transaction_type: string;
          p_description: string;
          p_reference_id?: string | null;
        };
        Returns: {
          success: boolean;
          transaction_id: string;
          balance: number;
          previous_balance: number;
          amount: number;
        };
      };
      book_session: {
        Args: {
          p_teacher_id: string;
          p_learner_id: string;
          p_skill_id: string;
          p_scheduled_at: string;
          p_duration?: number;
          p_credit_amount?: number;
        };
        Returns: {
          success: boolean;
          session_id: string;
          status: string;
          scheduled_at: string;
          credit_amount: number;
        };
      };
      confirm_session: {
        Args: {
          p_session_id: string;
          p_caller_id: string;
        };
        Returns: {
          success: boolean;
          session_id: string;
          status: string;
          learner_balance: number;
        };
      };
      cancel_session: {
        Args: {
          p_session_id: string;
          p_caller_id: string;
          p_reason?: string | null;
        };
        Returns: {
          success: boolean;
          session_id: string;
          status: string;
          refunded: boolean;
        };
      };
      reject_session: {
        Args: {
          p_session_id: string;
          p_caller_id: string;
        };
        Returns: {
          success: boolean;
          session_id: string;
          status: string;
        };
      };
      complete_session: {
        Args: {
          p_session_id: string;
          p_caller_id: string;
        };
        Returns: {
          success: boolean;
          session_id: string;
          status: string;
          teacher_rewarded: boolean;
        };
      };
      get_or_create_conversation: {
        Args: {
          p_user_a: string;
          p_user_b: string;
        };
        Returns: string;
      };
      mark_messages_read: {
        Args: {
          p_conversation_id: string;
          p_user_id: string;
        };
        Returns: number;
      };
      create_notification: {
        Args: {
          p_user_id: string;
          p_type: string;
          p_title: string;
          p_message: string;
          p_link_url?: string | null;
          p_reference_id?: string | null;
        };
        Returns: string;
      };
      check_and_create_session_reminders: {
        Args: {
          p_user_id: string;
        };
        Returns: number;
      };
      get_user_rating_summary: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          average_rating: number;
          total_reviews: number;
          five_star: number;
          four_star: number;
          three_star: number;
          two_star: number;
          one_star: number;
        }[];
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

export type ConnectionRequestRow = Tables<"connection_requests">;
export type ConnectionRequestInsert = Inserts<"connection_requests">;
export type ConnectionRequestUpdate = Updates<"connection_requests">;

export type CreditTransactionRow = Tables<"credit_transactions">;
export type CreditTransactionInsert = Inserts<"credit_transactions">;
export type CreditTransactionUpdate = Updates<"credit_transactions">;

export type ConversationRow = Tables<"conversations">;
export type ConversationInsert = Inserts<"conversations">;
export type ConversationUpdate = Updates<"conversations">;

export type ConversationParticipantRow = Tables<"conversation_participants">;
export type ConversationParticipantInsert = Inserts<"conversation_participants">;
export type ConversationParticipantUpdate = Updates<"conversation_participants">;

export type MessageRow = Tables<"messages">;
export type MessageInsert = Inserts<"messages">;
export type MessageUpdate = Updates<"messages">;

export type ReviewDbRow = Tables<"reviews">;
export type ReviewDbInsert = Inserts<"reviews">;
export type ReviewDbUpdate = Updates<"reviews">;

export type NotificationPreferencesRow = Tables<"notification_preferences">;
export type NotificationPreferencesInsert = Inserts<"notification_preferences">;
export type NotificationPreferencesUpdate = Updates<"notification_preferences">;

export type PrivacyPreferencesRow = Tables<"privacy_preferences">;
export type PrivacyPreferencesInsert = Inserts<"privacy_preferences">;
export type PrivacyPreferencesUpdate = Updates<"privacy_preferences">;

export type UserPreferencesRow = Tables<"user_preferences">;
export type UserPreferencesInsert = Inserts<"user_preferences">;
export type UserPreferencesUpdate = Updates<"user_preferences">;


