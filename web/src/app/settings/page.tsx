'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface SyncResult {
  success: boolean;
  synced: number;
  skipped: number;
  failed: number;
  message: string;
}

export default function SettingsPage() {
  const [baekjoonId, setBaekjoonId] = useState('');
  const [savedBaekjoonId, setSavedBaekjoonId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('baekjoon_id')
          .eq('id', user.id)
          .single();

        const p = profile as { baekjoon_id: string | null } | null;
        if (p?.baekjoon_id) {
          setBaekjoonId(p.baekjoon_id);
          setSavedBaekjoonId(p.baekjoon_id);
        }
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSync() {
    if (!baekjoonId.trim()) return;

    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/sync/solved-ac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: baekjoonId.trim() }),
      });

      const result: SyncResult = await response.json();
      setSyncResult(result);

      if (result.success) {
        setSavedBaekjoonId(baekjoonId.trim());
      }
    } catch (error) {
      setSyncResult({
        success: false,
        synced: 0,
        skipped: 0,
        failed: 0,
        message: 'Network error occurred',
      });
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold">
            Algo-PT
          </Link>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/ai-coach" className="text-muted-foreground hover:text-foreground">
              AI Coach
            </Link>
            <Link href="/settings" className="text-foreground font-medium">
              Settings
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        <section className="rounded-lg border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Solved.ac Sync</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Sync your solved problems from Baekjoon Online Judge via solved.ac.
              This will import your solve history and calculate initial review schedules.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="baekjoonId" className="block text-sm font-medium mb-2">
                Baekjoon ID
              </label>
              <div className="flex gap-2">
                <input
                  id="baekjoonId"
                  type="text"
                  value={baekjoonId}
                  onChange={e => setBaekjoonId(e.target.value)}
                  placeholder="Enter your Baekjoon username"
                  className="flex-1 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSync}
                  disabled={syncing || !baekjoonId.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                >
                  {syncing ? 'Syncing...' : 'Sync'}
                </button>
              </div>
              {savedBaekjoonId && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Last synced: {savedBaekjoonId}
                </p>
              )}
            </div>

            {syncing && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                <div className="text-sm">
                  Fetching solved problems from solved.ac...
                  <br />
                  <span className="text-muted-foreground">
                    This may take a while for many problems.
                  </span>
                </div>
              </div>
            )}

            {syncResult && (
              <div
                className={`p-4 rounded-lg ${
                  syncResult.success
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-destructive/10 border border-destructive/30'
                }`}
              >
                <div className="font-medium mb-2">
                  {syncResult.success ? 'Sync Complete' : 'Sync Failed'}
                </div>
                <p className="text-sm mb-3">{syncResult.message}</p>
                {syncResult.success && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-2 bg-background/50 rounded">
                      <div className="text-lg font-bold text-green-600">{syncResult.synced}</div>
                      <div className="text-xs text-muted-foreground">New Problems</div>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded">
                      <div className="text-lg font-bold text-yellow-600">{syncResult.skipped}</div>
                      <div className="text-xs text-muted-foreground">Already Synced</div>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded">
                      <div className="text-lg font-bold text-red-600">{syncResult.failed}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">About Algo-PT</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Algo-PT is an AI-powered personalized algorithm training system that helps you
              master algorithmic problem-solving through spaced repetition and intelligent
              recommendations.
            </p>
            <ul className="list-disc list-inside space-y-1 mt-4">
              <li>Chrome Extension for automatic problem tracking</li>
              <li>SM-2 spaced repetition for efficient review</li>
              <li>Weakness-based problem recommendations</li>
              <li>AI-powered hints and code review</li>
              <li>Solved.ac integration for syncing history</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
