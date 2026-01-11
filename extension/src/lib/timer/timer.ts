/**
 * Timer Logic for Problem Solving
 * Tracks elapsed time with pause/resume support
 */

export interface TimerState {
  problemId: number | null;
  startedAt: number | null; // Unix timestamp when timer started/resumed
  elapsed: number; // Accumulated elapsed time in seconds before pauses
  isRunning: boolean;
}

export function createInitialTimerState(): TimerState {
  return {
    problemId: null,
    startedAt: null,
    elapsed: 0,
    isRunning: false,
  };
}

export function startTimer(state: TimerState, problemId: number): TimerState {
  // If already tracking this problem, just resume
  if (state.problemId === problemId && !state.isRunning) {
    return {
      ...state,
      startedAt: Date.now(),
      isRunning: true,
    };
  }

  // Start fresh for a new problem
  return {
    problemId,
    startedAt: Date.now(),
    elapsed: 0,
    isRunning: true,
  };
}

export function pauseTimer(state: TimerState): TimerState {
  if (!state.isRunning || !state.startedAt) {
    return state;
  }

  const currentElapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  return {
    ...state,
    elapsed: state.elapsed + currentElapsed,
    startedAt: null,
    isRunning: false,
  };
}

export function resumeTimer(state: TimerState): TimerState {
  if (state.isRunning || !state.problemId) {
    return state;
  }

  return {
    ...state,
    startedAt: Date.now(),
    isRunning: true,
  };
}

export function stopTimer(state: TimerState): { state: TimerState; totalSeconds: number } {
  let totalSeconds = state.elapsed;

  if (state.isRunning && state.startedAt) {
    totalSeconds += Math.floor((Date.now() - state.startedAt) / 1000);
  }

  return {
    state: createInitialTimerState(),
    totalSeconds,
  };
}

export function resetTimer(): TimerState {
  return createInitialTimerState();
}

export function getElapsedSeconds(state: TimerState): number {
  let total = state.elapsed;

  if (state.isRunning && state.startedAt) {
    total += Math.floor((Date.now() - state.startedAt) / 1000);
  }

  return total;
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
