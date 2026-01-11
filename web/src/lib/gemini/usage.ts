/**
 * AI Usage Tracking and Rate Limiting
 */

import { createClient } from '@/lib/supabase/server';
import type { AIMode } from '@algo-pt/shared';

// Daily limits
const DAILY_LIMITS: Record<AIMode, number> = {
  flash: 50,
  pro: 10,
};

export interface UsageStatus {
  flash: { used: number; limit: number; remaining: number };
  pro: { used: number; limit: number; remaining: number };
  resetAt: string; // Next midnight
}

/**
 * Get current usage for a user
 */
export async function getUsage(userId: string): Promise<UsageStatus> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('ai_usage')
    .select('flash_count, pro_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const usageData = data as { flash_count: number; pro_count: number } | null;
  const flashUsed = usageData?.flash_count ?? 0;
  const proUsed = usageData?.pro_count ?? 0;

  // Calculate next midnight
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return {
    flash: {
      used: flashUsed,
      limit: DAILY_LIMITS.flash,
      remaining: DAILY_LIMITS.flash - flashUsed,
    },
    pro: {
      used: proUsed,
      limit: DAILY_LIMITS.pro,
      remaining: DAILY_LIMITS.pro - proUsed,
    },
    resetAt: tomorrow.toISOString(),
  };
}

/**
 * Check if user can make a request
 */
export async function canMakeRequest(
  userId: string,
  mode: AIMode
): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const usage = await getUsage(userId);
  const modeUsage = usage[mode];

  return {
    allowed: modeUsage.remaining > 0,
    remaining: modeUsage.remaining,
    resetAt: usage.resetAt,
  };
}

/**
 * Increment usage counter
 */
export async function incrementUsage(userId: string, mode: AIMode): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Try to update existing record
  const { data: existing } = await supabase
    .from('ai_usage')
    .select('id, flash_count, pro_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const existingData = existing as { id: string; flash_count: number; pro_count: number } | null;

  if (existingData) {
    // Update existing
    const updateField = mode === 'flash' ? 'flash_count' : 'pro_count';
    const currentCount = mode === 'flash' ? existingData.flash_count : existingData.pro_count;

    await supabase
      .from('ai_usage')
      .update({ [updateField]: currentCount + 1 } as never)
      .eq('id', existingData.id);
  } else {
    // Create new
    const insertData = {
      user_id: userId,
      date: today,
      flash_count: mode === 'flash' ? 1 : 0,
      pro_count: mode === 'pro' ? 1 : 0,
    };
    await supabase.from('ai_usage').insert(insertData as never);
  }
}

/**
 * Get daily limit for a mode
 */
export function getDailyLimit(mode: AIMode): number {
  return DAILY_LIMITS[mode];
}
