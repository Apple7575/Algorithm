import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateInitialSM2 } from '@/lib/sm2/algorithm';
import type { DifficultyRating, FailureReason, StudyStatus } from '@algo-pt/shared';

interface CreateStudyLogBody {
  problem_id: number;
  status: StudyStatus;
  duration_seconds?: number;
  difficulty_rating?: DifficultyRating;
  failure_reason?: FailureReason;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: CreateStudyLogBody = await request.json();

    // Validate required fields
    if (!body.problem_id || !body.status) {
      return NextResponse.json(
        { error: 'problem_id and status are required' },
        { status: 400 }
      );
    }

    // Calculate initial SM-2 values
    const sm2Result = calculateInitialSM2(
      body.difficulty_rating ?? null,
      body.status as 'solved' | 'failed'
    );

    // Create study log with SM-2 values
    const insertData = {
      user_id: user.id,
      problem_id: body.problem_id,
      status: body.status,
      duration_seconds: body.duration_seconds ?? null,
      difficulty_rating: body.difficulty_rating ?? null,
      failure_reason: body.failure_reason ?? null,
      next_review_date: sm2Result.nextReviewDate.toISOString().split('T')[0],
      easiness_factor: sm2Result.easinessFactor,
      interval_days: sm2Result.intervalDays,
      repetitions: sm2Result.repetitions,
    };

    const { data, error } = await supabase
      .from('study_logs')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating study log:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/study-logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const dueOnly = searchParams.get('due') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let query = supabase
    .from('study_logs')
    .select(
      `
      *,
      problems (
        problem_id,
        title,
        level,
        tags
      )
    `
    )
    .eq('user_id', user.id)
    .order('solved_at', { ascending: false })
    .limit(limit);

  if (dueOnly) {
    const today = new Date().toISOString().split('T')[0];
    query = query.lte('next_review_date', today);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
