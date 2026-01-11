'use client';

import Link from 'next/link';
import type { Database } from '@/lib/supabase/database.types';
import { formatNextReview, daysUntilReview } from '@/lib/sm2/algorithm';

type StudyLogWithProblem = Database['public']['Tables']['study_logs']['Row'] & {
  problems: Database['public']['Tables']['problems']['Row'] | null;
};

interface ProblemCardProps {
  review: StudyLogWithProblem;
  isOverdue?: boolean;
}

const levelColors: Record<number, string> = {
  0: 'bg-gray-100 text-gray-800', // Unrated
  1: 'bg-amber-900 text-amber-100', // Bronze V
  2: 'bg-amber-900 text-amber-100',
  3: 'bg-amber-900 text-amber-100',
  4: 'bg-amber-900 text-amber-100',
  5: 'bg-amber-900 text-amber-100', // Bronze I
  6: 'bg-gray-400 text-gray-900', // Silver V
  7: 'bg-gray-400 text-gray-900',
  8: 'bg-gray-400 text-gray-900',
  9: 'bg-gray-400 text-gray-900',
  10: 'bg-gray-400 text-gray-900', // Silver I
  11: 'bg-yellow-500 text-yellow-900', // Gold V
  12: 'bg-yellow-500 text-yellow-900',
  13: 'bg-yellow-500 text-yellow-900',
  14: 'bg-yellow-500 text-yellow-900',
  15: 'bg-yellow-500 text-yellow-900', // Gold I
  16: 'bg-cyan-500 text-cyan-900', // Platinum V
  17: 'bg-cyan-500 text-cyan-900',
  18: 'bg-cyan-500 text-cyan-900',
  19: 'bg-cyan-500 text-cyan-900',
  20: 'bg-cyan-500 text-cyan-900', // Platinum I
  21: 'bg-rose-500 text-white', // Diamond V
  22: 'bg-rose-500 text-white',
  23: 'bg-rose-500 text-white',
  24: 'bg-rose-500 text-white',
  25: 'bg-rose-500 text-white', // Diamond I
  26: 'bg-red-700 text-white', // Ruby V
  27: 'bg-red-700 text-white',
  28: 'bg-red-700 text-white',
  29: 'bg-red-700 text-white',
  30: 'bg-red-700 text-white', // Ruby I
};

function getLevelBadge(level: number | null): { text: string; className: string } {
  if (level === null || level === 0) {
    return { text: 'Unrated', className: levelColors[0] };
  }

  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ruby'];
  const tierIndex = Math.floor((level - 1) / 5);
  const tierLevel = 5 - ((level - 1) % 5);
  const tierName = tiers[tierIndex] || 'Unknown';

  return {
    text: `${tierName} ${tierLevel}`,
    className: levelColors[level] || levelColors[0],
  };
}

export function ProblemCard({ review, isOverdue = false }: ProblemCardProps) {
  const problem = review.problems;
  const level = getLevelBadge(problem?.level ?? null);
  const daysUntil = daysUntilReview(review.next_review_date);

  return (
    <div
      className={`p-4 rounded-lg border ${isOverdue ? 'border-destructive/50 bg-destructive/5' : 'bg-background'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${level.className}`}>
              {level.text}
            </span>
            <span className="text-sm text-muted-foreground">#{review.problem_id}</span>
          </div>

          <h3 className="font-medium truncate">
            {problem?.title || `Problem ${review.problem_id}`}
          </h3>

          {problem?.tags && problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {problem.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded"
                >
                  {tag}
                </span>
              ))}
              {problem.tags.length > 3 && (
                <span className="px-1.5 py-0.5 text-xs text-muted-foreground">
                  +{problem.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className={`text-sm font-medium ${isOverdue ? 'text-destructive' : ''}`}>
              {review.next_review_date && formatNextReview(new Date(review.next_review_date))}
            </div>
            <div className="text-xs text-muted-foreground">
              EF: {review.easiness_factor.toFixed(2)} • Rep: {review.repetitions}
            </div>
          </div>

          <Link
            href={`https://www.acmicpc.net/problem/${review.problem_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Solve
          </Link>
        </div>
      </div>
    </div>
  );
}
