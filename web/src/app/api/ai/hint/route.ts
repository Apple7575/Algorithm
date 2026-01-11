import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContent } from '@/lib/gemini/client';
import { HINT_SYSTEM_INSTRUCTION, generateHintPrompt } from '@/lib/gemini/prompts';
import { canMakeRequest, incrementUsage, getUsage } from '@/lib/gemini/usage';
import type { AIMode, HintRequest, HintResponse, RateLimitError } from '@algo-pt/shared';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: HintRequest = await request.json();
    const { problem_id, mode, current_approach } = body;

    if (!problem_id || !mode) {
      return NextResponse.json(
        { error: 'problem_id and mode are required' },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateCheck = await canMakeRequest(user.id, mode);
    if (!rateCheck.allowed) {
      const errorResponse: RateLimitError = {
        error: 'Daily limit exceeded',
        limit: mode === 'flash' ? 50 : 10,
        reset_at: rateCheck.resetAt,
      };
      return NextResponse.json(errorResponse, { status: 429 });
    }

    // Fetch problem info for context
    const { data: problem } = await supabase
      .from('problems')
      .select('title, level, tags')
      .eq('problem_id', problem_id)
      .single();

    const problemDescription = problem
      ? `Problem #${problem_id}: ${problem.title}\nDifficulty: Level ${problem.level}\nTags: ${problem.tags?.join(', ') || 'Unknown'}`
      : `Problem #${problem_id}`;

    // Generate hint
    const prompt = generateHintPrompt(problemDescription, current_approach, mode);
    const response = await generateContent(prompt, mode, HINT_SYSTEM_INSTRUCTION);

    // Increment usage
    await incrementUsage(user.id, mode);

    // Get updated usage
    const usage = await getUsage(user.id);

    const hintResponse: HintResponse = {
      hint: response.text,
      mode_used: mode,
      remaining_requests: {
        flash: usage.flash.remaining,
        pro: usage.pro.remaining,
      },
    };

    return NextResponse.json(hintResponse);
  } catch (error) {
    console.error('Error in POST /api/ai/hint:', error);
    return NextResponse.json({ error: 'Failed to generate hint' }, { status: 500 });
  }
}
