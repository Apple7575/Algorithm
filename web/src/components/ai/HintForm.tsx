'use client';

import { useState } from 'react';

interface HintFormProps {
  onSubmit: (problemId: number, approach?: string) => void;
  loading: boolean;
}

export function HintForm({ onSubmit, loading }: HintFormProps) {
  const [problemId, setProblemId] = useState('');
  const [approach, setApproach] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(problemId, 10);
    if (isNaN(id)) return;
    onSubmit(id, approach || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="problemId" className="block text-sm font-medium mb-2">
          Problem Number
        </label>
        <input
          id="problemId"
          type="number"
          value={problemId}
          onChange={e => setProblemId(e.target.value)}
          placeholder="e.g., 1000"
          required
          className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">Enter the Baekjoon problem number</p>
      </div>

      <div>
        <label htmlFor="approach" className="block text-sm font-medium mb-2">
          Your Current Approach (Optional)
        </label>
        <textarea
          id="approach"
          value={approach}
          onChange={e => setApproach(e.target.value)}
          placeholder="Describe what you've tried or what you're thinking..."
          rows={4}
          className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Sharing your approach helps get more relevant hints
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !problemId}
        className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Getting hint...' : 'Get Hint'}
      </button>
    </form>
  );
}
