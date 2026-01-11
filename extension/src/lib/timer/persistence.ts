/**
 * Timer Persistence using chrome.storage.session
 * Survives page refresh but not browser close
 */

import { getSessionStorage, setSessionStorage, removeSessionStorage } from '../storage';
import type { TimerState } from './timer';

export async function saveTimerState(state: TimerState): Promise<void> {
  await Promise.all([
    setSessionStorage('currentProblemId', state.problemId ?? undefined),
    setSessionStorage('timerStartedAt', state.startedAt ?? undefined),
    setSessionStorage('timerElapsed', state.elapsed),
    setSessionStorage('timerIsRunning', state.isRunning),
  ]);
}

export async function loadTimerState(): Promise<TimerState> {
  const [problemId, startedAt, elapsed, isRunning] = await Promise.all([
    getSessionStorage('currentProblemId'),
    getSessionStorage('timerStartedAt'),
    getSessionStorage('timerElapsed'),
    getSessionStorage('timerIsRunning'),
  ]);

  return {
    problemId: problemId ?? null,
    startedAt: startedAt ?? null,
    elapsed: elapsed ?? 0,
    isRunning: isRunning ?? false,
  };
}

export async function clearTimerState(): Promise<void> {
  await Promise.all([
    removeSessionStorage('currentProblemId'),
    removeSessionStorage('timerStartedAt'),
    removeSessionStorage('timerElapsed'),
    removeSessionStorage('timerIsRunning'),
  ]);
}
