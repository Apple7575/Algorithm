/**
 * URL Pattern Matcher for Baekjoon Online Judge
 */

// Pattern for problem pages: https://www.acmicpc.net/problem/1000
const PROBLEM_URL_PATTERN = /^https?:\/\/(www\.)?acmicpc\.net\/problem\/(\d+)/;

// Pattern for submit pages: https://www.acmicpc.net/submit/1000
const SUBMIT_URL_PATTERN = /^https?:\/\/(www\.)?acmicpc\.net\/submit\/(\d+)/;

// Pattern for status pages: https://www.acmicpc.net/status
const STATUS_URL_PATTERN = /^https?:\/\/(www\.)?acmicpc\.net\/status/;

export interface ProblemPageInfo {
  type: 'problem';
  problemId: number;
}

export interface SubmitPageInfo {
  type: 'submit';
  problemId: number;
}

export interface StatusPageInfo {
  type: 'status';
}

export interface OtherPageInfo {
  type: 'other';
}

export type PageInfo = ProblemPageInfo | SubmitPageInfo | StatusPageInfo | OtherPageInfo;

export function parseUrl(url: string): PageInfo {
  // Check problem page
  const problemMatch = url.match(PROBLEM_URL_PATTERN);
  if (problemMatch) {
    return {
      type: 'problem',
      problemId: parseInt(problemMatch[2], 10),
    };
  }

  // Check submit page
  const submitMatch = url.match(SUBMIT_URL_PATTERN);
  if (submitMatch) {
    return {
      type: 'submit',
      problemId: parseInt(submitMatch[2], 10),
    };
  }

  // Check status page
  if (STATUS_URL_PATTERN.test(url)) {
    return { type: 'status' };
  }

  return { type: 'other' };
}

export function isProblemPage(url: string): boolean {
  return PROBLEM_URL_PATTERN.test(url);
}

export function isSubmitPage(url: string): boolean {
  return SUBMIT_URL_PATTERN.test(url);
}

export function isStatusPage(url: string): boolean {
  return STATUS_URL_PATTERN.test(url);
}

export function isBOJPage(url: string): boolean {
  return url.includes('acmicpc.net');
}

export function extractProblemId(url: string): number | null {
  const pageInfo = parseUrl(url);
  if (pageInfo.type === 'problem' || pageInfo.type === 'submit') {
    return pageInfo.problemId;
  }
  return null;
}
