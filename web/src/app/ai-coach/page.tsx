'use client';

import { useState, useEffect } from 'react';
import { ModeToggle } from '@/components/ai/ModeToggle';
import { HintForm } from '@/components/ai/HintForm';
import { ReviewForm } from '@/components/ai/ReviewForm';
import { ResponseDisplay } from '@/components/ai/ResponseDisplay';
import { UsageDisplay } from '@/components/ai/UsageDisplay';
import type { AIMode, HintResponse, ReviewResponse } from '@algo-pt/shared';

type Tab = 'hint' | 'review';

interface Usage {
  flash: { used: number; limit: number; remaining: number };
  pro: { used: number; limit: number; remaining: number };
}

export default function AICoachPage() {
  const [activeTab, setActiveTab] = useState<Tab>('hint');
  const [mode, setMode] = useState<AIMode>('flash');
  const [response, setResponse] = useState<HintResponse | ReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);

  // Fetch initial usage
  useEffect(() => {
    fetchUsage();
  }, []);

  async function fetchUsage() {
    try {
      const res = await fetch('/api/ai/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch {
      // Ignore usage fetch errors
    }
  }

  async function handleHintSubmit(problemId: number, approach?: string) {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problemId,
          mode,
          current_approach: approach,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          setError(`Daily limit reached. Resets at ${new Date(data.reset_at).toLocaleTimeString()}`);
        } else {
          setError(data.error || 'Failed to get hint');
        }
        return;
      }

      const data: HintResponse = await res.json();
      setResponse(data);
      setUsage(prev =>
        prev
          ? {
              ...prev,
              flash: { ...prev.flash, remaining: data.remaining_requests.flash },
              pro: { ...prev.pro, remaining: data.remaining_requests.pro },
            }
          : null
      );
    } catch {
      setError('Failed to connect to AI service');
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewSubmit(problemId: number, code: string, language: string) {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problemId,
          code,
          language,
          mode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          setError(`Daily limit reached. Resets at ${new Date(data.reset_at).toLocaleTimeString()}`);
        } else {
          setError(data.error || 'Failed to get review');
        }
        return;
      }

      const data: ReviewResponse = await res.json();
      setResponse(data);
      setUsage(prev =>
        prev
          ? {
              ...prev,
              flash: { ...prev.flash, remaining: data.remaining_requests.flash },
              pro: { ...prev.pro, remaining: data.remaining_requests.pro },
            }
          : null
      );
    } catch {
      setError('Failed to connect to AI service');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Coach</h1>
        <p className="text-muted-foreground">
          Get hints and code reviews without spoiling the solution
        </p>
      </div>

      {/* Usage Display */}
      {usage && <UsageDisplay usage={usage} mode={mode} />}

      {/* Mode Toggle */}
      <ModeToggle mode={mode} onModeChange={setMode} />

      {/* Tab Selection */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('hint')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'hint'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Get Hint
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'review'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Code Review
        </button>
      </div>

      {/* Forms */}
      <div className="rounded-lg border bg-card p-6">
        {activeTab === 'hint' ? (
          <HintForm onSubmit={handleHintSubmit} loading={loading} />
        ) : (
          <ReviewForm onSubmit={handleReviewSubmit} loading={loading} />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">{error}</div>
      )}

      {/* Response */}
      {response && <ResponseDisplay response={response} type={activeTab} />}
    </div>
  );
}
