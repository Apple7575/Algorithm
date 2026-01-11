/**
 * Offline Queue for Failed Submissions
 * Stores submissions locally when network fails, retries later
 */

import { getSessionStorage, setSessionStorage } from './index';
import type { ProblemSolvedMessage } from '@algo-pt/shared';

export type QueuedSubmission = ProblemSolvedMessage['payload'] & {
  queuedAt: number;
  retryCount: number;
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 60000; // 1 minute

export async function addToQueue(submission: ProblemSolvedMessage['payload']): Promise<void> {
  const pending = await getSessionStorage('pendingSubmissions') ?? [];

  const queued: QueuedSubmission = {
    ...submission,
    queuedAt: Date.now(),
    retryCount: 0,
  };

  pending.push(queued);
  await setSessionStorage('pendingSubmissions', pending);
}

export async function getQueue(): Promise<QueuedSubmission[]> {
  return (await getSessionStorage('pendingSubmissions')) ?? [];
}

export async function removeFromQueue(index: number): Promise<void> {
  const pending = await getSessionStorage('pendingSubmissions') ?? [];
  pending.splice(index, 1);
  await setSessionStorage('pendingSubmissions', pending);
}

export async function incrementRetry(index: number): Promise<boolean> {
  const pending = await getSessionStorage('pendingSubmissions') ?? [];

  if (pending[index]) {
    pending[index].retryCount += 1;

    if (pending[index].retryCount >= MAX_RETRIES) {
      // Remove after max retries
      pending.splice(index, 1);
      await setSessionStorage('pendingSubmissions', pending);
      return false; // Indicates item was removed
    }

    await setSessionStorage('pendingSubmissions', pending);
    return true; // Indicates item still in queue
  }

  return false;
}

export async function clearQueue(): Promise<void> {
  await setSessionStorage('pendingSubmissions', []);
}

export async function getQueueLength(): Promise<number> {
  const pending = await getSessionStorage('pendingSubmissions') ?? [];
  return pending.length;
}

/**
 * Process the queue - called periodically or when online
 */
export async function processQueue(
  submitFn: (submission: QueuedSubmission) => Promise<boolean>
): Promise<{ processed: number; failed: number }> {
  const queue = await getQueue();
  let processed = 0;
  let failed = 0;

  // Process in reverse order so we can safely remove items
  for (let i = queue.length - 1; i >= 0; i--) {
    const submission = queue[i];

    try {
      const success = await submitFn(submission);
      if (success) {
        await removeFromQueue(i);
        processed++;
      } else {
        const stillInQueue = await incrementRetry(i);
        if (!stillInQueue) {
          failed++;
        }
      }
    } catch {
      const stillInQueue = await incrementRetry(i);
      if (!stillInQueue) {
        failed++;
      }
    }
  }

  return { processed, failed };
}
