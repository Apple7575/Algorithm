import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContent } from '@/lib/gemini/client';
import { CODE_REVIEW_SYSTEM_INSTRUCTION, generateReviewPrompt } from '@/lib/gemini/prompts';
import { canMakeRequest, incrementUsage, getUsage } from '@/lib/gemini/usage';
import type { ReviewRequest, ReviewResponse, RateLimitError, CodeIssue } from '@algo-pt/shared';

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
    const body: ReviewRequest = await request.json();
    const { problem_id, code, language = 'python', mode } = body;

    if (!problem_id || !code || !mode) {
      return NextResponse.json(
        { error: 'problem_id, code, and mode are required' },
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

    // Generate review
    const prompt = generateReviewPrompt(problemDescription, code, language, mode);
    const response = await generateContent(prompt, mode, CODE_REVIEW_SYSTEM_INSTRUCTION);

    // Increment usage
    await incrementUsage(user.id, mode);

    // Get updated usage
    const usage = await getUsage(user.id);

    // Parse issues from response (simplified - in production, use structured output)
    const issues: CodeIssue[] = [];
    const reviewText = response.text;

    // Simple heuristic to extract complexity if mentioned
    const timeMatch = reviewText.match(/O\([^)]+\)/);
    const complexityAnalysis = timeMatch
      ? {
          time: timeMatch[0],
          space: 'O(n)', // Default, would need better parsing
        }
      : undefined;

    const reviewResponse: ReviewResponse = {
      review: reviewText,
      issues,
      complexity_analysis: complexityAnalysis,
      remaining_requests: {
        flash: usage.flash.remaining,
        pro: usage.pro.remaining,
      },
    };

    return NextResponse.json(reviewResponse);
  } catch (error) {
    console.error('Error in POST /api/ai/review:', error);
    return NextResponse.json({ error: 'Failed to generate review' }, { status: 500 });
  }
}
