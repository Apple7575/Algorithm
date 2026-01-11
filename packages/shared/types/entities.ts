/**
 * Core entity types for Algo-PT
 * Based on data-model.md
 */

export interface User {
  id: string;
  email: string;
  baekjoon_id: string | null;
  target_tier: string | null;
  created_at: string;
  updated_at: string;
}

export interface Problem {
  problem_id: number;
  title: string;
  level: number | null;
  tags: string[];
  cached_at: string;
}

export type StudyStatus = 'solved' | 'failed' | 'review_needed';
export type DifficultyRating = 'easy' | 'normal' | 'hard';
export type FailureReason = 'algo' | 'impl' | 'time' | 'edge';

export interface StudyLog {
  id: string;
  user_id: string;
  problem_id: number;
  status: StudyStatus;
  duration_seconds: number | null;
  difficulty_rating: DifficultyRating | null;
  failure_reason: FailureReason | null;
  solved_at: string;
  next_review_date: string | null;
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  created_at: string;
}

export interface AIUsage {
  id: string;
  user_id: string;
  date: string;
  flash_count: number;
  pro_count: number;
}
