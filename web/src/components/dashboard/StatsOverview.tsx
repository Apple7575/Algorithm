'use client';

import type { Database } from '@/lib/supabase/database.types';

type StudyLog = Database['public']['Tables']['study_logs']['Row'];

interface StatsOverviewProps {
  logs: Pick<StudyLog, 'status' | 'difficulty_rating' | 'failure_reason' | 'solved_at'>[];
}

export function StatsOverview({ logs }: StatsOverviewProps) {
  // Calculate stats from recent logs
  const solvedCount = logs.filter(l => l.status === 'solved').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;
  const totalCount = logs.length;
  const solveRate = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  // Calculate this week's activity
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekLogs = logs.filter(l => new Date(l.solved_at) >= oneWeekAgo);
  const thisWeekCount = thisWeekLogs.length;

  // Calculate streak (simplified - just count consecutive days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const checkDate = new Date(today);

  for (let i = 0; i < 30; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasActivity = logs.some(l => l.solved_at.startsWith(dateStr));

    if (hasActivity) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      // Allow missing today
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="This Week"
        value={thisWeekCount}
        subtitle="problems solved"
        icon="📊"
      />
      <StatCard
        title="Solve Rate"
        value={`${solveRate}%`}
        subtitle={`${solvedCount}/${totalCount} solved`}
        icon="🎯"
      />
      <StatCard title="Current Streak" value={streak} subtitle="days" icon="🔥" />
      <StatCard title="Total Solved" value={solvedCount} subtitle="problems" icon="✅" />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
}

function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}
