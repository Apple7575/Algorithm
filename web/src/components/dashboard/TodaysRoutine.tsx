'use client';

import { ProblemCard } from './ProblemCard';
import type { Database } from '@/lib/supabase/database.types';

type StudyLogWithProblem = Database['public']['Tables']['study_logs']['Row'] & {
  problems: Database['public']['Tables']['problems']['Row'] | null;
};

interface TodaysRoutineProps {
  reviews: StudyLogWithProblem[];
}

export function TodaysRoutine({ reviews }: TodaysRoutineProps) {
  const overdueReviews = reviews.filter(r => {
    if (!r.next_review_date) return false;
    const reviewDate = new Date(r.next_review_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reviewDate < today;
  });

  const todayReviews = reviews.filter(r => {
    if (!r.next_review_date) return false;
    const reviewDate = new Date(r.next_review_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    reviewDate.setHours(0, 0, 0, 0);
    return reviewDate.getTime() === today.getTime();
  });

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Today&apos;s Routine</h2>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-4xl mb-2">🎉</p>
          <p>No reviews due today!</p>
          <p className="text-sm mt-1">Keep solving new problems to build your review queue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">
        Today&apos;s Routine
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          ({reviews.length} problem{reviews.length !== 1 ? 's' : ''})
        </span>
      </h2>

      {overdueReviews.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive"></span>
            Overdue ({overdueReviews.length})
          </h3>
          <div className="space-y-3">
            {overdueReviews.map(review => (
              <ProblemCard key={review.id} review={review} isOverdue />
            ))}
          </div>
        </div>
      )}

      {todayReviews.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Due Today ({todayReviews.length})
          </h3>
          <div className="space-y-3">
            {todayReviews.map(review => (
              <ProblemCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
