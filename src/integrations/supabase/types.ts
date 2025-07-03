export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics_data: {
        Row: {
          campaign_id: string
          comments: number | null
          content_url: string
          created_at: string
          engagement: number | null
          engagement_rate: number | null
          fetched_at: string
          id: string
          likes: number | null
          platform: string
          sentiment_label: string | null
          sentiment_score: number | null
          shares: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          campaign_id: string
          comments?: number | null
          content_url: string
          created_at?: string
          engagement?: number | null
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          likes?: number | null
          platform: string
          sentiment_label?: string | null
          sentiment_score?: number | null
          shares?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          campaign_id?: string
          comments?: number | null
          content_url?: string
          created_at?: string
          engagement?: number | null
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          likes?: number | null
          platform?: string
          sentiment_label?: string | null
          sentiment_score?: number | null
          shares?: number | null
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_data_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_data_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dashboard_analytics"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      analytics_jobs: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          platform: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dashboard_analytics"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      api_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          platform: string
          response_data: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at: string
          id?: string
          platform: string
          response_data: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          platform?: string
          response_data?: Json
        }
        Relationships: []
      }
      api_credentials: {
        Row: {
          created_at: string
          credential_type: string
          encrypted_value: string
          expires_at: string | null
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_type: string
          encrypted_value: string
          expires_at?: string | null
          id?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_type?: string
          encrypted_value?: string
          expires_at?: string | null
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          brand_name: string
          campaign_date: string
          campaign_month: string | null
          client_id: string | null
          client_name: string | null
          created_at: string
          creator_id: string
          deal_value: number | null
          engagement_rate: number | null
          id: string
          is_master_campaign_template: boolean | null
          master_campaign_end_date: string | null
          master_campaign_id: string | null
          master_campaign_name: string | null
          master_campaign_start_date: string | null
          status: string | null
          total_engagement: number | null
          total_views: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_name: string
          campaign_date: string
          campaign_month?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          creator_id: string
          deal_value?: number | null
          engagement_rate?: number | null
          id?: string
          is_master_campaign_template?: boolean | null
          master_campaign_end_date?: string | null
          master_campaign_id?: string | null
          master_campaign_name?: string | null
          master_campaign_start_date?: string | null
          status?: string | null
          total_engagement?: number | null
          total_views?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_name?: string
          campaign_date?: string
          campaign_month?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          creator_id?: string
          deal_value?: number | null
          engagement_rate?: number | null
          id?: string
          is_master_campaign_template?: boolean | null
          master_campaign_end_date?: string | null
          master_campaign_id?: string | null
          master_campaign_name?: string | null
          master_campaign_start_date?: string | null
          status?: string | null
          total_engagement?: number | null
          total_views?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_master_campaign_id_fkey"
            columns: ["master_campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_master_campaign_id_fkey"
            columns: ["master_campaign_id"]
            isOneToOne: false
            referencedRelation: "dashboard_analytics"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_analytics: {
        Row: {
          created_at: string
          creator_roster_id: string
          date_recorded: string | null
          fetched_at: string
          id: string
          metric_type: string
          metric_value: number
          platform: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_roster_id: string
          date_recorded?: string | null
          fetched_at?: string
          id?: string
          metric_type: string
          metric_value?: number
          platform: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_roster_id?: string
          date_recorded?: string | null
          fetched_at?: string
          id?: string
          metric_type?: string
          metric_value?: number
          platform?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_analytics_creator_roster_id_fkey"
            columns: ["creator_roster_id"]
            isOneToOne: false
            referencedRelation: "creator_roster"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_roster: {
        Row: {
          channel_links: Json | null
          channel_stats: Json | null
          created_at: string
          creator_name: string
          id: string
          last_updated: string | null
          social_media_handles: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_links?: Json | null
          channel_stats?: Json | null
          created_at?: string
          creator_name: string
          id?: string
          last_updated?: string | null
          social_media_handles?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_links?: Json | null
          channel_stats?: Json | null
          created_at?: string
          creator_name?: string
          id?: string
          last_updated?: string | null
          social_media_handles?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      creators: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          platform_handles: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          platform_handles?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          platform_handles?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roster_analytics: {
        Row: {
          created_at: string
          fetched_at: string
          id: string
          metric_type: string
          metric_value: number | null
          platform: string
          roster_id: string
        }
        Insert: {
          created_at?: string
          fetched_at?: string
          id?: string
          metric_type: string
          metric_value?: number | null
          platform: string
          roster_id: string
        }
        Update: {
          created_at?: string
          fetched_at?: string
          id?: string
          metric_type?: string
          metric_value?: number | null
          platform?: string
          roster_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_analytics_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "creator_roster"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_analytics: {
        Row: {
          channel_handle: string | null
          channel_id: string | null
          channel_name: string | null
          comments: number | null
          created_at: string
          creator_roster_id: string
          date_recorded: string | null
          engagement_rate: number | null
          fetched_at: string
          id: string
          likes: number | null
          published_at: string | null
          subscribers: number | null
          title: string | null
          updated_at: string
          video_id: string | null
          views: number | null
          watch_time_hours: number | null
        }
        Insert: {
          channel_handle?: string | null
          channel_id?: string | null
          channel_name?: string | null
          comments?: number | null
          created_at?: string
          creator_roster_id: string
          date_recorded?: string | null
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          likes?: number | null
          published_at?: string | null
          subscribers?: number | null
          title?: string | null
          updated_at?: string
          video_id?: string | null
          views?: number | null
          watch_time_hours?: number | null
        }
        Update: {
          channel_handle?: string | null
          channel_id?: string | null
          channel_name?: string | null
          comments?: number | null
          created_at?: string
          creator_roster_id?: string
          date_recorded?: string | null
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          likes?: number | null
          published_at?: string | null
          subscribers?: number | null
          title?: string | null
          updated_at?: string
          video_id?: string | null
          views?: number | null
          watch_time_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "youtube_analytics_creator_roster_id_fkey"
            columns: ["creator_roster_id"]
            isOneToOne: false
            referencedRelation: "creator_roster"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dashboard_analytics: {
        Row: {
          analytics_id: string | null
          brand_name: string | null
          campaign_date: string | null
          campaign_engagement_rate: number | null
          campaign_id: string | null
          campaign_month: string | null
          campaign_total_engagement: number | null
          campaign_total_views: number | null
          client_id: string | null
          client_name: string | null
          client_name_full: string | null
          comments: number | null
          content_engagement_rate: number | null
          content_url: string | null
          creator_id: string | null
          creator_name: string | null
          deal_value: number | null
          engagement: number | null
          fetched_at: string | null
          likes: number | null
          platform: string | null
          platform_handles: Json | null
          sentiment_label: string | null
          sentiment_score: number | null
          shares: number | null
          status: string | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_campaign_trends: {
        Args: {
          start_date?: string
          end_date?: string
          group_by_period?: string
        }
        Returns: {
          period: string
          total_views: number
          total_engagement: number
          campaign_count: number
          avg_engagement_rate: number
        }[]
      }
      get_dashboard_metrics: {
        Args:
          | {
              start_date?: string
              end_date?: string
              creator_ids?: string[]
              client_ids?: string[]
              campaign_ids?: string[]
              platforms?: string[]
            }
          | {
              start_date?: string
              end_date?: string
              creator_ids?: string[]
              client_ids?: string[]
              campaign_ids?: string[]
              platforms?: string[]
              master_campaigns?: string[]
            }
        Returns: {
          total_campaigns: number
          total_views: number
          total_engagement: number
          avg_engagement_rate: number
          total_deal_value: number
          platform_breakdown: Json
          creator_performance: Json
          monthly_trends: Json
        }[]
      }
      get_top_content: {
        Args: { limit_count?: number; order_by?: string }
        Returns: {
          campaign_id: string
          brand_name: string
          creator_name: string
          platform: string
          content_url: string
          views: number
          engagement: number
          engagement_rate: number
          campaign_date: string
        }[]
      }
      update_campaign_totals: {
        Args: { campaign_uuid: string }
        Returns: undefined
      }
      update_youtube_channel_analytics: {
        Args: {
          p_creator_roster_id: string
          p_channel_handle: string
          p_channel_id?: string
          p_channel_name?: string
          p_subscribers?: number
          p_total_views?: number
          p_video_count?: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
