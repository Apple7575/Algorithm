/**
 * Content Script - Injected into Baekjoon pages
 * Handles page detection, timer control, and result detection
 */

import { parseUrl, isProblemPage, isStatusPage } from '../lib/parser/url';
import {
  createResultObserver,
  checkCurrentResult,
  isTerminalResult,
  type DetectedResult,
} from '../lib/parser/result';
import type {
  ProblemPageEnteredMessage,
  SubmissionResultMessage,
  TabVisibilityMessage,
  TimerControlMessage,
} from '@algo-pt/shared';

// ============================================================
// Message Helpers
// ============================================================

function sendMessage<T>(message: T): void {
  chrome.runtime.sendMessage(message).catch(() => {
    // Extension context may be invalidated
  });
}

// ============================================================
// Page Detection
// ============================================================

function handlePageLoad(): void {
  const url = window.location.href;
  const pageInfo = parseUrl(url);

  if (pageInfo.type === 'problem') {
    // Notify background that we entered a problem page
    const message: ProblemPageEnteredMessage = {
      type: 'PROBLEM_PAGE_ENTERED',
      payload: {
        problemId: pageInfo.problemId,
        url,
      },
    };
    sendMessage(message);
  }

  if (pageInfo.type === 'status' || isStatusPage(url)) {
    // Start watching for submission results
    setupResultObserver();
  }
}

// ============================================================
// Result Observer
// ============================================================

let resultObserver: MutationObserver | null = null;
let lastProcessedSubmissionId: string | null = null;

function setupResultObserver(): void {
  // Check for existing result first
  const existingResult = checkCurrentResult();
  if (existingResult && existingResult.submissionId !== lastProcessedSubmissionId) {
    handleResult(existingResult);
  }

  // Setup observer for future results
  resultObserver = createResultObserver((result) => {
    if (result.submissionId !== lastProcessedSubmissionId) {
      handleResult(result);
    }
  });
}

function handleResult(result: DetectedResult): void {
  if (!isTerminalResult(result.result)) return;

  lastProcessedSubmissionId = result.submissionId || null;

  // Extract problem ID from the status page (usually in the URL params or table)
  const problemId = extractProblemIdFromStatusPage();
  if (!problemId) return;

  const message: SubmissionResultMessage = {
    type: 'SUBMISSION_RESULT',
    payload: {
      problemId,
      result: result.result === 'accepted' ? 'accepted' : result.result,
      rawText: result.rawText,
    },
  };
  sendMessage(message);
}

function extractProblemIdFromStatusPage(): number | null {
  // Try to get from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const problemParam = urlParams.get('problem_id');
  if (problemParam) {
    return parseInt(problemParam, 10);
  }

  // Try to get from the first row's problem link
  const problemLink = document.querySelector('#status-table tbody tr:first-child td:nth-child(3) a');
  if (problemLink) {
    const href = problemLink.getAttribute('href');
    const match = href?.match(/\/problem\/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

// ============================================================
// Tab Visibility Handler
// ============================================================

function setupVisibilityHandler(): void {
  document.addEventListener('visibilitychange', () => {
    const message: TabVisibilityMessage = {
      type: 'TAB_VISIBILITY',
      payload: {
        isVisible: !document.hidden,
      },
    };
    sendMessage(message);
  });
}

// ============================================================
// Cleanup
// ============================================================

function cleanup(): void {
  if (resultObserver) {
    resultObserver.disconnect();
    resultObserver = null;
  }
}

// ============================================================
// Initialize
// ============================================================

function init(): void {
  handlePageLoad();
  setupVisibilityHandler();

  // Cleanup on navigation (SPA-like behavior)
  window.addEventListener('beforeunload', cleanup);
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
