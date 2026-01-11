import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSM2, difficultyToQuality } from '@/lib/sm2/algorithm';
import type { DifficultyRating } from '@algo-pt/shared';

interface ReviewBody {
  difficulty_rating: DifficultyRating;
  status: 'solved' | 'failed';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Check auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: ReviewBody = await request.json();

    // Fetch existing study log
    const { data: existingLog, error: fetchError } = await supabase
      .from('study_logs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingLog) {
      return NextResponse.json({ error: 'Study log not found' }, { status: 404 });
    }

    // Calculate new SM-2 values
    const quality = difficultyToQuality(body.difficulty_rating, body.status);
    const sm2Result = updateSM2(
      {
        easinessFactor: existingLog.easiness_factor,
        intervalDays: existingLog.interval_days,
        repetitions: existingLog.repetitions,
      },
      quality
    );

    // Update the study log
    const { data, error } = await supabase
      .from('study_logs')
      .update({
        status: sm2Result.status,
        difficulty_rating: body.difficulty_rating,
        next_review_date: sm2Result.nextReviewDate.toISOString().split('T')[0],
        easiness_factor: sm2Result.easinessFactor,
        interval_days: sm2Result.intervalDays,
        repetitions: sm2Result.repetitions,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating study log:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/study-logs/[id]/review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
