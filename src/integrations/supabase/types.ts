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
      ai_documents: {
        Row: {
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
          program_id: string
          revoked: boolean
          revoked_at: string | null
          revoked_reason: string | null
          student_id: string
          updated_at: string
          verification_hash: string | null
        }
        Insert: {
          certificate_number?: string | null
          certificate_url?: string | null
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          program_id: string
          revoked?: boolean
          revoked_at?: string | null
          revoked_reason?: string | null
          student_id: string
          updated_at?: string
          verification_hash?: string | null
        }
        Update: {
          certificate_number?: string | null
          certificate_url?: string | null
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          program_id?: string
          revoked?: boolean
          revoked_at?: string | null
          revoked_reason?: string | null
          student_id?: string
          updated_at?: string
          verification_hash?: string | null
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
      knowledge_sources: {
        Row: {
          active: boolean
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
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          source_type?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_portfolio_slug: {
        Args: { _full_name: string; _id: string }
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
      is_program_eligible: {
        Args: { _program: string; _student: string }
        Returns: boolean
      }
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
    }
    Enums: {
      app_role:
        | "student"
        | "faculty"
        | "mentor"
        | "counselor"
        | "placement_officer"
        | "enterprise_client"
        | "admin"
        | "super_admin"
      application_status:
        | "submitted"
        | "under_review"
        | "shortlisted"
        | "rejected"
        | "withdrawn"
        | "hired"
      course_status: "draft" | "published" | "archived"
      crm_status:
        | "new"
        | "contacted"
        | "qualified"
        | "in_progress"
        | "converted"
        | "closed"
      enrollment_status: "active" | "paused" | "completed" | "withdrawn"
      job_employment_type: "full_time" | "part_time" | "contract" | "internship"
      job_experience_level: "entry" | "mid" | "senior"
      job_remote_type: "onsite" | "hybrid" | "remote"
      job_status: "draft" | "open" | "closed" | "archived"
      lesson_type: "video" | "reading" | "lab" | "quiz"
      portfolio_visibility: "private" | "unlisted" | "public"
      program_status: "draft" | "published" | "archived"
      project_submission_status:
        | "draft"
        | "submitted"
        | "reviewed"
        | "passed"
        | "failed"
        | "needs_revision"
      submission_status:
        | "pending"
        | "reviewed"
        | "passed"
        | "failed"
        | "needs_revision"
      submission_type: "file" | "github" | "portfolio" | "text" | "mixed"
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
      app_role: [
        "student",
        "faculty",
        "mentor",
        "counselor",
        "placement_officer",
        "enterprise_client",
        "admin",
        "super_admin",
      ],
      application_status: [
        "submitted",
        "under_review",
        "shortlisted",
        "rejected",
        "withdrawn",
        "hired",
      ],
      course_status: ["draft", "published", "archived"],
      crm_status: [
        "new",
        "contacted",
        "qualified",
        "in_progress",
        "converted",
        "closed",
      ],
      enrollment_status: ["active", "paused", "completed", "withdrawn"],
      job_employment_type: ["full_time", "part_time", "contract", "internship"],
      job_experience_level: ["entry", "mid", "senior"],
      job_remote_type: ["onsite", "hybrid", "remote"],
      job_status: ["draft", "open", "closed", "archived"],
      lesson_type: ["video", "reading", "lab", "quiz"],
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
      submission_status: [
        "pending",
        "reviewed",
        "passed",
        "failed",
        "needs_revision",
      ],
      submission_type: ["file", "github", "portfolio", "text", "mixed"],
    },
  },
} as const
