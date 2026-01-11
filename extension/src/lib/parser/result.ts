/**
 * Submission Result Detector using MutationObserver
 * Detects submission results on Baekjoon status page
 */

export type SubmissionResult =
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit'
  | 'memory_limit'
  | 'runtime_error'
  | 'compile_error'
  | 'pending'
  | 'unknown';

export interface DetectedResult {
  result: SubmissionResult;
  rawText: string;
  submissionId?: string;
}

// Result text to SubmissionResult mapping
const RESULT_MAPPING: Record<string, SubmissionResult> = {
  '맞았습니다!!': 'accepted',
  '맞았습니다': 'accepted',
  'Accepted': 'accepted',
  '틀렸습니다': 'wrong_answer',
  'Wrong Answer': 'wrong_answer',
  '시간 초과': 'time_limit',
  'Time Limit Exceeded': 'time_limit',
  '메모리 초과': 'memory_limit',
  'Memory Limit Exceeded': 'memory_limit',
  '런타임 에러': 'runtime_error',
  'Runtime Error': 'runtime_error',
  '컴파일 에러': 'compile_error',
  'Compile Error': 'compile_error',
  '채점 중': 'pending',
  '기다리는 중': 'pending',
  '채점 준비 중': 'pending',
};

export function parseResultText(text: string): SubmissionResult {
  const trimmed = text.trim();

  for (const [pattern, result] of Object.entries(RESULT_MAPPING)) {
    if (trimmed.includes(pattern)) {
      return result;
    }
  }

  return 'unknown';
}

export function isTerminalResult(result: SubmissionResult): boolean {
  return result !== 'pending' && result !== 'unknown';
}

export function isSuccessResult(result: SubmissionResult): boolean {
  return result === 'accepted';
}

export function isFailureResult(result: SubmissionResult): boolean {
  return ['wrong_answer', 'time_limit', 'memory_limit', 'runtime_error', 'compile_error'].includes(result);
}

/**
 * Create a MutationObserver to watch for submission results
 */
export function createResultObserver(
  callback: (result: DetectedResult) => void
): MutationObserver | null {
  // Find the status table
  const statusTable = document.querySelector('#status-table');
  if (!statusTable) {
    return null;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        // Check the first row's result cell
        const resultCell = statusTable.querySelector('tbody tr:first-child .result-text');
        if (resultCell) {
          const rawText = resultCell.textContent || '';
          const result = parseResultText(rawText);

          if (isTerminalResult(result)) {
            const row = resultCell.closest('tr');
            const submissionId = row?.querySelector('td:first-child')?.textContent?.trim();

            callback({
              result,
              rawText,
              submissionId,
            });
          }
        }
      }
    }
  });

  observer.observe(statusTable, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return observer;
}

/**
 * Check current page for an existing result (for page load)
 */
export function checkCurrentResult(): DetectedResult | null {
  const resultCell = document.querySelector('#status-table tbody tr:first-child .result-text');
  if (!resultCell) {
    return null;
  }

  const rawText = resultCell.textContent || '';
  const result = parseResultText(rawText);

  if (!isTerminalResult(result)) {
    return null;
  }

  const row = resultCell.closest('tr');
  const submissionId = row?.querySelector('td:first-child')?.textContent?.trim();

  return {
    result,
    rawText,
    submissionId,
  };
}
