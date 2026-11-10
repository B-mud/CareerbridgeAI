// Supabase Database Types
// Auto-generated types for Supabase tables

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string | null
          age: number | null
          profession: string | null
          experience: string | null
          interests: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          age?: number | null
          profession?: string | null
          experience?: string | null
          interests?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          age?: number | null
          profession?: string | null
          experience?: string | null
          interests?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_size: number
          uploaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_size: number
          uploaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_size?: number
          uploaded_at?: string
        }
      }
      analysis: {
        Row: {
          id: string
          resume_id: string
          skills: string[]
          possessed_skills: string[] | null
          missing_skills: string[] | null
          experience: string
          match_score: number
          recommendations: Json
          created_at: string
        }
        Insert: {
          id?: string
          resume_id: string
          skills: string[]
          possessed_skills?: string[] | null
          missing_skills?: string[] | null
          experience: string
          match_score: number
          recommendations: Json
          created_at?: string
        }
        Update: {
          id?: string
          resume_id?: string
          skills?: string[]
          possessed_skills?: string[] | null
          missing_skills?: string[] | null
          experience?: string
          match_score?: number
          recommendations?: Json
          created_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          action_type: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          details?: Json | null
          created_at?: string
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
