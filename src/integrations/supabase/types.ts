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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_domain_status_history: {
        Row: {
          cert_issuer: string | null
          cert_not_after: string | null
          cert_not_before: string | null
          checked_at: string
          detail: string | null
          dns_ok: boolean
          host: string
          hsts_include_subdomains: boolean
          hsts_max_age: number | null
          hsts_present: boolean
          http_status: number | null
          id: string
          overall: string
          ssl_ok: boolean
        }
        Insert: {
          cert_issuer?: string | null
          cert_not_after?: string | null
          cert_not_before?: string | null
          checked_at?: string
          detail?: string | null
          dns_ok: boolean
          host: string
          hsts_include_subdomains?: boolean
          hsts_max_age?: number | null
          hsts_present?: boolean
          http_status?: number | null
          id?: string
          overall: string
          ssl_ok: boolean
        }
        Update: {
          cert_issuer?: string | null
          cert_not_after?: string | null
          cert_not_before?: string | null
          checked_at?: string
          detail?: string | null
          dns_ok?: boolean
          host?: string
          hsts_include_subdomains?: boolean
          hsts_max_age?: number | null
          hsts_present?: boolean
          http_status?: number | null
          id?: string
          overall?: string
          ssl_ok?: boolean
        }
        Relationships: []
      }
      admin_integration_secrets: {
        Row: {
          created_at: string
          key: string
          last_verified_at: string | null
          last_verified_detail: string | null
          last_verified_ok: boolean | null
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          last_verified_at?: string | null
          last_verified_detail?: string | null
          last_verified_ok?: boolean | null
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          last_verified_at?: string | null
          last_verified_detail?: string | null
          last_verified_ok?: boolean | null
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      ai_agent_configs: {
        Row: {
          collection_ids: string[]
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          max_chunks: number
          model: string
          name: string
          slug: string
          system_prompt: string
          temperature: number
          updated_at: string
          visibility: string
        }
        Insert: {
          collection_ids?: string[]
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          max_chunks?: number
          model?: string
          name: string
          slug: string
          system_prompt: string
          temperature?: number
          updated_at?: string
          visibility?: string
        }
        Update: {
          collection_ids?: string[]
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          max_chunks?: number
          model?: string
          name?: string
          slug?: string
          system_prompt?: string
          temperature?: number
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      ai_chunks: {
        Row: {
          chunk_order: number
          chunk_text: string
          collection_id: string | null
          created_at: string
          document_id: string | null
          embedded_at: string | null
          embedding: string | null
          embedding_status: string
          id: string
          metadata: Json
          source_id: string | null
          token_count: number | null
          updated_at: string
        }
        Insert: {
          chunk_order?: number
          chunk_text: string
          collection_id?: string | null
          created_at?: string
          document_id?: string | null
          embedded_at?: string | null
          embedding?: string | null
          embedding_status?: string
          id?: string
          metadata?: Json
          source_id?: string | null
          token_count?: number | null
          updated_at?: string
        }
        Update: {
          chunk_order?: number
          chunk_text?: string
          collection_id?: string | null
          created_at?: string
          document_id?: string | null
          embedded_at?: string | null
          embedding?: string | null
          embedding_status?: string
          id?: string
          metadata?: Json
          source_id?: string | null
          token_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chunks_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "ai_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ai_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_conversation_logs: {
        Row: {
          agent_id: string | null
          completion_tokens: number | null
          created_at: string
          error: string | null
          id: string
          latency_ms: number | null
          model: string | null
          prompt: string
          prompt_tokens: number | null
          response: string | null
          retrieved_chunk_ids: string[]
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          completion_tokens?: number | null
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          prompt: string
          prompt_tokens?: number | null
          response?: string | null
          retrieved_chunk_ids?: string[]
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          completion_tokens?: number | null
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          prompt?: string
          prompt_tokens?: number | null
          response?: string | null
          retrieved_chunk_ids?: string[]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          context_id: string | null
          context_type: Database["public"]["Enums"]["ai_context_type"]
          created_at: string
          id: string
          secondary_contexts: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_id?: string | null
          context_type?: Database["public"]["Enums"]["ai_context_type"]
          created_at?: string
          id?: string
          secondary_contexts?: Json
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context_id?: string | null
          context_type?: Database["public"]["Enums"]["ai_context_type"]
          created_at?: string
          id?: string
          secondary_contexts?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_documents: {
        Row: {
          chunk_status: string
          collection_id: string | null
          content: string | null
          created_at: string
          embedding_status: string
          entity_id: string | null
          entity_type: string | null
          id: string
          language: string | null
          metadata: Json
          source_id: string | null
          tags: string[]
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          chunk_status?: string
          collection_id?: string | null
          content?: string | null
          created_at?: string
          embedding_status?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          language?: string | null
          metadata?: Json
          source_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          chunk_status?: string
          collection_id?: string | null
          content?: string | null
          created_at?: string
          embedding_status?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          language?: string | null
          metadata?: Json
          source_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_documents_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "ai_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_documents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_embeddings_queue: {
        Row: {
          attempts: number
          created_at: string
          document_id: string | null
          id: string
          last_error: string | null
          processed_at: string | null
          scheduled_for: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          document_id?: string | null
          id?: string
          last_error?: string | null
          processed_at?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          document_id?: string | null
          id?: string
          last_error?: string | null
          processed_at?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_embeddings_queue_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ai_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedback: {
        Row: {
          conversation_log_id: string
          created_at: string
          id: string
          note: string | null
          rating: number
          user_id: string | null
        }
        Insert: {
          conversation_log_id: string
          created_at?: string
          id?: string
          note?: string | null
          rating: number
          user_id?: string | null
        }
        Update: {
          conversation_log_id?: string
          created_at?: string
          id?: string
          note?: string | null
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_conversation_log_id_fkey"
            columns: ["conversation_log_id"]
            isOneToOne: false
            referencedRelation: "ai_conversation_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          role: Database["public"]["Enums"]["ai_message_role"]
          token_count: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          role: Database["public"]["Enums"]["ai_message_role"]
          token_count?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: Database["public"]["Enums"]["ai_message_role"]
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          attempt: number
          consumer: string
          cost_usd: number | null
          created_at: string
          error_code: string | null
          id: string
          latency_ms: number | null
          logical_id: string
          model: string
          outcome: string
          provider: string
          request_id: string
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          attempt: number
          consumer: string
          cost_usd?: number | null
          created_at?: string
          error_code?: string | null
          id?: string
          latency_ms?: number | null
          logical_id: string
          model: string
          outcome: string
          provider: string
          request_id: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          attempt?: number
          consumer?: string
          cost_usd?: number | null
          created_at?: string
          error_code?: string | null
          id?: string
          latency_ms?: number | null
          logical_id?: string
          model?: string
          outcome?: string
          provider?: string
          request_id?: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: []
      }
      api_key_scopes: {
        Row: {
          api_key_id: string
          granted_at: string
          scope_id: string
        }
        Insert: {
          api_key_id: string
          granted_at?: string
          scope_id: string
        }
        Update: {
          api_key_id?: string
          granted_at?: string
          scope_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_scopes_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_scopes_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "api_scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      api_key_usage: {
        Row: {
          api_key_id: string | null
          bytes_out: number | null
          created_at: string
          endpoint: string
          error: string | null
          id: number
          ip: unknown
          latency_ms: number | null
          method: string
          request_id: string | null
          status_code: number
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          bytes_out?: number | null
          created_at?: string
          endpoint: string
          error?: string | null
          id?: number
          ip?: unknown
          latency_ms?: number | null
          method: string
          request_id?: string | null
          status_code: number
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          bytes_out?: number | null
          created_at?: string
          endpoint?: string
          error?: string | null
          id?: number
          ip?: unknown
          latency_ms?: number | null
          method?: string
          request_id?: string | null
          status_code?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_key_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          owner_user_id: string | null
          partner_name: string | null
          rate_limit_per_minute: number
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          owner_user_id?: string | null
          partner_name?: string | null
          rate_limit_per_minute?: number
          status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          owner_user_id?: string | null
          partner_name?: string | null
          rate_limit_per_minute?: number
          status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          api_key_id: string
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          api_key_id: string
          request_count?: number
          updated_at?: string
          window_start: string
        }
        Update: {
          api_key_id?: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_scopes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          scope: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          scope: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          scope?: string
        }
        Relationships: []
      }
      api_webhook_deliveries: {
        Row: {
          attempt: number
          created_at: string
          delivered_at: string | null
          error: string | null
          event_type: string
          id: number
          leased_until: string | null
          max_attempts: number
          next_attempt_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          status: string
          subscription_id: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          event_type: string
          id?: number
          leased_until?: string | null
          max_attempts?: number
          next_attempt_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
          subscription_id: string
        }
        Update: {
          attempt?: number
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          event_type?: string
          id?: number
          leased_until?: string | null
          max_attempts?: number
          next_attempt_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_webhook_deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "api_webhook_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      api_webhook_subscriptions: {
        Row: {
          api_key_id: string
          created_at: string
          event_types: string[]
          id: string
          last_failure_at: string | null
          last_success_at: string | null
          signing_secret: string
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          event_types?: string[]
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          signing_secret: string
          status?: string
          updated_at?: string
          url: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          event_types?: string[]
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          signing_secret?: string
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_webhook_subscriptions_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          doc_type: string
          file_name: string | null
          file_url: string
          id: string
          reviewer_notes: string | null
          status: string
          student_id: string
          updated_at: string
          version: number
        }
        Insert: {
          application_id: string
          created_at?: string
          doc_type: string
          file_name?: string | null
          file_url: string
          id?: string
          reviewer_notes?: string | null
          status?: string
          student_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          application_id?: string
          created_at?: string
          doc_type?: string
          file_name?: string | null
          file_url?: string
          id?: string
          reviewer_notes?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          from_status:
            | Database["public"]["Enums"]["application_workflow_status"]
            | null
          id: string
          metadata: Json
          reason: string | null
          to_status: Database["public"]["Enums"]["application_workflow_status"]
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["application_workflow_status"]
            | null
          id?: string
          metadata?: Json
          reason?: string | null
          to_status: Database["public"]["Enums"]["application_workflow_status"]
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["application_workflow_status"]
            | null
          id?: string
          metadata?: Json
          reason?: string | null
          to_status?: Database["public"]["Enums"]["application_workflow_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          assigned_to_counselor: string | null
          created_at: string
          crm_status: Database["public"]["Enums"]["crm_status"]
          crm_substatus: string | null
          id: string
          intake: string | null
          notes: string | null
          offer_letter_url: string | null
          offer_received_at: string | null
          program_id: string | null
          status: string
          student_id: string
          submitted_at: string | null
          university_id: string | null
          updated_at: string
          workflow_status: Database["public"]["Enums"]["application_workflow_status"]
        }
        Insert: {
          assigned_to_counselor?: string | null
          created_at?: string
          crm_status?: Database["public"]["Enums"]["crm_status"]
          crm_substatus?: string | null
          id?: string
          intake?: string | null
          notes?: string | null
          offer_letter_url?: string | null
          offer_received_at?: string | null
          program_id?: string | null
          status?: string
          student_id: string
          submitted_at?: string | null
          university_id?: string | null
          updated_at?: string
          workflow_status?: Database["public"]["Enums"]["application_workflow_status"]
        }
        Update: {
          assigned_to_counselor?: string | null
          created_at?: string
          crm_status?: Database["public"]["Enums"]["crm_status"]
          crm_substatus?: string | null
          id?: string
          intake?: string | null
          notes?: string | null
          offer_letter_url?: string | null
          offer_received_at?: string | null
          program_id?: string | null
          status?: string
          student_id?: string
          submitted_at?: string | null
          university_id?: string | null
          updated_at?: string
          workflow_status?: Database["public"]["Enums"]["application_workflow_status"]
        }
        Relationships: [
          {
            foreignKeyName: "applications_assigned_to_counselor_fkey"
            columns: ["assigned_to_counselor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "university_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allowed_types: Database["public"]["Enums"]["submission_type"][]
          course_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          is_required: boolean
          max_score: number
          title: string
          updated_at: string
        }
        Insert: {
          allowed_types?: Database["public"]["Enums"]["submission_type"][]
          course_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_required?: boolean
          max_score?: number
          title: string
          updated_at?: string
        }
        Update: {
          allowed_types?: Database["public"]["Enums"]["submission_type"][]
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_required?: boolean
          max_score?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          program_id: string
          template_html: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          program_id: string
          template_html?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          program_id?: string
          template_html?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string | null
          certificate_url: string | null
          created_at: string
          id: string
          issued_at: string
          issued_by: string | null
          issued_pdf_path: string | null
          program_id: string
          qr_code_url: string | null
          revoked: boolean
          revoked_at: string | null
          revoked_reason: string | null
          student_id: string
          updated_at: string
          verification_hash: string | null
          verification_token: string
        }
        Insert: {
          certificate_number?: string | null
          certificate_url?: string | null
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          issued_pdf_path?: string | null
          program_id: string
          qr_code_url?: string | null
          revoked?: boolean
          revoked_at?: string | null
          revoked_reason?: string | null
          student_id: string
          updated_at?: string
          verification_hash?: string | null
          verification_token?: string
        }
        Update: {
          certificate_number?: string | null
          certificate_url?: string | null
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          issued_pdf_path?: string | null
          program_id?: string
          qr_code_url?: string | null
          revoked?: boolean
          revoked_at?: string | null
          revoked_reason?: string | null
          student_id?: string
          updated_at?: string
          verification_hash?: string | null
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ci_audit_log: {
        Row: {
          actor: string | null
          autonomous_mode: string | null
          branch: string
          created_at: string
          decision: string
          decision_reason: string | null
          decision_source: string | null
          diagnosis: string | null
          execute_reason: string | null
          executed: boolean
          id: string
          platform_state: string | null
          raw: Json
          risk_level: string | null
          run_url: string | null
          sha: string
          system_health_score: number | null
          system_mode: string | null
          ts: string
        }
        Insert: {
          actor?: string | null
          autonomous_mode?: string | null
          branch: string
          created_at?: string
          decision: string
          decision_reason?: string | null
          decision_source?: string | null
          diagnosis?: string | null
          execute_reason?: string | null
          executed?: boolean
          id?: string
          platform_state?: string | null
          raw?: Json
          risk_level?: string | null
          run_url?: string | null
          sha: string
          system_health_score?: number | null
          system_mode?: string | null
          ts: string
        }
        Update: {
          actor?: string | null
          autonomous_mode?: string | null
          branch?: string
          created_at?: string
          decision?: string
          decision_reason?: string | null
          decision_source?: string | null
          diagnosis?: string | null
          execute_reason?: string | null
          executed?: boolean
          id?: string
          platform_state?: string | null
          raw?: Json
          risk_level?: string | null
          run_url?: string | null
          sha?: string
          system_health_score?: number | null
          system_mode?: string | null
          ts?: string
        }
        Relationships: []
      }
      ci_ingest_failures: {
        Row: {
          correlation_id: string | null
          created_at: string
          environment: string | null
          failure_reason: string | null
          id: string
          ingest_url: string | null
          job_name: string | null
          payload_hash: string | null
          raw: Json | null
          request_id: string | null
          response_body: string | null
          retry_count: number
          status_code: number | null
          workflow_name: string | null
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          environment?: string | null
          failure_reason?: string | null
          id?: string
          ingest_url?: string | null
          job_name?: string | null
          payload_hash?: string | null
          raw?: Json | null
          request_id?: string | null
          response_body?: string | null
          retry_count?: number
          status_code?: number | null
          workflow_name?: string | null
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          environment?: string | null
          failure_reason?: string | null
          id?: string
          ingest_url?: string | null
          job_name?: string | null
          payload_hash?: string | null
          raw?: Json | null
          request_id?: string | null
          response_body?: string | null
          retry_count?: number
          status_code?: number | null
          workflow_name?: string | null
        }
        Relationships: []
      }
      cluster_release_correlations: {
        Row: {
          cluster_id: string
          created_at: string
          event_count_delta: number
          first_seen_after_release: boolean
          id: string
          reason: string | null
          regression_score: number
          release_id: string
          status: string
          time_delta_seconds: number
          updated_at: string
        }
        Insert: {
          cluster_id: string
          created_at?: string
          event_count_delta?: number
          first_seen_after_release?: boolean
          id?: string
          reason?: string | null
          regression_score?: number
          release_id: string
          status?: string
          time_delta_seconds?: number
          updated_at?: string
        }
        Update: {
          cluster_id?: string
          created_at?: string
          event_count_delta?: number
          first_seen_after_release?: boolean
          id?: string
          reason?: string | null
          regression_score?: number
          release_id?: string
          status?: string
          time_delta_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cluster_release_correlations_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "incident_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cluster_release_correlations_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon_url: string | null
          id: string
          member_count: number
          membership_type: Database["public"]["Enums"]["community_membership_type"]
          name: string
          slug: string
          thread_count: number
          updated_at: string
          visibility: Database["public"]["Enums"]["community_visibility"]
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          member_count?: number
          membership_type?: Database["public"]["Enums"]["community_membership_type"]
          name: string
          slug: string
          thread_count?: number
          updated_at?: string
          visibility?: Database["public"]["Enums"]["community_visibility"]
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          member_count?: number
          membership_type?: Database["public"]["Enums"]["community_membership_type"]
          name?: string
          slug?: string
          thread_count?: number
          updated_at?: string
          visibility?: Database["public"]["Enums"]["community_visibility"]
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          notify_events: boolean
          notify_reactions: boolean
          notify_replies: boolean
          role: Database["public"]["Enums"]["community_member_role"]
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          notify_events?: boolean
          notify_reactions?: boolean
          notify_replies?: boolean
          role?: Database["public"]["Enums"]["community_member_role"]
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          notify_events?: boolean
          notify_reactions?: boolean
          notify_replies?: boolean
          role?: Database["public"]["Enums"]["community_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      counselor_assignments: {
        Row: {
          active: boolean
          assigned_at: string
          assigned_by: string | null
          counselor_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          unassigned_at: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          assigned_at?: string
          assigned_by?: string | null
          counselor_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          unassigned_at?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          assigned_at?: string
          assigned_by?: string | null
          counselor_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          unassigned_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counselor_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counselor_assignments_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          avg_tuition_usd: number | null
          cost_of_living: string | null
          created_at: string
          currency: string | null
          description: string | null
          display_order: number
          flag_emoji: string | null
          hero_image_url: string | null
          highlights: string[] | null
          id: string
          iso_code: string | null
          name: string
          popular_intakes: string[] | null
          primary_language: string | null
          published: boolean
          slug: string
          summary: string | null
          updated_at: string
          visa_info: string | null
        }
        Insert: {
          avg_tuition_usd?: number | null
          cost_of_living?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          display_order?: number
          flag_emoji?: string | null
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          iso_code?: string | null
          name: string
          popular_intakes?: string[] | null
          primary_language?: string | null
          published?: boolean
          slug: string
          summary?: string | null
          updated_at?: string
          visa_info?: string | null
        }
        Update: {
          avg_tuition_usd?: number | null
          cost_of_living?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          display_order?: number
          flag_emoji?: string | null
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          iso_code?: string | null
          name?: string
          popular_intakes?: string[] | null
          primary_language?: string | null
          published?: boolean
          slug?: string
          summary?: string | null
          updated_at?: string
          visa_info?: string | null
        }
        Relationships: []
      }
      course_faculty: {
        Row: {
          course_id: string
          created_at: string
          faculty_id: string
          id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          faculty_id: string
          id?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          faculty_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_faculty_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_no: number
          program_id: string
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_no?: number
          program_id: string
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_no?: number
          program_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activity_log: {
        Row: {
          actor_id: string | null
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          metadata: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "crm_activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_follow_ups: {
        Row: {
          channel: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_follow_ups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          author_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          note: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          note: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          entity_id: string
          entity_type: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          entity_id: string
          entity_type: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_events: {
        Row: {
          actor_id: string | null
          aggregate_id: string | null
          aggregate_type: string | null
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          status: Database["public"]["Enums"]["domain_event_status"]
          updated_at: string
        }
        Insert: {
          actor_id?: string | null
          aggregate_id?: string | null
          aggregate_type?: string | null
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          status?: Database["public"]["Enums"]["domain_event_status"]
          updated_at?: string
        }
        Update: {
          actor_id?: string | null
          aggregate_id?: string | null
          aggregate_type?: string | null
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          status?: Database["public"]["Enums"]["domain_event_status"]
          updated_at?: string
        }
        Relationships: []
      }
      employers: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          hq_location: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          size: string | null
          slug: string
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          hq_location?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          size?: string | null
          slug: string
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          hq_location?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          size?: string | null
          slug?: string
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          created_at: string
          enrolled_at: string
          id: string
          program_id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enrolled_at?: string
          id?: string
          program_id: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enrolled_at?: string
          id?: string
          program_id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      env_readiness_activity: {
        Row: {
          created_at: string
          detail: Json
          event_type: string
          id: string
          next_overall: string | null
          previous_overall: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: Json
          event_type: string
          id?: string
          next_overall?: string | null
          previous_overall?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: Json
          event_type?: string
          id?: string
          next_overall?: string | null
          previous_overall?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      env_readiness_snapshots: {
        Row: {
          blocking_missing_count: number
          created_at: string
          environment: string
          groups: Json
          id: string
          malformed_count: number
          missing_count: number
          overall: string
          present_count: number
          source: string
          totals: Json
        }
        Insert: {
          blocking_missing_count?: number
          created_at?: string
          environment: string
          groups: Json
          id?: string
          malformed_count?: number
          missing_count?: number
          overall: string
          present_count?: number
          source?: string
          totals: Json
        }
        Update: {
          blocking_missing_count?: number
          created_at?: string
          environment?: string
          groups?: Json
          id?: string
          malformed_count?: number
          missing_count?: number
          overall?: string
          present_count?: number
          source?: string
          totals?: Json
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          status: Database["public"]["Enums"]["event_rsvp_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          status?: Database["public"]["Enums"]["event_rsvp_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          status?: Database["public"]["Enums"]["event_rsvp_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          community_id: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          location: string | null
          rsvp_count: number
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          virtual_url: string | null
        }
        Insert: {
          capacity?: number | null
          community_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          location?: string | null
          rsvp_count?: number
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          virtual_url?: string | null
        }
        Update: {
          capacity?: number | null
          community_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          location?: string | null
          rsvp_count?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          virtual_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_audit_events: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          confidence: number
          created_at: string
          decision: string
          explanation: Json
          id: string
          metadata: Json
          requires_human_approval: boolean
          risk_score: number
          source: string
          tenant_id: string | null
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number
          created_at?: string
          decision: string
          explanation?: Json
          id?: string
          metadata?: Json
          requires_human_approval?: boolean
          risk_score?: number
          source: string
          tenant_id?: string | null
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number
          created_at?: string
          decision?: string
          explanation?: Json
          id?: string
          metadata?: Json
          requires_human_approval?: boolean
          risk_score?: number
          source?: string
          tenant_id?: string | null
        }
        Relationships: []
      }
      identity_providers: {
        Row: {
          created_at: string
          display_name: string
          enabled: boolean
          id: string
          metadata: Json
          metadata_url: string | null
          protocol: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          enabled?: boolean
          id?: string
          metadata?: Json
          metadata_url?: string | null
          protocol?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          enabled?: boolean
          id?: string
          metadata?: Json
          metadata_url?: string | null
          protocol?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      incident_clusters: {
        Row: {
          created_at: string
          event_count: number
          first_seen: string
          id: string
          issue_count: number
          last_analysis_hash: string | null
          last_analyzed_at: string | null
          last_seen: string
          representative_issue_id: string | null
          severity_score: number
          signature: string
          status: string
          title: string
          top_category: string | null
          updated_at: string
          user_count: number
        }
        Insert: {
          created_at?: string
          event_count?: number
          first_seen?: string
          id?: string
          issue_count?: number
          last_analysis_hash?: string | null
          last_analyzed_at?: string | null
          last_seen?: string
          representative_issue_id?: string | null
          severity_score?: number
          signature: string
          status?: string
          title: string
          top_category?: string | null
          updated_at?: string
          user_count?: number
        }
        Update: {
          created_at?: string
          event_count?: number
          first_seen?: string
          id?: string
          issue_count?: number
          last_analysis_hash?: string | null
          last_analyzed_at?: string | null
          last_seen?: string
          representative_issue_id?: string | null
          severity_score?: number
          signature?: string
          status?: string
          title?: string
          top_category?: string | null
          updated_at?: string
          user_count?: number
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applied_at: string
          cover_letter: string | null
          crm_status: Database["public"]["Enums"]["crm_status"]
          crm_substatus: string | null
          id: string
          job_id: string
          notes: string | null
          portfolio_url: string | null
          resume_snapshot: Json | null
          status: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          cover_letter?: string | null
          crm_status?: Database["public"]["Enums"]["crm_status"]
          crm_substatus?: string | null
          id?: string
          job_id: string
          notes?: string | null
          portfolio_url?: string | null
          resume_snapshot?: Json | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          cover_letter?: string | null
          crm_status?: Database["public"]["Enums"]["crm_status"]
          crm_substatus?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          portfolio_url?: string | null
          resume_snapshot?: Json | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          apply_url: string | null
          closes_at: string | null
          created_at: string
          created_by: string | null
          description: string
          employer_id: string
          employment_type: Database["public"]["Enums"]["job_employment_type"]
          experience_level: Database["public"]["Enums"]["job_experience_level"]
          id: string
          location: string | null
          posted_at: string | null
          remote_type: Database["public"]["Enums"]["job_remote_type"]
          requirements: string | null
          responsibilities: string | null
          salary_currency: string
          salary_max: number | null
          salary_min: number | null
          skills: string[]
          slug: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          apply_url?: string | null
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          employer_id: string
          employment_type?: Database["public"]["Enums"]["job_employment_type"]
          experience_level?: Database["public"]["Enums"]["job_experience_level"]
          id?: string
          location?: string | null
          posted_at?: string | null
          remote_type?: Database["public"]["Enums"]["job_remote_type"]
          requirements?: string | null
          responsibilities?: string | null
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[]
          slug: string
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          apply_url?: string | null
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          employer_id?: string
          employment_type?: Database["public"]["Enums"]["job_employment_type"]
          experience_level?: Database["public"]["Enums"]["job_experience_level"]
          id?: string
          location?: string | null
          posted_at?: string | null
          remote_type?: Database["public"]["Enums"]["job_remote_type"]
          requirements?: string | null
          responsibilities?: string | null
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[]
          slug?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_ingestion_events: {
        Row: {
          created_at: string
          id: string
          issues: Json
          outcome: string
          package_id: string | null
          reason: string | null
          source_label: string
          trust_level: string
        }
        Insert: {
          created_at?: string
          id?: string
          issues?: Json
          outcome: string
          package_id?: string | null
          reason?: string | null
          source_label: string
          trust_level: string
        }
        Update: {
          created_at?: string
          id?: string
          issues?: Json
          outcome?: string
          package_id?: string | null
          reason?: string | null
          source_label?: string
          trust_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_ingestion_events_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "knowledge_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_packages: {
        Row: {
          categories: Json
          created_at: string
          expires_at: string
          generated_at: string
          hash: string
          id: string
          payload: Json
          recommendations: Json
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          schema_version: string
          signature_valid: boolean
          source_label: string
          status: string
          trust_level: string
          updated_at: string
        }
        Insert: {
          categories?: Json
          created_at?: string
          expires_at: string
          generated_at: string
          hash: string
          id?: string
          payload: Json
          recommendations?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          schema_version: string
          signature_valid?: boolean
          source_label: string
          status?: string
          trust_level: string
          updated_at?: string
        }
        Update: {
          categories?: Json
          created_at?: string
          expires_at?: string
          generated_at?: string
          hash?: string
          id?: string
          payload?: Json
          recommendations?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          schema_version?: string
          signature_valid?: boolean
          source_label?: string
          status?: string
          trust_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_signature_failures: {
        Row: {
          created_at: string
          expires_at: string | null
          generated_at: string | null
          id: string
          issues: Json
          key_id: string | null
          metadata: Json
          package_hash: string | null
          reason: string
          schema_version: string | null
          source_label: string
          tenant_id: string | null
          trust_level: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          issues?: Json
          key_id?: string | null
          metadata?: Json
          package_hash?: string | null
          reason: string
          schema_version?: string | null
          source_label: string
          tenant_id?: string | null
          trust_level?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          issues?: Json
          key_id?: string | null
          metadata?: Json
          package_hash?: string | null
          reason?: string
          schema_version?: string | null
          source_label?: string
          tenant_id?: string | null
          trust_level?: string | null
        }
        Relationships: []
      }
      knowledge_sources: {
        Row: {
          active: boolean
          collection_id: string | null
          config: Json
          created_at: string
          description: string | null
          id: string
          name: string
          source_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          collection_id?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          source_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          collection_id?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          source_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "ai_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_readiness_runs: {
        Row: {
          artifact_urls: Json
          audit_breakdown: Json
          audit_errors: number
          audit_warnings: number
          branch: string
          commit_sha: string
          created_at: string
          environment: string
          id: string
          overall_status: string
          playwright_duration_ms: number
          playwright_failed: number
          playwright_passed: number
          playwright_skipped: number
          schema_validation_details: Json
          schema_validation_status: string
          security_failed: number
          security_passed: number
          workflow_run_id: string | null
        }
        Insert: {
          artifact_urls?: Json
          audit_breakdown?: Json
          audit_errors?: number
          audit_warnings?: number
          branch: string
          commit_sha: string
          created_at?: string
          environment: string
          id?: string
          overall_status?: string
          playwright_duration_ms?: number
          playwright_failed?: number
          playwright_passed?: number
          playwright_skipped?: number
          schema_validation_details?: Json
          schema_validation_status?: string
          security_failed?: number
          security_passed?: number
          workflow_run_id?: string | null
        }
        Update: {
          artifact_urls?: Json
          audit_breakdown?: Json
          audit_errors?: number
          audit_warnings?: number
          branch?: string
          commit_sha?: string
          created_at?: string
          environment?: string
          id?: string
          overall_status?: string
          playwright_duration_ms?: number
          playwright_failed?: number
          playwright_passed?: number
          playwright_skipped?: number
          schema_validation_details?: Json
          schema_validation_status?: string
          security_failed?: number
          security_passed?: number
          workflow_run_id?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content_md: string | null
          course_id: string
          created_at: string
          duration_min: number | null
          id: string
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          order_no: number
          preview: boolean
          resources: Json
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content_md?: string | null
          course_id: string
          created_at?: string
          duration_min?: number | null
          id?: string
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          order_no?: number
          preview?: boolean
          resources?: Json
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content_md?: string | null
          course_id?: string
          created_at?: string
          duration_min?: number | null
          id?: string
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          order_no?: number
          preview?: boolean
          resources?: Json
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_logs: {
        Row: {
          attempts: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          delivered_at: string | null
          error: string | null
          id: string
          notification_id: string | null
          provider: string | null
          provider_message_id: string | null
          status: Database["public"]["Enums"]["notification_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          id?: string
          notification_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          id?: string
          notification_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          category: string
          created_at: string
          email: boolean
          id: string
          in_app: boolean
          push: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          push?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          push?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          action_url: string | null
          body_template: string
          category: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          enabled: boolean
          id: string
          key: string
          locale: string
          metadata: Json
          subject: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          action_url?: string | null
          body_template: string
          category?: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          locale?: string
          metadata?: Json
          subject?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          action_url?: string | null
          body_template?: string
          category?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          locale?: string
          metadata?: Json
          subject?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          archived_at: string | null
          body: string
          category: string
          created_at: string
          data: Json
          event_id: string | null
          event_type: string
          id: string
          priority: Database["public"]["Enums"]["notification_priority"]
          read_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          archived_at?: string | null
          body: string
          category?: string
          created_at?: string
          data?: Json
          event_id?: string | null
          event_type: string
          id?: string
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          archived_at?: string | null
          body?: string
          category?: string
          created_at?: string
          data?: Json
          event_id?: string | null
          event_type?: string
          id?: string
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "domain_events"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_checklist_items: {
        Row: {
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          evidence_url: string | null
          id: string
          is_required: boolean
          item_key: string
          notes: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          evidence_url?: string | null
          id?: string
          is_required?: boolean
          item_key: string
          notes?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          evidence_url?: string | null
          id?: string
          is_required?: boolean
          item_key?: string
          notes?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          error: Json | null
          id: string
          method: string | null
          notes: Json
          payer_notes: string | null
          proof_url: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_order_id: string | null
          provider_payment_id: string | null
          purpose: Database["public"]["Enums"]["payment_purpose"]
          receipt: string | null
          ref_id: string | null
          ref_table: string | null
          reference: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          error?: Json | null
          id?: string
          method?: string | null
          notes?: Json
          payer_notes?: string | null
          proof_url?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_order_id?: string | null
          provider_payment_id?: string | null
          purpose?: Database["public"]["Enums"]["payment_purpose"]
          receipt?: string | null
          ref_id?: string | null
          ref_table?: string | null
          reference?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          error?: Json | null
          id?: string
          method?: string | null
          notes?: Json
          payer_notes?: string | null
          proof_url?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_order_id?: string | null
          provider_payment_id?: string | null
          purpose?: Database["public"]["Enums"]["payment_purpose"]
          receipt?: string | null
          ref_id?: string | null
          ref_table?: string | null
          reference?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      placements: {
        Row: {
          created_at: string
          created_by: string | null
          crm_status: Database["public"]["Enums"]["crm_status"]
          crm_substatus: string | null
          employer_id: string | null
          employment_type: string
          id: string
          job_posting_id: string | null
          job_title: string
          joining_date: string | null
          notes: string | null
          offer_date: string | null
          program_id: string | null
          salary_currency: string
          salary_package: number | null
          status: string
          student_id: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crm_status?: Database["public"]["Enums"]["crm_status"]
          crm_substatus?: string | null
          employer_id?: string | null
          employment_type?: string
          id?: string
          job_posting_id?: string | null
          job_title: string
          joining_date?: string | null
          notes?: string | null
          offer_date?: string | null
          program_id?: string | null
          salary_currency?: string
          salary_package?: number | null
          status?: string
          student_id: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crm_status?: Database["public"]["Enums"]["crm_status"]
          crm_substatus?: string | null
          employer_id?: string | null
          employment_type?: string
          id?: string
          job_posting_id?: string | null
          job_title?: string
          joining_date?: string | null
          notes?: string | null
          offer_date?: string | null
          program_id?: string | null
          salary_currency?: string
          salary_package?: number | null
          status?: string
          student_id?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "placements_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          career_goals: string | null
          created_at: string
          education: Json
          email: string | null
          experience: Json
          featured_success_story: boolean
          full_name: string | null
          github_url: string | null
          headline: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          phone: string | null
          portfolio_slug: string | null
          portfolio_visibility: Database["public"]["Enums"]["portfolio_visibility"]
          show_certificates: boolean
          show_email: boolean
          show_phone: boolean
          show_projects: boolean
          show_resume: boolean
          skills: string[]
          success_story_priority: number
          success_story_summary: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          career_goals?: string | null
          created_at?: string
          education?: Json
          email?: string | null
          experience?: Json
          featured_success_story?: boolean
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio_slug?: string | null
          portfolio_visibility?: Database["public"]["Enums"]["portfolio_visibility"]
          show_certificates?: boolean
          show_email?: boolean
          show_phone?: boolean
          show_projects?: boolean
          show_resume?: boolean
          skills?: string[]
          success_story_priority?: number
          success_story_summary?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          career_goals?: string | null
          created_at?: string
          education?: Json
          email?: string | null
          experience?: Json
          featured_success_story?: boolean
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio_slug?: string | null
          portfolio_visibility?: Database["public"]["Enums"]["portfolio_visibility"]
          show_certificates?: boolean
          show_email?: boolean
          show_phone?: boolean
          show_projects?: boolean
          show_resume?: boolean
          skills?: string[]
          success_story_priority?: number
          success_story_summary?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration: string | null
          featured: boolean
          fee_inr: string | null
          format: string | null
          id: string
          level: string | null
          slug: string
          status: Database["public"]["Enums"]["program_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration?: string | null
          featured?: boolean
          fee_inr?: string | null
          format?: string | null
          id?: string
          level?: string | null
          slug: string
          status?: Database["public"]["Enums"]["program_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          featured?: boolean
          fee_inr?: string | null
          format?: string | null
          id?: string
          level?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["program_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_submissions: {
        Row: {
          created_at: string
          demo_url: string | null
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          project_id: string
          repo_url: string | null
          score: number | null
          status: Database["public"]["Enums"]["project_submission_status"]
          student_id: string
          submitted_at: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          demo_url?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          project_id: string
          repo_url?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["project_submission_status"]
          student_id: string
          submitted_at?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          demo_url?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          project_id?: string
          repo_url?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["project_submission_status"]
          student_id?: string
          submitted_at?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          brief: string | null
          created_at: string
          due_at: string | null
          guidelines: string | null
          id: string
          is_required: boolean
          program_id: string
          title: string
          updated_at: string
        }
        Insert: {
          brief?: string | null
          created_at?: string
          due_at?: string | null
          guidelines?: string | null
          id?: string
          is_required?: boolean
          program_id: string
          title: string
          updated_at?: string
        }
        Update: {
          brief?: string | null
          created_at?: string
          due_at?: string | null
          guidelines?: string | null
          id?: string
          is_required?: boolean
          program_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          target_id: string
          target_type: Database["public"]["Enums"]["reaction_target"]
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          target_id: string
          target_type: Database["public"]["Enums"]["reaction_target"]
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["reaction_target"]
          user_id?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          id: string
          notes: Json
          payment_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_refund_id: string | null
          reason: string | null
          status: Database["public"]["Enums"]["refund_status"]
          updated_at: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          id?: string
          notes?: Json
          payment_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_refund_id?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: Json
          payment_id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_refund_id?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          author: string | null
          commit_count: number
          commit_message: string | null
          commit_sha: string | null
          created_at: string
          deployed_at: string
          environment: string | null
          id: string
          new_groups: number | null
          notes: string | null
          permalink: string | null
          short_version: string | null
          source: string
          updated_at: string
          version: string
        }
        Insert: {
          author?: string | null
          commit_count?: number
          commit_message?: string | null
          commit_sha?: string | null
          created_at?: string
          deployed_at: string
          environment?: string | null
          id?: string
          new_groups?: number | null
          notes?: string | null
          permalink?: string | null
          short_version?: string | null
          source?: string
          updated_at?: string
          version: string
        }
        Update: {
          author?: string | null
          commit_count?: number
          commit_message?: string | null
          commit_sha?: string | null
          created_at?: string
          deployed_at?: string
          environment?: string | null
          id?: string
          new_groups?: number | null
          notes?: string | null
          permalink?: string | null
          short_version?: string | null
          source?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          is_hidden: boolean
          reaction_count: number
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_hidden?: boolean
          reaction_count?: number
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_hidden?: boolean
          reaction_count?: number
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          id: string
          job_id: string
          saved_at: string
          student_id: string
        }
        Insert: {
          id?: string
          job_id: string
          saved_at?: string
          student_id: string
        }
        Update: {
          id?: string
          job_id?: string
          saved_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarships: {
        Row: {
          amount_usd: number | null
          apply_url: string | null
          country_id: string | null
          coverage: string | null
          created_at: string
          deadline: string | null
          description: string | null
          eligibility: string | null
          id: string
          name: string
          published: boolean
          slug: string
          university_id: string | null
          updated_at: string
        }
        Insert: {
          amount_usd?: number | null
          apply_url?: string | null
          country_id?: string | null
          coverage?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          name: string
          published?: boolean
          slug: string
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_usd?: number | null
          apply_url?: string | null
          country_id?: string | null
          coverage?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          name?: string
          published?: boolean
          slug?: string
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarships_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarships_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sentry_issue_analyses: {
        Row: {
          analysis_hash: string | null
          analyzed_at: string
          auto_pr_recommended: boolean
          category: string | null
          cluster_id: string | null
          confidence: number | null
          created_at: string
          error: string | null
          fix_plan: Json | null
          id: string
          issue_id: string
          pr_suggestion: Json | null
          risk_score: number | null
          root_cause: Json | null
          sentry_permalink: string | null
          short_id: string | null
          signature: string | null
          status: string
          title: string
          trigger: string
          updated_at: string
        }
        Insert: {
          analysis_hash?: string | null
          analyzed_at?: string
          auto_pr_recommended?: boolean
          category?: string | null
          cluster_id?: string | null
          confidence?: number | null
          created_at?: string
          error?: string | null
          fix_plan?: Json | null
          id?: string
          issue_id: string
          pr_suggestion?: Json | null
          risk_score?: number | null
          root_cause?: Json | null
          sentry_permalink?: string | null
          short_id?: string | null
          signature?: string | null
          status?: string
          title: string
          trigger?: string
          updated_at?: string
        }
        Update: {
          analysis_hash?: string | null
          analyzed_at?: string
          auto_pr_recommended?: boolean
          category?: string | null
          cluster_id?: string | null
          confidence?: number | null
          created_at?: string
          error?: string | null
          fix_plan?: Json | null
          id?: string
          issue_id?: string
          pr_suggestion?: Json | null
          risk_score?: number | null
          root_cause?: Json | null
          sentry_permalink?: string | null
          short_id?: string | null
          signature?: string | null
          status?: string
          title?: string
          trigger?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sentry_issue_analyses_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "incident_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      sentry_pr_check_runs: {
        Row: {
          check_name: string
          completed_at: string | null
          conclusion: string | null
          created_at: string
          details_url: string | null
          external_id: string | null
          head_sha: string | null
          id: string
          observed_at: string
          pull_request_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          check_name: string
          completed_at?: string | null
          conclusion?: string | null
          created_at?: string
          details_url?: string | null
          external_id?: string | null
          head_sha?: string | null
          id?: string
          observed_at?: string
          pull_request_id: string
          started_at?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          check_name?: string
          completed_at?: string | null
          conclusion?: string | null
          created_at?: string
          details_url?: string | null
          external_id?: string | null
          head_sha?: string | null
          id?: string
          observed_at?: string
          pull_request_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sentry_pr_check_runs_pull_request_id_fkey"
            columns: ["pull_request_id"]
            isOneToOne: false
            referencedRelation: "sentry_pull_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      sentry_pull_requests: {
        Row: {
          analysis_hash: string | null
          base_branch: string
          body: string | null
          branch_name: string
          ci_conclusion: string | null
          ci_head_sha: string | null
          ci_last_checked_at: string | null
          ci_status: string
          commit_sha: string | null
          confidence_score: number
          created_at: string
          created_by: string | null
          id: string
          issue_id: string
          labels: string[]
          last_error: string | null
          pr_number: number | null
          pr_state: string
          pr_url: string | null
          repo: string
          requires_human_review: boolean
          title: string
          updated_at: string
        }
        Insert: {
          analysis_hash?: string | null
          base_branch?: string
          body?: string | null
          branch_name: string
          ci_conclusion?: string | null
          ci_head_sha?: string | null
          ci_last_checked_at?: string | null
          ci_status?: string
          commit_sha?: string | null
          confidence_score?: number
          created_at?: string
          created_by?: string | null
          id?: string
          issue_id: string
          labels?: string[]
          last_error?: string | null
          pr_number?: number | null
          pr_state?: string
          pr_url?: string | null
          repo: string
          requires_human_review?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          analysis_hash?: string | null
          base_branch?: string
          body?: string | null
          branch_name?: string
          ci_conclusion?: string | null
          ci_head_sha?: string | null
          ci_last_checked_at?: string | null
          ci_status?: string
          commit_sha?: string | null
          confidence_score?: number
          created_at?: string
          created_by?: string | null
          id?: string
          issue_id?: string
          labels?: string[]
          last_error?: string | null
          pr_number?: number | null
          pr_state?: string
          pr_url?: string | null
          repo?: string
          requires_human_review?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sentry_webhook_queue: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          dedupe_key: string
          event_type: string
          id: string
          issue_id: string | null
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          next_retry_at: string | null
          payload: Json
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          dedupe_key: string
          event_type: string
          id?: string
          issue_id?: string | null
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          next_retry_at?: string | null
          payload: Json
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          dedupe_key?: string
          event_type?: string
          id?: string
          issue_id?: string | null
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          next_retry_at?: string | null
          payload?: Json
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sre_e2e_test_runs: {
        Row: {
          ci_conclusion: string | null
          created_at: string
          current_phase: string | null
          error: string | null
          finished_at: string | null
          id: string
          phases: Json
          pr_url: string | null
          pull_request_id: string | null
          ready_for_deploy: boolean | null
          sample_issue_id: string | null
          started_at: string
          status: string
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          ci_conclusion?: string | null
          created_at?: string
          current_phase?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          phases?: Json
          pr_url?: string | null
          pull_request_id?: string | null
          ready_for_deploy?: boolean | null
          sample_issue_id?: string | null
          started_at?: string
          status?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          ci_conclusion?: string | null
          created_at?: string
          current_phase?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          phases?: Json
          pr_url?: string | null
          pull_request_id?: string | null
          ready_for_deploy?: boolean | null
          sample_issue_id?: string | null
          started_at?: string
          status?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sre_e2e_test_runs_pull_request_id_fkey"
            columns: ["pull_request_id"]
            isOneToOne: false
            referencedRelation: "sentry_pull_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          provider_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          provider_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "identity_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      study_abroad_leads: {
        Row: {
          assigned_to: string | null
          assigned_to_counselor: string | null
          country_of_interest: string | null
          created_at: string
          crm_status: Database["public"]["Enums"]["crm_status"]
          crm_substatus: string | null
          email: string
          field_of_interest: string | null
          full_name: string
          id: string
          intake_year: number | null
          level_of_interest: string | null
          message: string | null
          phone: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_counselor?: string | null
          country_of_interest?: string | null
          created_at?: string
          crm_status?: Database["public"]["Enums"]["crm_status"]
          crm_substatus?: string | null
          email: string
          field_of_interest?: string | null
          full_name: string
          id?: string
          intake_year?: number | null
          level_of_interest?: string | null
          message?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          assigned_to_counselor?: string | null
          country_of_interest?: string | null
          created_at?: string
          crm_status?: Database["public"]["Enums"]["crm_status"]
          crm_substatus?: string | null
          email?: string
          field_of_interest?: string | null
          full_name?: string
          id?: string
          intake_year?: number | null
          level_of_interest?: string | null
          message?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_abroad_leads_assigned_to_counselor_fkey"
            columns: ["assigned_to_counselor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          content: string | null
          created_at: string
          external_url: string | null
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number | null
          status: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submission_type: Database["public"]["Enums"]["submission_type"]
          submitted_at: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          content?: string | null
          created_at?: string
          external_url?: string | null
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          status?: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submission_type?: Database["public"]["Enums"]["submission_type"]
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          content?: string | null
          created_at?: string
          external_url?: string | null
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          status?: Database["public"]["Enums"]["submission_status"]
          student_id?: string
          submission_type?: Database["public"]["Enums"]["submission_type"]
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_errors: {
        Row: {
          context: Json
          environment: string | null
          fingerprint: string | null
          id: string
          level: string
          message: string
          name: string | null
          occurred_at: string
          release: string | null
          route: string | null
          source: string
          stack: string | null
          trace_id: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          context?: Json
          environment?: string | null
          fingerprint?: string | null
          id?: string
          level?: string
          message: string
          name?: string | null
          occurred_at?: string
          release?: string | null
          route?: string | null
          source: string
          stack?: string | null
          trace_id?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          context?: Json
          environment?: string | null
          fingerprint?: string | null
          id?: string
          level?: string
          message?: string
          name?: string | null
          occurred_at?: string
          release?: string | null
          route?: string | null
          source?: string
          stack?: string | null
          trace_id?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          context: Json
          duration_ms: number
          id: string
          kind: string
          name: string
          recorded_at: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json
          duration_ms: number
          id?: string
          kind: string
          name: string
          recorded_at?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json
          duration_ms?: number
          id?: string
          kind?: string
          name?: string
          recorded_at?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tech_client_requests: {
        Row: {
          assigned_to: string | null
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["tech_priority"]
          project_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["tech_request_status"]
          title: string
          type: Database["public"]["Enums"]["tech_request_type"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["tech_priority"]
          project_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["tech_request_status"]
          title: string
          type?: Database["public"]["Enums"]["tech_request_type"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["tech_priority"]
          project_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["tech_request_status"]
          title?: string
          type?: Database["public"]["Enums"]["tech_request_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_client_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tech_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_client_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_clients: {
        Row: {
          company: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          industry: string | null
          notes: string | null
          owner: string | null
          phone: string | null
          portal_user: string | null
          slug: string | null
          status: Database["public"]["Enums"]["tech_client_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          company: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          notes?: string | null
          owner?: string | null
          phone?: string | null
          portal_user?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["tech_client_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          company?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          notes?: string | null
          owner?: string | null
          phone?: string | null
          portal_user?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["tech_client_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tech_clients_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_clients_portal_user_fkey"
            columns: ["portal_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_contract_documents: {
        Row: {
          contract_id: string
          created_at: string
          document_type: string | null
          file_name: string | null
          file_url: string
          id: string
          uploaded_by: string | null
          visible_to_client: boolean
        }
        Insert: {
          contract_id: string
          created_at?: string
          document_type?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          uploaded_by?: string | null
          visible_to_client?: boolean
        }
        Update: {
          contract_id?: string
          created_at?: string
          document_type?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string | null
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tech_contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "tech_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_contracts: {
        Row: {
          client_id: string
          confidentiality: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          deliverables: string | null
          effective_date: string | null
          end_date: string | null
          id: string
          parties: string | null
          payment_terms: string | null
          pdf_url: string | null
          project_id: string | null
          proposal_id: string | null
          scope: string | null
          sent_at: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["tech_contract_status"]
          termination: string | null
          title: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          confidentiality?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deliverables?: string | null
          effective_date?: string | null
          end_date?: string | null
          id?: string
          parties?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          project_id?: string | null
          proposal_id?: string | null
          scope?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["tech_contract_status"]
          termination?: string | null
          title: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          confidentiality?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deliverables?: string | null
          effective_date?: string | null
          end_date?: string | null
          id?: string
          parties?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          project_id?: string | null
          proposal_id?: string | null
          scope?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["tech_contract_status"]
          termination?: string | null
          title?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tech_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "tech_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          position: number
          quantity: number
          unit_price: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          position?: number
          quantity?: number
          unit_price?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          position?: number
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "tech_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "tech_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_invoices: {
        Row: {
          amount_paid: number
          client_id: string
          contract_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          discount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_at: string | null
          payment_instructions: string | null
          pdf_generated_at: string | null
          pdf_url: string | null
          project_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["tech_invoice_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          client_id: string
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_instructions?: string | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          project_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["tech_invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          client_id?: string
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_instructions?: string | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          project_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["tech_invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tech_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "tech_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_payment_allocations: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          payment_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          payment_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "tech_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "tech_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          method: Database["public"]["Enums"]["tech_payment_method"]
          notes: string | null
          paid_on: string
          receipt_url: string | null
          reference: string | null
          status: Database["public"]["Enums"]["tech_payment_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["tech_payment_method"]
          notes?: string | null
          paid_on?: string
          receipt_url?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["tech_payment_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["tech_payment_method"]
          notes?: string | null
          paid_on?: string
          receipt_url?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["tech_payment_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tech_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tech_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_project_documents: {
        Row: {
          category: string | null
          created_at: string
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          project_id: string
          uploaded_by: string | null
          visible_to_client: boolean
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          project_id: string
          uploaded_by?: string | null
          visible_to_client?: boolean
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          project_id?: string
          uploaded_by?: string | null
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tech_project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_project_members: {
        Row: {
          added_by: string | null
          allocation_pct: number | null
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          allocation_pct?: number | null
          created_at?: string
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          allocation_pct?: number | null
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_project_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_project_milestones: {
        Row: {
          completion_pct: number
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          order_index: number
          project_id: string
          status: Database["public"]["Enums"]["tech_milestone_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completion_pct?: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          project_id: string
          status?: Database["public"]["Enums"]["tech_milestone_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completion_pct?: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          project_id?: string
          status?: Database["public"]["Enums"]["tech_milestone_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_projects: {
        Row: {
          budget: number | null
          client_id: string
          created_at: string
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          project_manager: string | null
          slug: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["tech_project_status"]
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id: string
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          project_manager?: string | null
          slug?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["tech_project_status"]
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          project_manager?: string | null
          slug?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["tech_project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tech_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_projects_project_manager_fkey"
            columns: ["project_manager"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_proposal_versions: {
        Row: {
          created_at: string
          created_by: string | null
          deliverables: string | null
          executive_summary: string | null
          id: string
          pdf_url: string | null
          pricing: string | null
          proposal_id: string
          scope_of_work: string | null
          terms: string | null
          timeline: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deliverables?: string | null
          executive_summary?: string | null
          id?: string
          pdf_url?: string | null
          pricing?: string | null
          proposal_id: string
          scope_of_work?: string | null
          terms?: string | null
          timeline?: string | null
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deliverables?: string | null
          executive_summary?: string | null
          id?: string
          pdf_url?: string | null
          pricing?: string | null
          proposal_id?: string
          scope_of_work?: string | null
          terms?: string | null
          timeline?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tech_proposal_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "tech_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_proposals: {
        Row: {
          client_id: string
          client_response_notes: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          current_version: number
          id: string
          project_id: string | null
          responded_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["tech_proposal_status"]
          summary: string | null
          title: string
          total_amount: number | null
          updated_at: string
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          client_id: string
          client_response_notes?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_version?: number
          id?: string
          project_id?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["tech_proposal_status"]
          summary?: string | null
          title: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          client_id?: string
          client_response_notes?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_version?: number
          id?: string
          project_id?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["tech_proposal_status"]
          summary?: string | null
          title?: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tech_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tech_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_request_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          request_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          request_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          request_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tech_request_attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tech_client_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_request_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          internal: boolean
          request_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          internal?: boolean
          request_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          internal?: boolean
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tech_client_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_support_tickets: {
        Row: {
          assigned_to: string | null
          client_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["tech_priority"]
          project_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["tech_ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["tech_priority"]
          project_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["tech_ticket_status"]
          subject: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["tech_priority"]
          project_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["tech_ticket_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_support_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tech_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_support_tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_ticket_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          storage_path: string
          ticket_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          storage_path: string
          ticket_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          storage_path?: string
          ticket_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tech_ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tech_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_ticket_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tech_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      technologies_leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          crm_status: Database["public"]["Enums"]["crm_status"]
          crm_substatus: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          service_interest: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          crm_status?: Database["public"]["Enums"]["crm_status"]
          crm_substatus?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          service_interest?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          crm_status?: Database["public"]["Enums"]["crm_status"]
          crm_substatus?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          service_interest?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technologies_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          author_id: string
          body: string
          community_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_hidden: boolean
          last_reply_at: string | null
          lesson_id: string | null
          locked: boolean
          pinned: boolean
          reaction_count: number
          reply_count: number
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          community_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_hidden?: boolean
          last_reply_at?: string | null
          lesson_id?: string | null
          locked?: boolean
          pinned?: boolean
          reaction_count?: number
          reply_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          community_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_hidden?: boolean
          last_reply_at?: string | null
          lesson_id?: string | null
          locked?: boolean
          pinned?: boolean
          reaction_count?: number
          reply_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          acceptance_rate: number | null
          accreditations: string[] | null
          avg_tuition_usd: number | null
          city: string | null
          country_id: string | null
          created_at: string
          description: string | null
          featured: boolean
          hero_image_url: string | null
          id: string
          intakes: string[] | null
          logo_url: string | null
          name: string
          national_ranking: number | null
          overview: string | null
          published: boolean
          requirements: string | null
          slug: string
          updated_at: string
          website_url: string | null
          world_ranking: number | null
        }
        Insert: {
          acceptance_rate?: number | null
          accreditations?: string[] | null
          avg_tuition_usd?: number | null
          city?: string | null
          country_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          intakes?: string[] | null
          logo_url?: string | null
          name: string
          national_ranking?: number | null
          overview?: string | null
          published?: boolean
          requirements?: string | null
          slug: string
          updated_at?: string
          website_url?: string | null
          world_ranking?: number | null
        }
        Update: {
          acceptance_rate?: number | null
          accreditations?: string[] | null
          avg_tuition_usd?: number | null
          city?: string | null
          country_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          intakes?: string[] | null
          logo_url?: string | null
          name?: string
          national_ranking?: number | null
          overview?: string | null
          published?: boolean
          requirements?: string | null
          slug?: string
          updated_at?: string
          website_url?: string | null
          world_ranking?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "universities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      university_programs: {
        Row: {
          created_at: string
          description: string | null
          duration_months: number | null
          field: string | null
          id: string
          intakes: string[] | null
          level: string
          name: string
          published: boolean
          requirements: string | null
          slug: string
          tuition_usd: number | null
          university_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_months?: number | null
          field?: string | null
          id?: string
          intakes?: string[] | null
          level: string
          name: string
          published?: boolean
          requirements?: string | null
          slug: string
          tuition_usd?: number | null
          university_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_months?: number | null
          field?: string | null
          id?: string
          intakes?: string[] | null
          level?: string
          name?: string
          published?: boolean
          requirements?: string | null
          slug?: string
          tuition_usd?: number | null
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_programs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_recovery_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visa_cases: {
        Row: {
          application_id: string | null
          assigned_counselor: string | null
          country_id: string | null
          created_at: string
          decision_at: string | null
          id: string
          interview_date: string | null
          interview_location: string | null
          interview_notes: string | null
          interview_time: string | null
          notes: string | null
          status: Database["public"]["Enums"]["visa_status"]
          student_id: string
          submitted_at: string | null
          updated_at: string
          visa_type: string | null
        }
        Insert: {
          application_id?: string | null
          assigned_counselor?: string | null
          country_id?: string | null
          created_at?: string
          decision_at?: string | null
          id?: string
          interview_date?: string | null
          interview_location?: string | null
          interview_notes?: string | null
          interview_time?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["visa_status"]
          student_id: string
          submitted_at?: string | null
          updated_at?: string
          visa_type?: string | null
        }
        Update: {
          application_id?: string | null
          assigned_counselor?: string | null
          country_id?: string | null
          created_at?: string
          decision_at?: string | null
          id?: string
          interview_date?: string | null
          interview_location?: string | null
          interview_notes?: string | null
          interview_time?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["visa_status"]
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
          visa_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visa_cases_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_cases_assigned_counselor_fkey"
            columns: ["assigned_counselor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_cases_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_cases_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visa_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          notes: string | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
          visa_case_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          notes?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          visa_case_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          notes?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          visa_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_documents_visa_case_id_fkey"
            columns: ["visa_case_id"]
            isOneToOne: false
            referencedRelation: "visa_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      visa_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["visa_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["visa_status"] | null
          visa_case_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["visa_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["visa_status"] | null
          visa_case_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["visa_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["visa_status"] | null
          visa_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_status_history_visa_case_id_fkey"
            columns: ["visa_case_id"]
            isOneToOne: false
            referencedRelation: "visa_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          error: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          received_at: string
          signature: string | null
        }
        Insert: {
          error?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          received_at?: string
          signature?: string | null
        }
        Update: {
          error?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          received_at?: string
          signature?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_delete_document: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: undefined
      }
      ai_upsert_document_and_enqueue: {
        Args: {
          p_collection_slug: string
          p_content: string
          p_entity_id: string
          p_entity_type: string
          p_title: string
        }
        Returns: undefined
      }
      business_kpis: { Args: { _hours?: number }; Returns: Json }
      can_subscribe_realtime_topic: {
        Args: { _topic: string; _user: string }
        Returns: boolean
      }
      check_api_rate_limit: {
        Args: { _api_key_id: string; _limit: number; _window_seconds?: number }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      cleanup_api_rate_limits: { Args: never; Returns: undefined }
      emit_domain_event: {
        Args: {
          _aggregate_id?: string
          _aggregate_type?: string
          _event_type: string
          _payload?: Json
        }
        Returns: string
      }
      enqueue_webhook_event: {
        Args: { _event_type: string; _payload: Json }
        Returns: number
      }
      generate_portfolio_slug: {
        Args: { _full_name: string; _id: string }
        Returns: string
      }
      get_public_portfolio_profile: {
        Args: { _slug: string }
        Returns: {
          avatar_url: string
          bio: string
          career_goals: string
          education: Json
          email: string
          experience: Json
          full_name: string
          github_url: string
          headline: string
          id: string
          linkedin_url: string
          location: string
          phone: string
          portfolio_slug: string
          portfolio_visibility: string
          show_certificates: boolean
          show_email: boolean
          show_phone: boolean
          show_projects: boolean
          show_resume: boolean
          skills: string[]
          website_url: string
        }[]
      }
      get_webhook_signing_secret: {
        Args: { _subscription_id: string }
        Returns: string
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_community_member: {
        Args: { _community_id: string; _user_id?: string }
        Returns: boolean
      }
      is_program_eligible: {
        Args: { _program: string; _student: string }
        Returns: boolean
      }
      lease_webhook_deliveries: {
        Args: { _lease_seconds: number; _limit: number }
        Returns: {
          attempt: number
          created_at: string
          delivered_at: string | null
          error: string | null
          event_type: string
          id: number
          leased_until: string | null
          max_attempts: number
          next_attempt_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          status: string
          subscription_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "api_webhook_deliveries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      match_ai_chunks:
        | {
            Args: {
              collection_ids?: string[]
              match_count?: number
              query_embedding: string
            }
            Returns: {
              chunk_text: string
              collection_id: string
              document_id: string
              id: string
              metadata: Json
              similarity: number
            }[]
          }
        | {
            Args: {
              match_count?: number
              p_entity_ids: string[]
              p_entity_type: string
              query_embedding: string
            }
            Returns: {
              chunk_id: string
              chunk_text: string
              document_id: string
              entity_id: string
              entity_type: string
              similarity: number
              title: string
            }[]
          }
      notifications_mark_all_read: { Args: never; Returns: number }
      notifications_unread_count: { Args: never; Returns: number }
      observability_summary: { Args: { _window?: string }; Returns: Json }
      verify_certificate: {
        Args: { _number: string }
        Returns: {
          certificate_number: string
          issued_at: string
          program_title: string
          revoked: boolean
          student_name: string
          verification_hash: string
        }[]
      }
      verify_certificate_by_token: {
        Args: { _token: string }
        Returns: {
          certificate_number: string
          issued_at: string
          program_title: string
          revoked: boolean
          student_name: string
          verification_hash: string
        }[]
      }
    }
    Enums: {
      ai_context_type: "lesson" | "community" | "general"
      ai_message_role: "user" | "assistant" | "system"
      app_role:
        | "student"
        | "faculty"
        | "mentor"
        | "counselor"
        | "placement_officer"
        | "enterprise_client"
        | "admin"
        | "super_admin"
        | "tech_client"
        | "ops"
      application_status:
        | "submitted"
        | "under_review"
        | "shortlisted"
        | "rejected"
        | "withdrawn"
        | "hired"
      application_workflow_status:
        | "lead"
        | "qualified"
        | "documents_pending"
        | "application_submitted"
        | "offer_received"
        | "visa_processing"
        | "completed"
        | "closed_lost"
      community_member_role: "member" | "moderator" | "owner"
      community_membership_type: "open" | "approval_required"
      community_visibility: "public" | "private"
      course_status: "draft" | "published" | "archived"
      crm_status:
        | "new"
        | "contacted"
        | "qualified"
        | "in_progress"
        | "converted"
        | "closed"
      domain_event_status: "pending" | "processing" | "processed" | "failed"
      enrollment_status: "active" | "paused" | "completed" | "withdrawn"
      event_rsvp_status: "going" | "maybe" | "declined"
      event_status: "draft" | "scheduled" | "live" | "completed" | "cancelled"
      job_employment_type: "full_time" | "part_time" | "contract" | "internship"
      job_experience_level: "entry" | "mid" | "senior"
      job_remote_type: "onsite" | "hybrid" | "remote"
      job_status: "draft" | "open" | "closed" | "archived"
      lesson_type: "video" | "reading" | "lab" | "quiz"
      notification_channel: "in_app" | "email" | "push"
      notification_priority: "low" | "normal" | "high" | "critical"
      notification_status:
        | "pending"
        | "queued"
        | "sent"
        | "delivered"
        | "failed"
        | "read"
      payment_provider: "razorpay" | "stripe" | "manual"
      payment_purpose:
        | "course_enrollment"
        | "program_enrollment"
        | "consultation"
        | "invoice"
        | "proposal"
        | "subscription"
        | "other"
      payment_status:
        | "created"
        | "authorized"
        | "captured"
        | "failed"
        | "refunded"
        | "partially_refunded"
        | "cancelled"
        | "pending_verification"
        | "approved"
        | "rejected"
        | "info_requested"
      portfolio_visibility: "private" | "unlisted" | "public"
      program_status: "draft" | "published" | "archived"
      project_submission_status:
        | "draft"
        | "submitted"
        | "reviewed"
        | "passed"
        | "failed"
        | "needs_revision"
      reaction_target: "thread" | "reply"
      refund_status: "pending" | "processed" | "failed"
      submission_status:
        | "pending"
        | "reviewed"
        | "passed"
        | "failed"
        | "needs_revision"
      submission_type: "file" | "github" | "portfolio" | "text" | "mixed"
      tech_client_status:
        | "lead"
        | "discovery"
        | "proposal"
        | "approved"
        | "active"
        | "completed"
        | "archived"
      tech_contract_status:
        | "draft"
        | "sent"
        | "signed"
        | "active"
        | "completed"
        | "terminated"
      tech_invoice_status:
        | "draft"
        | "sent"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
      tech_milestone_status:
        | "not_started"
        | "in_progress"
        | "blocked"
        | "done"
        | "cancelled"
      tech_payment_method:
        | "bank_transfer"
        | "upi"
        | "card"
        | "cash"
        | "cheque"
        | "other"
      tech_payment_status: "pending" | "received" | "failed" | "refunded"
      tech_priority: "low" | "medium" | "high" | "critical"
      tech_project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      tech_proposal_status:
        | "draft"
        | "sent"
        | "viewed"
        | "negotiation"
        | "accepted"
        | "rejected"
        | "expired"
      tech_request_status:
        | "new"
        | "in_review"
        | "approved"
        | "rejected"
        | "in_progress"
        | "completed"
      tech_request_type:
        | "feature"
        | "change"
        | "enhancement"
        | "consultation"
        | "bug"
        | "other"
      tech_ticket_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "waiting_client"
        | "resolved"
        | "closed"
      visa_status:
        | "draft"
        | "documents_pending"
        | "ready_to_submit"
        | "submitted"
        | "interview_scheduled"
        | "administrative_processing"
        | "approved"
        | "rejected"
        | "closed"
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
      ai_context_type: ["lesson", "community", "general"],
      ai_message_role: ["user", "assistant", "system"],
      app_role: [
        "student",
        "faculty",
        "mentor",
        "counselor",
        "placement_officer",
        "enterprise_client",
        "admin",
        "super_admin",
        "tech_client",
        "ops",
      ],
      application_status: [
        "submitted",
        "under_review",
        "shortlisted",
        "rejected",
        "withdrawn",
        "hired",
      ],
      application_workflow_status: [
        "lead",
        "qualified",
        "documents_pending",
        "application_submitted",
        "offer_received",
        "visa_processing",
        "completed",
        "closed_lost",
      ],
      community_member_role: ["member", "moderator", "owner"],
      community_membership_type: ["open", "approval_required"],
      community_visibility: ["public", "private"],
      course_status: ["draft", "published", "archived"],
      crm_status: [
        "new",
        "contacted",
        "qualified",
        "in_progress",
        "converted",
        "closed",
      ],
      domain_event_status: ["pending", "processing", "processed", "failed"],
      enrollment_status: ["active", "paused", "completed", "withdrawn"],
      event_rsvp_status: ["going", "maybe", "declined"],
      event_status: ["draft", "scheduled", "live", "completed", "cancelled"],
      job_employment_type: ["full_time", "part_time", "contract", "internship"],
      job_experience_level: ["entry", "mid", "senior"],
      job_remote_type: ["onsite", "hybrid", "remote"],
      job_status: ["draft", "open", "closed", "archived"],
      lesson_type: ["video", "reading", "lab", "quiz"],
      notification_channel: ["in_app", "email", "push"],
      notification_priority: ["low", "normal", "high", "critical"],
      notification_status: [
        "pending",
        "queued",
        "sent",
        "delivered",
        "failed",
        "read",
      ],
      payment_provider: ["razorpay", "stripe", "manual"],
      payment_purpose: [
        "course_enrollment",
        "program_enrollment",
        "consultation",
        "invoice",
        "proposal",
        "subscription",
        "other",
      ],
      payment_status: [
        "created",
        "authorized",
        "captured",
        "failed",
        "refunded",
        "partially_refunded",
        "cancelled",
        "pending_verification",
        "approved",
        "rejected",
        "info_requested",
      ],
      portfolio_visibility: ["private", "unlisted", "public"],
      program_status: ["draft", "published", "archived"],
      project_submission_status: [
        "draft",
        "submitted",
        "reviewed",
        "passed",
        "failed",
        "needs_revision",
      ],
      reaction_target: ["thread", "reply"],
      refund_status: ["pending", "processed", "failed"],
      submission_status: [
        "pending",
        "reviewed",
        "passed",
        "failed",
        "needs_revision",
      ],
      submission_type: ["file", "github", "portfolio", "text", "mixed"],
      tech_client_status: [
        "lead",
        "discovery",
        "proposal",
        "approved",
        "active",
        "completed",
        "archived",
      ],
      tech_contract_status: [
        "draft",
        "sent",
        "signed",
        "active",
        "completed",
        "terminated",
      ],
      tech_invoice_status: [
        "draft",
        "sent",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      tech_milestone_status: [
        "not_started",
        "in_progress",
        "blocked",
        "done",
        "cancelled",
      ],
      tech_payment_method: [
        "bank_transfer",
        "upi",
        "card",
        "cash",
        "cheque",
        "other",
      ],
      tech_payment_status: ["pending", "received", "failed", "refunded"],
      tech_priority: ["low", "medium", "high", "critical"],
      tech_project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      tech_proposal_status: [
        "draft",
        "sent",
        "viewed",
        "negotiation",
        "accepted",
        "rejected",
        "expired",
      ],
      tech_request_status: [
        "new",
        "in_review",
        "approved",
        "rejected",
        "in_progress",
        "completed",
      ],
      tech_request_type: [
        "feature",
        "change",
        "enhancement",
        "consultation",
        "bug",
        "other",
      ],
      tech_ticket_status: [
        "open",
        "assigned",
        "in_progress",
        "waiting_client",
        "resolved",
        "closed",
      ],
      visa_status: [
        "draft",
        "documents_pending",
        "ready_to_submit",
        "submitted",
        "interview_scheduled",
        "administrative_processing",
        "approved",
        "rejected",
        "closed",
      ],
    },
  },
} as const
