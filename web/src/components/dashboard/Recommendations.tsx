'use client';

import Link from 'next/link';
import type { FailureReason } from '@algo-pt/shared';

export interface RecommendedProblem {
  problemId: number;
  title: string;
  level: number;
  tags: string[];
  reason: string;
  targetWeakness: FailureReason;
}

interface RecommendationsProps {
  recommendations: RecommendedProblem[];
}

const WEAKNESS_LABELS: Record<FailureReason, string> = {
  algo: 'Algorithm',
  impl: 'Implementation',
  time: 'Time Complexity',
  edge: 'Edge Cases',
};

const WEAKNESS_COLORS: Record<FailureReason, string> = {
  algo: 'bg-purple-100 text-purple-700',
  impl: 'bg-blue-100 text-blue-700',
  time: 'bg-orange-100 text-orange-700',
  edge: 'bg-green-100 text-green-700',
};

export function Recommendations({ recommendations }: RecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Recommended Problems</h2>
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-4xl mb-2">💡</p>
          <p>No recommendations yet.</p>
          <p className="text-sm mt-1">
            Solve more problems and tag your failures to get personalized recommendations.
          </p>
        </div>
      </div>
    );
  }

  // Group by weakness
  const byWeakness = recommendations.reduce(
    (acc, rec) => {
      if (!acc[rec.targetWeakness]) {
        acc[rec.targetWeakness] = [];
      }
      acc[rec.targetWeakness].push(rec);
      return acc;
    },
    {} as Record<FailureReason, RecommendedProblem[]>
  );

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">
        Recommended Problems
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          Based on your weaknesses
        </span>
      </h2>

      <div className="space-y-6">
        {Object.entries(byWeakness).map(([weakness, problems]) => (
          <div key={weakness}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${WEAKNESS_COLORS[weakness as FailureReason]}`}
              >
                {WEAKNESS_LABELS[weakness as FailureReason]}
              </span>
              <span className="text-sm text-muted-foreground">
                {problems.length} problem{problems.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {problems.map(problem => (
                <div
                  key={problem.problemId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-muted-foreground">#{problem.problemId}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-background rounded">
                        Lv.{problem.level}
                      </span>
                    </div>
                    <h4 className="font-medium truncate">{problem.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{problem.reason}</p>
                  </div>

                  <Link
                    href={`https://www.acmicpc.net/problem/${problem.problemId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 shrink-0"
                  >
                    Solve
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
