export type Platform = "instagram" | "tiktok" | "youtube" | "threads";

export type OnboardingEventName =
  | "survey_completed"
  | "platform_selected"
  | "account_connected"
  | "first_publish_clicked"
  | "expand_nudge_shown"
  | "expand_nudge_clicked"
  | "ideas_generated"
  | "schedule_cta_clicked";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          survey_choice: number | null;
          onboarding_completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          survey_choice?: number | null;
          onboarding_completed_at?: string | null;
        };
        Update: {
          survey_choice?: number | null;
          onboarding_completed_at?: string | null;
        };
      };
      connected_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: Platform;
          is_active: boolean;
          token_expires_at: string | null;
          connected_at: string;
        };
        Insert: {
          user_id: string;
          platform: Platform;
          is_active?: boolean;
          token_expires_at?: string | null;
        };
        Update: {
          is_active?: boolean;
          token_expires_at?: string | null;
        };
      };
      onboarding_events: {
        Row: {
          id: string;
          user_id: string;
          event_name: OnboardingEventName;
          properties: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          event_name: OnboardingEventName;
          properties?: Record<string, unknown> | null;
        };
        Update: never;
      };
    };
  };
}
