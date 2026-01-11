import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchUser,
  fetchUserSolvedProblems,
  fetchProblemMetadata,
} from '@/lib/solved-ac/client';
import { calculateInitialSM2 } from '@/lib/sm2/algorithm';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for large syncs

interface SyncResult {
  success: boolean;
  synced: number;
  skipped: number;
  failed: number;
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SyncResult>> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, synced: 0, skipped: 0, failed: 0, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get Baekjoon handle from request
  const body = await request.json();
  const { handle } = body as { handle: string };

  if (!handle || typeof handle !== 'string' || handle.trim().length === 0) {
    return NextResponse.json(
      { success: false, synced: 0, skipped: 0, failed: 0, message: 'Invalid handle' },
      { status: 400 }
    );
  }

  try {
    // Verify user exists on solved.ac
    const solvedUser = await fetchUser(handle.trim());
    if (!solvedUser) {
      return NextResponse.json(
        {
          success: false,
          synced: 0,
          skipped: 0,
          failed: 0,
          message: `User "${handle}" not found on solved.ac`,
        },
        { status: 404 }
      );
    }

    // Fetch all solved problems from solved.ac
    const solvedProblemIds = await fetchUserSolvedProblems(handle.trim());

    if (solvedProblemIds.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        skipped: 0,
        failed: 0,
        message: 'No solved problems found on solved.ac',
      });
    }

    // Get existing study logs for this user
    const { data: existingLogs } = await supabase
      .from('study_logs')
      .select('problem_id')
      .eq('user_id', user.id);

    const logs = (existingLogs ?? []) as Array<{ problem_id: number }>;
    const existingProblemIds = new Set(logs.map(p => p.problem_id));

    // Filter out already logged problems
    const newProblemIds = solvedProblemIds.filter(
      id => !existingProblemIds.has(id)
    );

    if (newProblemIds.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        skipped: solvedProblemIds.length,
        failed: 0,
        message: 'All problems already synced',
      });
    }

    // Process in batches
    const BATCH_SIZE = 20;
    let synced = 0;
    let failed = 0;

    for (let i = 0; i < newProblemIds.length; i += BATCH_SIZE) {
      const batchIds = newProblemIds.slice(i, i + BATCH_SIZE);

      // Fetch metadata from solved.ac
      const metadata = await fetchProblemMetadata(batchIds);
      const metadataMap = new Map(metadata.map(m => [m.problem_id, m]));

      // Upsert problems to cache table first
      const problemsToCache = batchIds.map(problemId => {
        const meta = metadataMap.get(problemId);
        return {
          problem_id: problemId,
          title: meta?.title ?? `Problem ${problemId}`,
          level: meta?.level ?? null,
          tags: meta?.tags ?? [],
          cached_at: new Date().toISOString(),
        };
      });

      // Upsert into problems cache (ignore conflicts)
      await supabase
        .from('problems')
        .upsert(problemsToCache as never[], { onConflict: 'problem_id', ignoreDuplicates: true });

      // Calculate SM-2 initial values for synced problems
      // Since they're already solved, use 'solved' status with 'normal' difficulty
      const sm2Result = calculateInitialSM2('normal', 'solved');

      // Prepare study_logs insert data
      const studyLogsData = batchIds.map(problemId => ({
        user_id: user.id,
        problem_id: problemId,
        status: 'solved' as const,
        difficulty_rating: 'normal' as const,
        failure_reason: null,
        duration_seconds: null, // Unknown for synced problems
        solved_at: new Date().toISOString(),
        // SM-2 values
        easiness_factor: sm2Result.easinessFactor,
        interval_days: sm2Result.intervalDays,
        repetitions: sm2Result.repetitions,
        next_review_date: sm2Result.nextReviewDate.toISOString().split('T')[0],
        synced_from_solved_ac: true,
      }));

      // Insert study logs
      const { error: insertError, data: insertedData } = await supabase
        .from('study_logs')
        .insert(studyLogsData as never[])
        .select('id');

      if (insertError) {
        console.error('Error inserting study logs:', insertError);
        failed += batchIds.length;
      } else {
        synced += insertedData?.length ?? 0;
      }

      // Rate limit between batches
      if (i + BATCH_SIZE < newProblemIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Update user's solved.ac handle in profile
    const profileData = {
      id: user.id,
      baekjoon_id: handle.trim(),
      solved_ac_tier: solvedUser.tier,
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert(profileData as never, { onConflict: 'id' });

    if (updateError) {
      console.error('Error updating profile:', updateError);
    }

    return NextResponse.json({
      success: true,
      synced,
      skipped: existingProblemIds.size,
      failed,
      message: `Successfully synced ${synced} problems from solved.ac`,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        synced: 0,
        skipped: 0,
        failed: 0,
        message: 'An error occurred during sync',
      },
      { status: 500 }
    );
  }
}
