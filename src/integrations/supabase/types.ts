export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          created_at: string
          description: string | null
          equity_offered: number | null
          financial_projections: Json | null
          id: string
          industry: string | null
          is_approved: boolean
          is_verified: boolean
          logo_url: string | null
          name: string
          owner_id: string
          pitch_deck_url: string | null
          pitch_summary: string | null
          province: string | null
          registration_doc_url: string | null
          registration_number: string | null
          updated_at: string
          valuation: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          equity_offered?: number | null
          financial_projections?: Json | null
          id?: string
          industry?: string | null
          is_approved?: boolean
          is_verified?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          pitch_deck_url?: string | null
          pitch_summary?: string | null
          province?: string | null
          registration_doc_url?: string | null
          registration_number?: string | null
          updated_at?: string
          valuation?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          equity_offered?: number | null
          financial_projections?: Json | null
          id?: string
          industry?: string | null
          is_approved?: boolean
          is_verified?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          pitch_deck_url?: string | null
          pitch_summary?: string | null
          province?: string | null
          registration_doc_url?: string | null
          registration_number?: string | null
          updated_at?: string
          valuation?: number | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          business_id: string
          created_at: string
          currency: string
          end_date: string | null
          funding_type: Database["public"]["Enums"]["funding_type"]
          goal_amount: number
          id: string
          loan_interest_rate: number | null
          loan_term_months: number | null
          proposal_doc_url: string | null
          proposal_market_size: string | null
          proposal_problem: string | null
          proposal_revenue_model: string | null
          proposal_solution: string | null
          proposal_traction: string | null
          proposal_use_of_funds: string | null
          raised_amount: number
          revenue_share_percentage: number | null
          reward_tiers: Json | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          currency?: string
          end_date?: string | null
          funding_type: Database["public"]["Enums"]["funding_type"]
          goal_amount: number
          id?: string
          loan_interest_rate?: number | null
          loan_term_months?: number | null
          proposal_doc_url?: string | null
          proposal_market_size?: string | null
          proposal_problem?: string | null
          proposal_revenue_model?: string | null
          proposal_solution?: string | null
          proposal_traction?: string | null
          proposal_use_of_funds?: string | null
          raised_amount?: number
          revenue_share_percentage?: number | null
          reward_tiers?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          currency?: string
          end_date?: string | null
          funding_type?: Database["public"]["Enums"]["funding_type"]
          goal_amount?: number
          id?: string
          loan_interest_rate?: number | null
          loan_term_months?: number | null
          proposal_doc_url?: string | null
          proposal_market_size?: string | null
          proposal_problem?: string | null
          proposal_revenue_model?: string | null
          proposal_solution?: string | null
          proposal_traction?: string | null
          proposal_use_of_funds?: string | null
          raised_amount?: number
          revenue_share_percentage?: number | null
          reward_tiers?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          amount: number
          campaign_id: string
          created_at: string
          currency: string
          id: string
          investor_id: string
          payment_method: string | null
          payment_reference: string | null
          status: Database["public"]["Enums"]["investment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          campaign_id: string
          created_at?: string
          currency?: string
          id?: string
          investor_id: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["investment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign_id?: string
          created_at?: string
          currency?: string
          id?: string
          investor_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["investment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_suspended: boolean
          is_verified: boolean
          phone: string | null
          province: string | null
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          is_verified?: boolean
          phone?: string | null
          province?: string | null
          updated_at?: string
          user_id: string
          user_type?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          is_verified?: boolean
          phone?: string | null
          province?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          investment_id: string | null
          metadata: Json | null
          payment_provider: string | null
          payment_reference: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          investment_id?: string | null
          metadata?: Json | null
          payment_provider?: string | null
          payment_reference?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          investment_id?: string | null
          metadata?: Json | null
          payment_provider?: string | null
          payment_reference?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      campaign_status:
        | "draft"
        | "pending_review"
        | "active"
        | "funded"
        | "closed"
        | "rejected"
      funding_type: "equity" | "revenue_share" | "crowdfunding" | "loan"
      investment_status: "pledged" | "paid" | "confirmed" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      campaign_status: [
        "draft",
        "pending_review",
        "active",
        "funded",
        "closed",
        "rejected",
      ],
      funding_type: ["equity", "revenue_share", "crowdfunding", "loan"],
      investment_status: ["pledged", "paid", "confirmed", "refunded"],
    },
  },
} as const
