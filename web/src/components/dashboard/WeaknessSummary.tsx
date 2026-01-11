'use client';

import type { FailureReason } from '@algo-pt/shared';

export interface WeaknessScore {
  reason: FailureReason;
  count: number;
  percentage: number;
  label: string;
  description: string;
}

interface WeaknessSummaryProps {
  weaknesses: WeaknessScore[];
}

const REASON_ICONS: Record<FailureReason, string> = {
  algo: '🧠',
  impl: '💻',
  time: '⏱️',
  edge: '🔍',
};

const REASON_COLORS: Record<FailureReason, string> = {
  algo: 'bg-purple-100 text-purple-800',
  impl: 'bg-blue-100 text-blue-800',
  time: 'bg-orange-100 text-orange-800',
  edge: 'bg-green-100 text-green-800',
};

export function WeaknessSummary({ weaknesses }: WeaknessSummaryProps) {
  const totalFailures = weaknesses.reduce((sum, w) => sum + w.count, 0);

  if (totalFailures === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Weakness Analysis</h2>
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-4xl mb-2">📊</p>
          <p>No failure data yet.</p>
          <p className="text-sm mt-1">Solve some problems to see your weakness analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">
        Weakness Analysis
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          ({totalFailures} failures analyzed)
        </span>
      </h2>

      <div className="space-y-4">
        {weaknesses
          .filter(w => w.count > 0)
          .map(weakness => (
            <div key={weakness.reason} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${REASON_COLORS[weakness.reason]}`}
                  >
                    {REASON_ICONS[weakness.reason]} {weakness.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {weakness.count} times ({weakness.percentage}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${weakness.percentage}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground">{weakness.description}</p>
            </div>
          ))}
      </div>

      {weaknesses[0] && weaknesses[0].count > 2 && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm">
            <strong>Tip:</strong> Focus on practicing{' '}
            <span className="font-medium">{weaknesses[0].label.toLowerCase()}</span> problems to
            improve your weak points.
          </p>
        </div>
      )}
    </div>
  );
}
