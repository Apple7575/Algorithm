'use client';

import type { AIMode } from '@algo-pt/shared';

interface Usage {
  flash: { used: number; limit: number; remaining: number };
  pro: { used: number; limit: number; remaining: number };
}

interface UsageDisplayProps {
  usage: Usage;
  mode: AIMode;
}

export function UsageDisplay({ usage, mode }: UsageDisplayProps) {
  const currentUsage = usage[mode];
  const percentage = (currentUsage.used / currentUsage.limit) * 100;

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          Daily Usage ({mode === 'flash' ? 'Flash' : 'Pro'})
        </span>
        <span className="text-sm text-muted-foreground">
          {currentUsage.used} / {currentUsage.limit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            percentage > 80 ? 'bg-destructive' : percentage > 50 ? 'bg-yellow-500' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{currentUsage.remaining} requests remaining</span>
        <span>Resets at midnight</span>
      </div>
    </div>
  );
}
