/**
 * Problem Recommendation Algorithm
 * Recommends problems based on user weaknesses
 */

import type { FailureReason } from '@algo-pt/shared';

export interface RecommendedProblem {
  problemId: number;
  title: string;
  level: number;
  tags: string[];
  reason: string;
  targetWeakness: FailureReason;
}

// Tags associated with each weakness type
const WEAKNESS_TAG_MAPPING: Record<FailureReason, string[]> = {
  algo: ['dp', 'greedy', 'graphs', 'trees', 'binary_search', 'sorting'],
  impl: ['implementation', 'simulation', 'string', 'brute_force'],
  time: ['dp', 'binary_search', 'two_pointers', 'sliding_window', 'segment_tree'],
  edge: ['implementation', 'math', 'case_work', 'string'],
};

// Recommended level range based on user level (Solved.ac levels 0-30)
function getRecommendedLevelRange(
  userLevel: number,
  weaknessStrength: 'weak' | 'moderate' | 'strong'
): { min: number; max: number } {
  // For weak areas, suggest easier problems
  // For strong areas, suggest harder problems
  const adjustment =
    weaknessStrength === 'weak' ? -2 : weaknessStrength === 'moderate' ? 0 : 2;

  return {
    min: Math.max(1, userLevel - 3 + adjustment),
    max: Math.min(30, userLevel + 2 + adjustment),
  };
}

/**
 * Generate recommendation reason text
 */
export function getRecommendationReason(weakness: FailureReason, tag: string): string {
  const weaknessLabels: Record<FailureReason, string> = {
    algo: 'algorithm selection',
    impl: 'implementation',
    time: 'time complexity',
    edge: 'edge case handling',
  };

  return `Practice ${tag} to improve your ${weaknessLabels[weakness]} skills`;
}

/**
 * Get relevant tags for a weakness
 */
export function getTagsForWeakness(weakness: FailureReason): string[] {
  return WEAKNESS_TAG_MAPPING[weakness] || [];
}

/**
 * Score a problem's relevance for a user's weakness
 */
export function scoreProblemRelevance(
  problemTags: string[],
  weakness: FailureReason
): number {
  const relevantTags = WEAKNESS_TAG_MAPPING[weakness];
  const matchingTags = problemTags.filter(tag =>
    relevantTags.some(rt => tag.toLowerCase().includes(rt.toLowerCase()))
  );

  return matchingTags.length;
}

/**
 * Filter and rank problems for recommendations
 */
export function rankProblemsForWeakness(
  problems: Array<{
    problem_id: number;
    title: string;
    level: number | null;
    tags: string[];
  }>,
  weakness: FailureReason,
  solvedProblemIds: Set<number>,
  limit = 5
): RecommendedProblem[] {
  return problems
    .filter(p => !solvedProblemIds.has(p.problem_id)) // Exclude solved
    .map(p => ({
      problemId: p.problem_id,
      title: p.title,
      level: p.level ?? 0,
      tags: p.tags,
      score: scoreProblemRelevance(p.tags, weakness),
      targetWeakness: weakness,
      reason: getRecommendationReason(
        weakness,
        p.tags.find(t =>
          WEAKNESS_TAG_MAPPING[weakness].some(wt =>
            t.toLowerCase().includes(wt.toLowerCase())
          )
        ) || 'this problem type'
      ),
    }))
    .filter(p => p.score > 0) // Only include relevant problems
    .sort((a, b) => b.score - a.score) // Sort by relevance
    .slice(0, limit);
}
