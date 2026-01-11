import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchProblemMetadata } from '@/lib/solved-ac/client';

interface BatchRequest {
  problem_ids: number[];
}

interface CachedProblem {
  problem_id: number;
  title: string;
  level: number | null;
  tags: string[];
  cached_at: string;
}

const MAX_BATCH_SIZE = 100;
const CACHE_EXPIRY_DAYS = 7;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body: BatchRequest = await request.json();
    const problemIds = body.problem_ids?.slice(0, MAX_BATCH_SIZE) ?? [];

    if (problemIds.length === 0) {
      return NextResponse.json({ error: 'problem_ids is required' }, { status: 400 });
    }

    // Fetch existing problems from cache
    const { data: cached, error } = await supabase
      .from('problems')
      .select('*')
      .in('problem_id', problemIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const cachedData = (cached ?? []) as CachedProblem[];

    // Determine which need refresh
    const now = new Date();
    const expiryDate = new Date(now.getTime() - CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const cachedMap = new Map(cachedData.map(p => [p.problem_id, p]));
    const needsRefresh: number[] = [];
    const results: CachedProblem[] = [];

    for (const id of problemIds) {
      const cachedProblem = cachedMap.get(id);

      if (cachedProblem) {
        const cachedAt = new Date(cachedProblem.cached_at);
        if (cachedAt < expiryDate) {
          needsRefresh.push(id);
        }
        results.push(cachedProblem);
      } else {
        needsRefresh.push(id);
      }
    }

    // Fetch missing/stale from Solved.ac
    if (needsRefresh.length > 0) {
      const freshData = await fetchProblemMetadata(needsRefresh);

      // Upsert fresh data
      if (freshData.length > 0) {
        const upsertData = freshData.map(p => ({
          problem_id: p.problem_id,
          title: p.title,
          level: p.level,
          tags: p.tags,
          cached_at: new Date().toISOString(),
        }));

        const { error: upsertError } = await supabase
          .from('problems')
          .upsert(upsertData as never[], { onConflict: 'problem_id' });

        if (upsertError) {
          console.error('Error upserting problems:', upsertError);
        }

        // Update results with fresh data
        for (const fresh of freshData) {
          const idx = results.findIndex(r => r.problem_id === fresh.problem_id);
          if (idx >= 0) {
            results[idx] = {
              ...fresh,
              cached_at: new Date().toISOString(),
            };
          } else {
            results.push({
              ...fresh,
              cached_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in POST /api/problems/batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
