/**
 * API Types for Algo-PT
 * Based on contracts/api.yaml
 */

// ============================================================
// AI Endpoints
// ============================================================

export type AIMode = 'flash' | 'pro';

export interface HintRequest {
  problem_id: number;
  mode: AIMode;
  current_approach?: string;
}

export interface HintResponse {
  hint: string;
  mode_used: AIMode;
  remaining_requests: {
    flash: number;
    pro: number;
  };
}

export interface ReviewRequest {
  problem_id: number;
  code: string;
  language?: string;
  mode: AIMode;
}

export interface CodeIssue {
  type: 'inefficiency' | 'bug' | 'style' | 'complexity';
  line?: number;
  description: string;
  suggestion?: string;
}

export interface ReviewResponse {
  review: string;
  issues: CodeIssue[];
  complexity_analysis?: {
    time: string;
    space: string;
  };
  remaining_requests: {
    flash: number;
    pro: number;
  };
}

// ============================================================
// Sync Endpoints
// ============================================================

export interface SyncRequest {
  baekjoon_id: string;
}

export interface SyncResultProblem {
  problem_id: number;
  title: string;
  status: 'synced' | 'skipped';
}

export interface SyncResult {
  synced_count: number;
  skipped_count: number;
  problems: SyncResultProblem[];
}

// ============================================================
// Problem Endpoints
// ============================================================

export interface ProblemResponse {
  problem_id: number;
  title: string;
  level: number;
  tags: string[];
  cached_at: string;
}

export interface BatchProblemRequest {
  problem_ids: number[];
}

// ============================================================
// Error Responses
// ============================================================

export interface RateLimitError {
  error: string;
  limit: number;
  reset_at: string;
}

export interface UnauthorizedError {
  error: 'Unauthorized';
}

export interface NotFoundError {
  error: 'Not found';
}
