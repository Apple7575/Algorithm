/**
 * Chrome Extension Message Types
 *
 * 웹 대시보드 ↔ Extension 간 통신에 사용되는 메시지 타입 정의
 */

// ============================================================
// Web → Extension Messages
// ============================================================

/**
 * 인증 토큰 전달 (웹 로그인 후)
 */
export interface AuthTokenMessage {
  type: 'AUTH_TOKEN';
  payload: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number; // Unix timestamp
  };
}

/**
 * 로그아웃 알림
 */
export interface LogoutMessage {
  type: 'LOGOUT';
}

/**
 * 설정 업데이트
 */
export interface SettingsUpdateMessage {
  type: 'SETTINGS_UPDATE';
  payload: {
    baekjoonId?: string;
    autoStartTimer?: boolean;
    showPopupOnResult?: boolean;
  };
}

// ============================================================
// Extension → Web Messages (via chrome.runtime.sendMessage)
// ============================================================

/**
 * 문제 풀이 완료 알림
 */
export interface ProblemSolvedMessage {
  type: 'PROBLEM_SOLVED';
  payload: {
    problemId: number;
    status: 'solved' | 'failed';
    durationSeconds: number;
    difficultyRating?: 'easy' | 'normal' | 'hard';
    failureReason?: 'algo' | 'impl' | 'time' | 'edge';
    solvedAt: string; // ISO 8601
  };
}

/**
 * 타이머 상태 동기화 요청
 */
export interface TimerSyncMessage {
  type: 'TIMER_SYNC';
  payload: {
    problemId: number;
    elapsedSeconds: number;
    isRunning: boolean;
  };
}

/**
 * 토큰 갱신 요청
 */
export interface TokenRefreshRequestMessage {
  type: 'TOKEN_REFRESH_REQUEST';
}

// ============================================================
// Extension Internal Messages (Content Script ↔ Background)
// ============================================================

/**
 * 문제 페이지 진입 감지
 */
export interface ProblemPageEnteredMessage {
  type: 'PROBLEM_PAGE_ENTERED';
  payload: {
    problemId: number;
    url: string;
  };
}

/**
 * 제출 결과 감지
 */
export interface SubmissionResultMessage {
  type: 'SUBMISSION_RESULT';
  payload: {
    problemId: number;
    result: 'accepted' | 'wrong_answer' | 'time_limit' | 'memory_limit' | 'runtime_error' | 'compile_error';
    rawText: string; // 백준 결과 텍스트 원본
  };
}

/**
 * 탭 활성화 상태 변경
 */
export interface TabVisibilityMessage {
  type: 'TAB_VISIBILITY';
  payload: {
    isVisible: boolean;
  };
}

/**
 * 타이머 제어
 */
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
  // Auth
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  userId?: string;

  // Settings
  settings?: {
    autoStartTimer: boolean;
    showPopupOnResult: boolean;
    baekjoonId?: string;
  };
}

export interface ExtensionStorageSession {
  // Timer state (session-only, survives page refresh)
  currentProblemId?: number;
  timerStartedAt?: number; // Unix timestamp when timer started
  timerElapsed?: number; // Accumulated elapsed time before pauses
  timerIsRunning?: boolean;

  // Pending submissions (for offline support)
  pendingSubmissions?: ProblemSolvedMessage['payload'][];
}
