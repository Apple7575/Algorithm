/**
 * Supabase Database Types
 * Generated from data-model.md
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          baekjoon_id: string | null;
          target_tier: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          baekjoon_id?: string | null;
          target_tier?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          baekjoon_id?: string | null;
          target_tier?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      problems: {
        Row: {
          problem_id: number;
          title: string;
          level: number | null;
          tags: string[];
          cached_at: string;
        };
        Insert: {
          problem_id: number;
          title: string;
          level?: number | null;
          tags?: string[];
          cached_at?: string;
        };
        Update: {
          problem_id?: number;
          title?: string;
          level?: number | null;
          tags?: string[];
          cached_at?: string;
        };
      };
      study_logs: {
        Row: {
          id: string;
          user_id: string;
          problem_id: number;
          status: 'solved' | 'failed' | 'review_needed';
          duration_seconds: number | null;
          difficulty_rating: 'easy' | 'normal' | 'hard' | null;
          failure_reason: 'algo' | 'impl' | 'time' | 'edge' | null;
          solved_at: string;
          next_review_date: string | null;
          easiness_factor: number;
          interval_days: number;
          repetitions: number;
          synced_from_solved_ac: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: number;
          status: 'solved' | 'failed' | 'review_needed';
          duration_seconds?: number | null;
          difficulty_rating?: 'easy' | 'normal' | 'hard' | null;
          failure_reason?: 'algo' | 'impl' | 'time' | 'edge' | null;
          solved_at?: string;
          next_review_date?: string | null;
          easiness_factor?: number;
          interval_days?: number;
          repetitions?: number;
          synced_from_solved_ac?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: number;
          status?: 'solved' | 'failed' | 'review_needed';
          duration_seconds?: number | null;
          difficulty_rating?: 'easy' | 'normal' | 'hard' | null;
          failure_reason?: 'algo' | 'impl' | 'time' | 'edge' | null;
          solved_at?: string;
          next_review_date?: string | null;
          easiness_factor?: number;
          interval_days?: number;
          repetitions?: number;
          synced_from_solved_ac?: boolean;
          created_at?: string;
        };
      };
      ai_usage: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          flash_count: number;
          pro_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          flash_count?: number;
          pro_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          flash_count?: number;
          pro_count?: number;
        };
      };
      profiles: {
        Row: {
          id: string;
          baekjoon_id: string | null;
          solved_ac_tier: number | null;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          baekjoon_id?: string | null;
          solved_ac_tier?: number | null;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baekjoon_id?: string | null;
          solved_ac_tier?: number | null;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
