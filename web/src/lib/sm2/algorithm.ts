/**
 * SM-2 Algorithm Implementation
 * Based on SuperMemo SM-2 spaced repetition algorithm
 *
 * Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * Time Complexity: O(1) - all operations are constant time
 * Space Complexity: O(1) - no additional data structures
 */

import type { DifficultyRating } from '@algo-pt/shared';

export interface SM2State {
  easinessFactor: number; // EF: 1.3 ~ 2.5+
  intervalDays: number; // Days until next review
  repetitions: number; // Consecutive successful reviews
}

export interface SM2UpdateResult extends SM2State {
  nextReviewDate: Date;
  status: 'solved' | 'review_needed';
}

/**
 * Quality rating based on difficulty:
 * - 5: Perfect response (Easy)
 * - 4: Correct with some hesitation (Normal)
 * - 3: Correct but with difficulty (Hard)
 * - 2: Incorrect but remembered (Failed - remembered algo)
 * - 1: Incorrect (Failed - wrong approach)
 * - 0: Complete blackout (Failed - no idea)
 */
export function difficultyToQuality(
  difficulty: DifficultyRating | null,
  status: 'solved' | 'failed'
): number {
  if (status === 'failed') {
    return 2; // Failed responses reset interval
  }

  switch (difficulty) {
    case 'easy':
      return 5;
    case 'normal':
      return 4;
    case 'hard':
      return 3;
    default:
      return 4; // Default to normal if not specified
  }
}

/**
 * Calculate new SM-2 state after a review
 *
 * @param state - Current SM-2 state
 * @param quality - Quality of response (0-5)
 * @returns New SM-2 state with next review date
 */
export function updateSM2(state: SM2State, quality: number): SM2UpdateResult {
  let { easinessFactor, intervalDays, repetitions } = state;

  // Clamp quality to valid range
  quality = Math.max(0, Math.min(5, quality));

  if (quality < 3) {
    // Failed response: reset to beginning
    repetitions = 0;
    intervalDays = 1;
  } else {
    // Successful response: advance
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easinessFactor);
    }
    repetitions += 1;
  }

  // Update easiness factor using SM-2 formula
  // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // EF must be at least 1.3
  easinessFactor = Math.max(1.3, easinessFactor);

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  // Determine status
  const status = quality < 3 ? 'review_needed' : 'solved';

  return {
    easinessFactor,
    intervalDays,
    repetitions,
    nextReviewDate,
    status,
  };
}

/**
 * Create initial SM-2 state for a new problem
 */
export function createInitialSM2State(): SM2State {
  return {
    easinessFactor: 2.5, // Default EF
    intervalDays: 0,
    repetitions: 0,
  };
}

/**
 * Calculate SM-2 values for a newly solved/failed problem
 *
 * @param difficulty - Perceived difficulty rating
 * @param status - Whether problem was solved or failed
 * @returns SM-2 result with calculated values
 */
export function calculateInitialSM2(
  difficulty: DifficultyRating | null,
  status: 'solved' | 'failed'
): SM2UpdateResult {
  const quality = difficultyToQuality(difficulty, status);
  const initialState = createInitialSM2State();
  return updateSM2(initialState, quality);
}

/**
 * Format next review date for display
 */
export function formatNextReview(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewDate = new Date(date);
  reviewDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays < 7) return `In ${diffDays} days`;

  return reviewDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Check if a problem is due for review
 */
export function isDueForReview(nextReviewDate: string | Date | null): boolean {
  if (!nextReviewDate) return false;

  const reviewDate = new Date(nextReviewDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return reviewDate <= today;
}

/**
 * Calculate days until next review (negative if overdue)
 */
export function daysUntilReview(nextReviewDate: string | Date | null): number | null {
  if (!nextReviewDate) return null;

  const reviewDate = new Date(nextReviewDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  reviewDate.setHours(0, 0, 0, 0);

  return Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
