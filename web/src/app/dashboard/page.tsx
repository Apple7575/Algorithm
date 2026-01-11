import { createClient } from '@/lib/supabase/server';
import { TodaysRoutine } from '@/components/dashboard/TodaysRoutine';
import { StatsOverview } from '@/components/dashboard/StatsOverview';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch today's due reviews
  const today = new Date().toISOString().split('T')[0];
  const { data: dueReviews } = await supabase
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
    .lte('next_review_date', today)
    .order('next_review_date', { ascending: true })
    .limit(20);

  // Fetch recent logs for stats
  const { data: recentLogs } = await supabase
    .from('study_logs')
    .select('status, difficulty_rating, failure_reason, solved_at')
    .eq('user_id', user.id)
    .order('solved_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s your learning progress.</p>
      </div>

      <StatsOverview logs={recentLogs ?? []} />

      <TodaysRoutine reviews={dueReviews ?? []} />
    </div>
  );
}
