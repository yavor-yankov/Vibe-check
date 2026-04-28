// Hand-maintained Supabase schema type matching supabase/migrations/0001_initial_schema.sql.
//
// Once the project is linked to the Supabase CLI we can regenerate this file via:
//   pnpm dlx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
// Until then, keep this file in sync with the migration by hand.

export type SubscriptionTier = "free" | "pro" | "lifetime";
export type SessionStage = "intro" | "interview" | "scanning" | "report";
export type MessageRole = "user" | "assistant" | "system";
export type Verdict = "build_it" | "iterate" | "rethink" | "skip";

type EmptyRelationships = [];

type SessionFkRelationship<Name extends string> = [
  {
    foreignKeyName: Name;
    columns: ["session_id"];
    isOneToOne: false;
    referencedRelation: "sessions";
    referencedColumns: ["id"];
  }
];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          subscription_tier: SubscriptionTier;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          subscription_status: string | null;
          current_period_end: string | null;
          usage_month: string | null;
          usage_count: number;
          webhook_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          subscription_tier?: SubscriptionTier;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          subscription_status?: string | null;
          current_period_end?: string | null;
          usage_month?: string | null;
          usage_count?: number;
          webhook_url?: string | null;
        };
        Update: {
          email?: string;
          subscription_tier?: SubscriptionTier;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          subscription_status?: string | null;
          current_period_end?: string | null;
          usage_month?: string | null;
          usage_count?: number;
          webhook_url?: string | null;
        };
        Relationships: EmptyRelationships;
      };
      tavily_cache: {
        Row: {
          query_key: string;
          query: string;
          response: unknown;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          query_key: string;
          query: string;
          response: unknown;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          query?: string;
          response?: unknown;
          expires_at?: string;
        };
        Relationships: EmptyRelationships;
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          stage: SessionStage;
          idea_summary: string | null;
          report_generation: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          stage?: SessionStage;
          idea_summary?: string | null;
          report_generation?: number;
        };
        Update: {
          title?: string;
          stage?: SessionStage;
          idea_summary?: string | null;
          report_generation?: number;
        };
        Relationships: EmptyRelationships;
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          role: MessageRole;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: MessageRole;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: SessionFkRelationship<"messages_session_id_fkey">;
      };
      competitors: {
        Row: {
          id: string;
          session_id: string;
          title: string;
          url: string;
          snippet: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          title: string;
          url: string;
          snippet?: string | null;
        };
        Update: {
          title?: string;
          url?: string;
          snippet?: string | null;
        };
        Relationships: SessionFkRelationship<"competitors_session_id_fkey">;
      };
      reports: {
        Row: {
          id: string;
          session_id: string;
          verdict: Verdict;
          verdict_label: string;
          summary: string;
          scores: Record<string, number>;
          strengths: string[];
          risks: string[];
          unique_angles: string[];
          tech_stack: Record<string, string[]>;
          roadmap: Array<{ title: string; detail: string; estimate: string }>;
          mvp_scope: string[];
          insights: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          verdict: Verdict;
          verdict_label: string;
          summary: string;
          scores: Record<string, number>;
          strengths?: string[];
          risks?: string[];
          unique_angles?: string[];
          tech_stack: Record<string, string[]>;
          roadmap?: Array<{ title: string; detail: string; estimate: string }>;
          mvp_scope?: string[];
          insights?: Record<string, unknown> | null;
        };
        Update: {
          verdict?: Verdict;
          verdict_label?: string;
          summary?: string;
          scores?: Record<string, number>;
          strengths?: string[];
          risks?: string[];
          unique_angles?: string[];
          tech_stack?: Record<string, string[]>;
          roadmap?: Array<{ title: string; detail: string; estimate: string }>;
          mvp_scope?: string[];
          insights?: Record<string, unknown> | null;
        };
        Relationships: SessionFkRelationship<"reports_session_id_fkey">;
      };
      red_team_reports: {
        Row: {
          id: string;
          session_id: string;
          verdict: string;
          reasons: string[];
          silent_killers: string[];
          report_generation: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          verdict: string;
          reasons?: string[];
          silent_killers?: string[];
          report_generation: number;
        };
        Update: {
          verdict?: string;
          reasons?: string[];
          silent_killers?: string[];
          report_generation?: number;
        };
        Relationships: SessionFkRelationship<"red_team_reports_session_id_fkey">;
      };
      stripe_events: {
        Row: {
          event_id: string;
          created_at: string;
        };
        Insert: {
          event_id: string;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          created_at?: string;
        };
        Relationships: EmptyRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_usage: {
        Args: {
          p_user_id: string;
          p_month: string;
          p_unlimited: boolean;
          p_monthly_quota: number;
        };
        Returns: number;
      };
      decrement_usage: {
        Args: {
          p_user_id: string;
          p_month: string;
        };
        Returns: number;
      };
      upsert_session_full: {
        Args: {
          p_session_id: string;
          p_user_id: string;
          p_title: string;
          p_stage: string;
          p_idea_summary: string | null;
          p_report_generation: number;
          p_messages: unknown;        // jsonb array
          p_competitors: unknown;     // jsonb array
          p_report: unknown | null;   // jsonb object or null
          p_red_team: unknown | null; // jsonb object or null
        };
        Returns: {
          session: {
            id: string;
            title: string;
            stage: string;
            idea_summary: string | null;
            report_generation: number;
            created_at: string;
            updated_at: string;
            messages: unknown[];
            competitors: unknown[];
            reports: unknown[];
            red_team_reports: unknown[];
          };
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
