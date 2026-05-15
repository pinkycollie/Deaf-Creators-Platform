/**
 * Database type definitions for Supabase
 * Auto-generated types should be replaced with actual Supabase CLI generated types
 */

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          domain: string | null
          settings: Record<string, unknown>
          subscription_tier: string
          subscription_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          domain?: string | null
          settings?: Record<string, unknown>
          subscription_tier?: string
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          domain?: string | null
          settings?: Record<string, unknown>
          subscription_tier?: string
          subscription_status?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          wallet_address: string | null
          role: string
          preferences: Record<string, unknown>
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          wallet_address?: string | null
          role?: string
          preferences?: Record<string, unknown>
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          email?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          wallet_address?: string | null
          role?: string
          preferences?: Record<string, unknown>
          is_verified?: boolean
          updated_at?: string
        }
      }
      content: {
        Row: {
          id: string
          tenant_id: string
          creator_id: string
          title: string
          description: string | null
          content_type: string
          file_url: string | null
          thumbnail_url: string | null
          duration: number | null
          file_size: number | null
          metadata: Record<string, unknown>
          status: string
          visibility: string
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          creator_id: string
          title: string
          description?: string | null
          content_type: string
          file_url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          file_size?: number | null
          metadata?: Record<string, unknown>
          status?: string
          visibility?: string
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          content_type?: string
          file_url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          file_size?: number | null
          metadata?: Record<string, unknown>
          status?: string
          visibility?: string
          tags?: string[] | null
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          stripe_subscription_id: string | null
          plan_id: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          stripe_subscription_id?: string | null
          plan_id: string
          status: string
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_subscription_id?: string | null
          plan_id?: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          updated_at?: string
        }
      }
      video_processing_jobs: {
        Row: {
          id: string
          tenant_id: string
          content_id: string | null
          creator_id: string
          input_url: string
          output_url: string | null
          job_type: string
          status: string
          priority: number
          progress: number
          settings: Record<string, unknown>
          ai_analysis: Record<string, unknown>
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          content_id?: string | null
          creator_id: string
          input_url: string
          output_url?: string | null
          job_type: string
          status?: string
          priority?: number
          progress?: number
          settings?: Record<string, unknown>
          ai_analysis?: Record<string, unknown>
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          content_id?: string | null
          input_url?: string
          output_url?: string | null
          job_type?: string
          status?: string
          priority?: number
          progress?: number
          settings?: Record<string, unknown>
          ai_analysis?: Record<string, unknown>
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      video_scenes: {
        Row: {
          id: string
          tenant_id: string
          content_id: string
          scene_number: number
          start_time: number
          end_time: number
          duration: number
          thumbnail_url: string | null
          tags: string[] | null
          description: string | null
          ai_confidence: number | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          content_id: string
          scene_number: number
          start_time: number
          end_time: number
          duration: number
          thumbnail_url?: string | null
          tags?: string[] | null
          description?: string | null
          ai_confidence?: number | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          scene_number?: number
          start_time?: number
          end_time?: number
          duration?: number
          thumbnail_url?: string | null
          tags?: string[] | null
          description?: string | null
          ai_confidence?: number | null
          metadata?: Record<string, unknown>
        }
      }
      video_contributors: {
        Row: {
          id: string
          tenant_id: string
          content_id: string
          user_id: string
          contribution_type: string
          contribution_percentage: number
          scenes: string[] | null
          description: string | null
          verified: boolean
          verified_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          content_id: string
          user_id: string
          contribution_type: string
          contribution_percentage: number
          scenes?: string[] | null
          description?: string | null
          verified?: boolean
          verified_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          contribution_type?: string
          contribution_percentage?: number
          scenes?: string[] | null
          description?: string | null
          verified?: boolean
          verified_by?: string | null
          updated_at?: string
        }
      }
      creator_profiles: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          display_name: string
          bio: string | null
          specializations: string[] | null
          portfolio_url: string | null
          payment_method: string | null
          payment_details: Record<string, unknown>
          stripe_account_id: string | null
          paypal_email: string | null
          crypto_wallet_address: string | null
          tax_info: Record<string, unknown>
          payout_threshold: number
          preferred_currency: string
          is_verified: boolean
          verification_date: string | null
          rating: number
          total_projects: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          display_name: string
          bio?: string | null
          specializations?: string[] | null
          portfolio_url?: string | null
          payment_method?: string | null
          payment_details?: Record<string, unknown>
          stripe_account_id?: string | null
          paypal_email?: string | null
          crypto_wallet_address?: string | null
          tax_info?: Record<string, unknown>
          payout_threshold?: number
          preferred_currency?: string
          is_verified?: boolean
          verification_date?: string | null
          rating?: number
          total_projects?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          bio?: string | null
          specializations?: string[] | null
          portfolio_url?: string | null
          payment_method?: string | null
          payment_details?: Record<string, unknown>
          stripe_account_id?: string | null
          paypal_email?: string | null
          crypto_wallet_address?: string | null
          tax_info?: Record<string, unknown>
          payout_threshold?: number
          preferred_currency?: string
          is_verified?: boolean
          verification_date?: string | null
          rating?: number
          total_projects?: number
          status?: string
          updated_at?: string
        }
      }
      creator_tasks: {
        Row: {
          id: string
          tenant_id: string
          assigned_by: string
          assigned_to: string
          content_id: string | null
          title: string
          description: string | null
          task_type: string
          requirements: Record<string, unknown>
          deadline: string | null
          budget: number | null
          currency: string
          status: string
          priority: number
          deliverables: Array<{ type: string; description: string }>
          submitted_at: string | null
          approved_at: string | null
          rejection_reason: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          assigned_by: string
          assigned_to: string
          content_id?: string | null
          title: string
          description?: string | null
          task_type: string
          requirements?: Record<string, unknown>
          deadline?: string | null
          budget?: number | null
          currency?: string
          status?: string
          priority?: number
          deliverables?: Array<{ type: string; description: string }>
          submitted_at?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          content_id?: string | null
          title?: string
          description?: string | null
          task_type?: string
          requirements?: Record<string, unknown>
          deadline?: string | null
          budget?: number | null
          currency?: string
          status?: string
          priority?: number
          deliverables?: Array<{ type: string; description: string }>
          submitted_at?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      creator_earnings: {
        Row: {
          id: string
          tenant_id: string
          creator_id: string
          content_id: string | null
          task_id: string | null
          earning_type: string
          description: string | null
          gross_amount: number
          platform_fee: number
          tax_amount: number
          net_amount: number
          currency: string
          source_details: Record<string, unknown>
          period_start: string | null
          period_end: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          creator_id: string
          content_id?: string | null
          task_id?: string | null
          earning_type: string
          description?: string | null
          gross_amount: number
          platform_fee?: number
          tax_amount?: number
          net_amount: number
          currency?: string
          source_details?: Record<string, unknown>
          period_start?: string | null
          period_end?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          content_id?: string | null
          task_id?: string | null
          earning_type?: string
          description?: string | null
          gross_amount?: number
          platform_fee?: number
          tax_amount?: number
          net_amount?: number
          currency?: string
          source_details?: Record<string, unknown>
          period_start?: string | null
          period_end?: string | null
          status?: string
          updated_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          tenant_id: string
          creator_id: string
          earnings_ids: string[]
          payment_method: string
          payment_provider: string
          provider_transaction_id: string | null
          gross_amount: number
          fee_amount: number
          net_amount: number
          currency: string
          exchange_rate: number
          status: string
          failure_reason: string | null
          receipt_url: string | null
          receipt_sent: boolean
          initiated_at: string
          processed_at: string | null
          completed_at: string | null
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          tenant_id: string
          creator_id: string
          earnings_ids: string[]
          payment_method: string
          payment_provider: string
          provider_transaction_id?: string | null
          gross_amount: number
          fee_amount?: number
          net_amount: number
          currency?: string
          exchange_rate?: number
          status?: string
          failure_reason?: string | null
          receipt_url?: string | null
          receipt_sent?: boolean
          initiated_at?: string
          processed_at?: string | null
          completed_at?: string | null
          metadata?: Record<string, unknown>
        }
        Update: {
          provider_transaction_id?: string | null
          gross_amount?: number
          fee_amount?: number
          net_amount?: number
          currency?: string
          exchange_rate?: number
          status?: string
          failure_reason?: string | null
          receipt_url?: string | null
          receipt_sent?: boolean
          processed_at?: string | null
          completed_at?: string | null
          metadata?: Record<string, unknown>
        }
      }
      content_requests: {
        Row: {
          id: string
          tenant_id: string
          requester_id: string
          matched_content_id: string | null
          assigned_creator_id: string | null
          title: string
          description: string | null
          requirements: Record<string, unknown>
          tags: string[] | null
          preferred_format: string | null
          max_duration: number | null
          budget_min: number | null
          budget_max: number | null
          deadline: string | null
          status: string
          match_score: number | null
          pricing_estimate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          requester_id: string
          matched_content_id?: string | null
          assigned_creator_id?: string | null
          title: string
          description?: string | null
          requirements?: Record<string, unknown>
          tags?: string[] | null
          preferred_format?: string | null
          max_duration?: number | null
          budget_min?: number | null
          budget_max?: number | null
          deadline?: string | null
          status?: string
          match_score?: number | null
          pricing_estimate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          matched_content_id?: string | null
          assigned_creator_id?: string | null
          title?: string
          description?: string | null
          requirements?: Record<string, unknown>
          tags?: string[] | null
          preferred_format?: string | null
          max_duration?: number | null
          budget_min?: number | null
          budget_max?: number | null
          deadline?: string | null
          status?: string
          match_score?: number | null
          pricing_estimate?: number | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience type exports
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"]
export type User = Database["public"]["Tables"]["users"]["Row"]
export type Content = Database["public"]["Tables"]["content"]["Row"]
export type VideoProcessingJob = Database["public"]["Tables"]["video_processing_jobs"]["Row"]
export type VideoScene = Database["public"]["Tables"]["video_scenes"]["Row"]
export type VideoContributor = Database["public"]["Tables"]["video_contributors"]["Row"]
export type CreatorProfile = Database["public"]["Tables"]["creator_profiles"]["Row"]
export type CreatorTask = Database["public"]["Tables"]["creator_tasks"]["Row"]
export type CreatorEarning = Database["public"]["Tables"]["creator_earnings"]["Row"]
export type PaymentTransaction = Database["public"]["Tables"]["payment_transactions"]["Row"]
export type ContentRequest = Database["public"]["Tables"]["content_requests"]["Row"]
