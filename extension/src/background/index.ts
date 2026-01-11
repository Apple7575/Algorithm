/**
 * Background Service Worker
 * Handles timer state, message routing, and data persistence
 */

import {
  type TimerState,
  createInitialTimerState,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  getElapsedSeconds,
} from '../lib/timer/timer';
import { saveTimerState, loadTimerState, clearTimerState } from '../lib/timer/persistence';
import { getAuthTokens, setAuthTokens, clearAuthTokens, isTokenExpired } from '../lib/storage';
import type {
  AllMessages,
  AuthTokenMessage,
  LogoutMessage,
  ProblemPageEnteredMessage,
  SubmissionResultMessage,
  TabVisibilityMessage,
  TimerControlMessage,
  MessageResponse,
  TimerStatusResponse,
  AuthStatusResponse,
  ProblemSolvedMessage,
} from '@algo-pt/shared';

// ============================================================
// State
// ============================================================

let timerState: TimerState = createInitialTimerState();

// ============================================================
// Timer Management
// ============================================================

async function handleProblemPageEntered(payload: ProblemPageEnteredMessage['payload']): Promise<void> {
  const { problemId } = payload;

  // If tracking a different problem, save current timer first
  if (timerState.problemId && timerState.problemId !== problemId) {
    // Optionally save the previous problem's time
    const { totalSeconds } = stopTimer(timerState);
    // Could store this for later submission
    console.log(`[Algo-PT] Stopped timer for problem ${timerState.problemId}: ${totalSeconds}s`);
  }

  // Start timer for new problem
  timerState = startTimer(timerState, problemId);
  await saveTimerState(timerState);
  console.log(`[Algo-PT] Started timer for problem ${problemId}`);
}

async function handleTabVisibility(payload: TabVisibilityMessage['payload']): Promise<void> {
  if (!timerState.problemId) return;

  if (payload.isVisible) {
    timerState = resumeTimer(timerState);
  } else {
    timerState = pauseTimer(timerState);
  }

  await saveTimerState(timerState);
}

async function handleSubmissionResult(payload: SubmissionResultMessage['payload']): Promise<void> {
  const { problemId, result } = payload;

  // Only process if this is the problem we're tracking
  if (timerState.problemId !== problemId) return;

  // Stop timer and get total time
  const { totalSeconds } = stopTimer(timerState);
  timerState = createInitialTimerState();
  await clearTimerState();

  // Determine status
  const status = result === 'accepted' ? 'solved' : 'failed';

  // Create the problem solved message (to be shown in popup)
  const solvedMessage: ProblemSolvedMessage['payload'] = {
    problemId,
    status,
    durationSeconds: totalSeconds,
    solvedAt: new Date().toISOString(),
  };

  // Store for popup to retrieve
  await chrome.storage.session.set({ pendingResult: solvedMessage });

  // Notify popup if open
  chrome.runtime.sendMessage({
    type: 'SHOW_RESULT_POPUP',
    payload: solvedMessage,
  }).catch(() => {
    // Popup not open, that's fine
  });

  console.log(`[Algo-PT] Problem ${problemId} ${status} in ${totalSeconds}s`);
}

async function handleTimerControl(payload: TimerControlMessage['payload']): Promise<void> {
  const { action, problemId } = payload;

  switch (action) {
    case 'start':
      if (problemId) {
        timerState = startTimer(timerState, problemId);
      }
      break;
    case 'pause':
      timerState = pauseTimer(timerState);
      break;
    case 'resume':
      timerState = resumeTimer(timerState);
      break;
    case 'stop':
      timerState = createInitialTimerState();
      await clearTimerState();
      break;
    case 'reset':
      timerState = createInitialTimerState();
      await clearTimerState();
      break;
  }

  await saveTimerState(timerState);
}

// ============================================================
// Auth Management
// ============================================================

async function handleAuthToken(payload: AuthTokenMessage['payload']): Promise<void> {
  await setAuthTokens({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresAt: payload.expiresAt,
    userId: '', // Will be set from the token
  });
  console.log('[Algo-PT] Auth tokens saved');
}

async function handleLogout(): Promise<void> {
  await clearAuthTokens();
  console.log('[Algo-PT] Logged out');
}

// ============================================================
// Message Handler
// ============================================================

chrome.runtime.onMessage.addListener((message: AllMessages, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'PROBLEM_PAGE_ENTERED':
          await handleProblemPageEntered(message.payload);
          sendResponse({ success: true });
          break;

        case 'TAB_VISIBILITY':
          await handleTabVisibility(message.payload);
          sendResponse({ success: true });
          break;

        case 'SUBMISSION_RESULT':
          await handleSubmissionResult(message.payload);
          sendResponse({ success: true });
          break;

        case 'TIMER_CONTROL':
          await handleTimerControl(message.payload);
          sendResponse({ success: true });
          break;

        case 'AUTH_TOKEN':
          await handleAuthToken(message.payload);
          sendResponse({ success: true });
          break;

        case 'LOGOUT':
          await handleLogout();
          sendResponse({ success: true });
          break;

        case 'GET_TIMER_STATUS':
          const timerStatus: TimerStatusResponse = {
            problemId: timerState.problemId,
            elapsedSeconds: getElapsedSeconds(timerState),
            isRunning: timerState.isRunning,
            startedAt: timerState.startedAt ? new Date(timerState.startedAt).toISOString() : null,
          };
          sendResponse({ success: true, data: timerStatus });
          break;

        case 'GET_AUTH_STATUS':
          const tokens = await getAuthTokens();
          const authStatus: AuthStatusResponse = {
            isAuthenticated: tokens !== null && !isTokenExpired(tokens.expiresAt),
            userId: tokens?.userId,
            expiresAt: tokens?.expiresAt,
          };
          sendResponse({ success: true, data: authStatus });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[Algo-PT] Error handling message:', error);
      sendResponse({ success: false, error: String(error) });
    }
  })();

  // Return true to indicate async response
  return true;
});

// ============================================================
// External Message Handler (from web dashboard)
// ============================================================

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === 'AUTH_TOKEN') {
        await handleAuthToken(message.payload);
        sendResponse({ success: true });
      } else if (message.type === 'LOGOUT') {
        await handleLogout();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
  })();

  return true;
});

// ============================================================
// Initialization
// ============================================================

async function init(): Promise<void> {
  // Restore timer state from storage
  timerState = await loadTimerState();
  console.log('[Algo-PT] Background service worker initialized');
}

init();
