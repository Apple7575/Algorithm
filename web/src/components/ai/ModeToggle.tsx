'use client';

import type { AIMode } from '@algo-pt/shared';

interface ModeToggleProps {
  mode: AIMode;
  onModeChange: (mode: AIMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
      <span className="text-sm font-medium">Mode:</span>
      <div className="flex gap-2">
        <button
          onClick={() => onModeChange('flash')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'flash'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          ⚡ Flash
        </button>
        <button
          onClick={() => onModeChange('pro')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'pro'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          🎯 Pro
        </button>
      </div>
      <span className="text-xs text-muted-foreground ml-auto">
        {mode === 'flash' ? 'Quick answers, simpler analysis' : 'Detailed analysis, better quality'}
      </span>
    </div>
  );
}
