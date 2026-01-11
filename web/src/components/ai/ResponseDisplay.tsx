'use client';

import type { HintResponse, ReviewResponse } from '@algo-pt/shared';

interface ResponseDisplayProps {
  response: HintResponse | ReviewResponse;
  type: 'hint' | 'review';
}

export function ResponseDisplay({ response, type }: ResponseDisplayProps) {
  const content = type === 'hint' ? (response as HintResponse).hint : (response as ReviewResponse).review;

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          {type === 'hint' ? '💡 Hint' : '📝 Code Review'}
        </h3>
        <span className="text-xs px-2 py-1 bg-muted rounded">
          {response.mode_used === 'flash' ? '⚡ Flash' : '🎯 Pro'}
        </span>
      </div>

      <div className="prose prose-sm max-w-none dark:prose-invert">
        <div className="whitespace-pre-wrap">{content}</div>
      </div>

      {type === 'review' && 'complexity_analysis' in response && response.complexity_analysis && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Complexity Analysis</h4>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Time:</span>{' '}
              <code className="px-1 py-0.5 bg-muted rounded">
                {response.complexity_analysis.time}
              </code>
            </div>
            <div>
              <span className="text-muted-foreground">Space:</span>{' '}
              <code className="px-1 py-0.5 bg-muted rounded">
                {response.complexity_analysis.space}
              </code>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        Remaining requests: Flash {response.remaining_requests.flash} / Pro{' '}
        {response.remaining_requests.pro}
      </div>
    </div>
  );
}
