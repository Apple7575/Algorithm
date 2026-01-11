/**
 * Study Log API Client
 * Sends problem solving data to Supabase
 */

import { getAuthTokens, isTokenExpired } from '../storage';
import type { DifficultyRating, FailureReason, StudyStatus } from '@algo-pt/shared';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface CreateStudyLogInput {
  problemId: number;
  status: StudyStatus;
  durationSeconds: number;
  difficultyRating?: DifficultyRating;
  failureReason?: FailureReason;
  solvedAt: string;
}

export interface StudyLogResponse {
  id: string;
  user_id: string;
  problem_id: number;
  status: StudyStatus;
  duration_seconds: number;
  difficulty_rating: DifficultyRating | null;
  failure_reason: FailureReason | null;
  solved_at: string;
  next_review_date: string | null;
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  created_at: string;
}

export async function createStudyLog(input: CreateStudyLogInput): Promise<StudyLogResponse | null> {
  const tokens = await getAuthTokens();

  if (!tokens || isTokenExpired(tokens.expiresAt)) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/study_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.accessToken}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      user_id: tokens.userId,
      problem_id: input.problemId,
      status: input.status,
      duration_seconds: input.durationSeconds,
      difficulty_rating: input.difficultyRating ?? null,
      failure_reason: input.failureReason ?? null,
      solved_at: input.solvedAt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create study log: ${error}`);
  }

  const data = await response.json();
  return data[0];
}

export async function ensureProblemExists(problemId: number): Promise<void> {
  const tokens = await getAuthTokens();

  if (!tokens) {
    throw new Error('Not authenticated');
  }

  // Check if problem exists
  const checkResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/problems?problem_id=eq.${problemId}`,
    {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    }
  );

  const existing = await checkResponse.json();
  if (existing.length > 0) {
    return; // Already exists
  }

  // Fetch from Solved.ac and insert
  try {
    const solvedAcResponse = await fetch(
      `https://solved.ac/api/v3/problem/show?problemId=${problemId}`
    );

    if (solvedAcResponse.ok) {
      const problemData = await solvedAcResponse.json();

      await fetch(`${SUPABASE_URL}/rest/v1/problems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          problem_id: problemId,
          title: problemData.titleKo || problemData.title || `Problem ${problemId}`,
          level: problemData.level ?? null,
          tags: problemData.tags?.map((t: { key: string }) => t.key) ?? [],
        }),
      });
    } else {
      // Insert with minimal data if Solved.ac fails
      await fetch(`${SUPABASE_URL}/rest/v1/problems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          problem_id: problemId,
          title: `Problem ${problemId}`,
          level: null,
          tags: [],
        }),
      });
    }
  } catch {
    // Insert with minimal data on any error
    await fetch(`${SUPABASE_URL}/rest/v1/problems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({
        problem_id: problemId,
        title: `Problem ${problemId}`,
        level: null,
        tags: [],
      }),
    });
  }
}
