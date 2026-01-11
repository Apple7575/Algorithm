/**
 * Weakness Analysis Queries
 * Aggregates failure reasons to identify user weaknesses
 */

import { createClient } from '../server';
import type { FailureReason } from '@algo-pt/shared';

export interface WeaknessScore {
  reason: FailureReason;
  count: number;
  percentage: number;
  label: string;
  description: string;
}

const FAILURE_REASON_INFO: Record<
  FailureReason,
  { label: string; description: string }
> = {
  algo: {
    label: 'Algorithm',
    description: 'Difficulty choosing the right algorithm or data structure',
  },
  impl: {
    label: 'Implementation',
    description: 'Bugs or mistakes in code implementation',
  },
  time: {
    label: 'Time Complexity',
    description: 'Solution was too slow for the constraints',
  },
  edge: {
    label: 'Edge Cases',
    description: 'Missing corner cases or boundary conditions',
  },
};

/**
 * Get aggregated weakness scores for a user
 */
export async function getWeaknessScores(userId: string): Promise<WeaknessScore[]> {
  const supabase = await createClient();

  // Get all failures with reasons
  const { data, error } = await supabase
    .from('study_logs')
    .select('failure_reason')
    .eq('user_id', userId)
    .eq('status', 'failed')
    .not('failure_reason', 'is', null);

  if (error || !data) {
    console.error('Error fetching weakness data:', error);
    return [];
  }

  const logs = data as Array<{ failure_reason: string | null }>;

  // Count by reason
  const counts: Record<FailureReason, number> = {
    algo: 0,
    impl: 0,
    time: 0,
    edge: 0,
  };

  for (const log of logs) {
    if (log.failure_reason) {
      counts[log.failure_reason as FailureReason]++;
    }
  }

  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

  // Convert to scored array
  const scores: WeaknessScore[] = Object.entries(counts)
    .map(([reason, count]) => ({
      reason: reason as FailureReason,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      ...FAILURE_REASON_INFO[reason as FailureReason],
    }))
    .sort((a, b) => b.count - a.count);

  return scores;
}

/**
 * Get top weaknesses (those with count > 0)
 */
export async function getTopWeaknesses(
  userId: string,
  limit = 3
): Promise<WeaknessScore[]> {
  const scores = await getWeaknessScores(userId);
  return scores.filter(s => s.count > 0).slice(0, limit);
}

/**
 * Get weakness trend over time
 */
export async function getWeaknessTrend(
  userId: string,
  reason: FailureReason,
  days = 30
): Promise<{ date: string; count: number }[]> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('study_logs')
    .select('solved_at')
    .eq('user_id', userId)
    .eq('failure_reason', reason)
    .gte('solved_at', startDate.toISOString())
    .order('solved_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  const trendLogs = data as Array<{ solved_at: string }>;

  // Group by date
  const byDate: Record<string, number> = {};
  for (const log of trendLogs) {
    const date = log.solved_at.split('T')[0];
    byDate[date] = (byDate[date] || 0) + 1;
  }

  return Object.entries(byDate).map(([date, count]) => ({ date, count }));
}
