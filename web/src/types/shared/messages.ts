/**
 * Chrome Extension Message Types
 * Web Dashboard <-> Extension communication
 */

// ============================================================
// Web -> Extension Messages
// ============================================================

export interface AuthTokenMessage {
  type: 'AUTH_TOKEN';
  payload: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}

export interface LogoutMessage {
  type: 'LOGOUT';
}

export interface SettingsUpdateMessage {
  type: 'SETTINGS_UPDATE';
  payload: {
    baekjoonId?: string;
    autoStartTimer?: boolean;
    showPopupOnResult?: boolean;
  };
}

// ============================================================
// Extension -> Web Messages
// ============================================================

export interface ProblemSolvedMessage {
  type: 'PROBLEM_SOLVED';
  payload: {
    problemId: number;
    status: 'solved' | 'failed';
    durationSeconds: number;
    difficultyRating?: 'easy' | 'normal' | 'hard';
    failureReason?: 'algo' | 'impl' | 'time' | 'edge';
    solvedAt: string;
  };
}

export interface TimerSyncMessage {
  type: 'TIMER_SYNC';
  payload: {
    problemId: number;
    elapsedSeconds: number;
    isRunning: boolean;
  };
}

export interface TokenRefreshRequestMessage {
  type: 'TOKEN_REFRESH_REQUEST';
}

// ============================================================
// Extension Internal Messages (Content Script <-> Background)
// ============================================================

export interface ProblemPageEnteredMessage {
  type: 'PROBLEM_PAGE_ENTERED';
  payload: {
    problemId: number;
    url: string;
  };
}

export interface SubmissionResultMessage {
  type: 'SUBMISSION_RESULT';
  payload: {
    problemId: number;
    result: 'accepted' | 'wrong_answer' | 'time_limit' | 'memory_limit' | 'runtime_error' | 'compile_error';
    rawText: string;
  };
}

export interface TabVisibilityMessage {
  type: 'TAB_VISIBILITY';
  payload: {
    isVisible: boolean;
  };
}

export interface TimerControlMessage {
  type: 'TIMER_CONTROL';
  payload: {
    action: 'start' | 'pause' | 'resume' | 'stop' | 'reset';
    problemId?: number;
  };
}

// ============================================================
// Union Types
// ============================================================

export type WebToExtensionMessage =
  | AuthTokenMessage
  | LogoutMessage
  | SettingsUpdateMessage;

export type ExtensionToWebMessage =
  | ProblemSolvedMessage
  | TimerSyncMessage
  | TokenRefreshRequestMessage;

export type InternalExtensionMessage =
  | ProblemPageEnteredMessage
  | SubmissionResultMessage
  | TabVisibilityMessage
  | TimerControlMessage;

export type AllMessages =
  | WebToExtensionMessage
  | ExtensionToWebMessage
  | InternalExtensionMessage;

// ============================================================
// Message Response Types
// ============================================================

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthStatusResponse {
  isAuthenticated: boolean;
  userId?: string;
  expiresAt?: number;
}

export interface TimerStatusResponse {
  problemId: number | null;
  elapsedSeconds: number;
  isRunning: boolean;
  startedAt: string | null;
}

// ============================================================
// Chrome Storage Types
// ============================================================

export interface ExtensionStorageLocal {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  userId?: string;
  settings?: {
    autoStartTimer: boolean;
    showPopupOnResult: boolean;
    baekjoonId?: string;
  };
}

export interface ExtensionStorageSession {
  currentProblemId?: number;
  timerStartedAt?: number;
  timerElapsed?: number;
  timerIsRunning?: boolean;
  pendingSubmissions?: ProblemSolvedMessage['payload'][];
}
