import React, { useState, useEffect } from 'react';
import type { TimerStatusResponse, AuthStatusResponse, ProblemSolvedMessage } from '@algo-pt/shared';
import { formatTime } from '../lib/timer/timer';

type DifficultyRating = 'easy' | 'normal' | 'hard';
type FailureReason = 'algo' | 'impl' | 'time' | 'edge';

interface PendingResult extends ProblemSolvedMessage['payload'] {
  difficultyRating?: DifficultyRating;
  failureReason?: FailureReason;
}

export default function App() {
  const [timerStatus, setTimerStatus] = useState<TimerStatusResponse | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatusResponse | null>(null);
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);
  const [selectedRating, setSelectedRating] = useState<DifficultyRating | null>(null);
  const [selectedReason, setSelectedReason] = useState<FailureReason | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial status
  useEffect(() => {
    fetchStatus();
    checkPendingResult();

    // Update timer every second
    const interval = setInterval(fetchTimerStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    await Promise.all([fetchTimerStatus(), fetchAuthStatus()]);
  }

  async function fetchTimerStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_TIMER_STATUS' });
      if (response.success) {
        setTimerStatus(response.data);
      }
    } catch {
      // Extension context may be invalidated
    }
  }

  async function fetchAuthStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
      if (response.success) {
        setAuthStatus(response.data);
      }
    } catch {
      // Extension context may be invalidated
    }
  }

  async function checkPendingResult() {
    const result = await chrome.storage.session.get('pendingResult');
    if (result.pendingResult) {
      setPendingResult(result.pendingResult);
    }
  }

  async function handleSubmit() {
    if (!pendingResult) return;

    setSubmitting(true);

    try {
      const data = {
        ...pendingResult,
        difficultyRating: pendingResult.status === 'solved' ? selectedRating : undefined,
        failureReason: pendingResult.status === 'failed' ? selectedReason : undefined,
      };

      // TODO: Send to Supabase via API
      console.log('[Algo-PT] Submitting result:', data);

      // Clear pending result
      await chrome.storage.session.remove('pendingResult');
      setPendingResult(null);
      setSelectedRating(null);
      setSelectedReason(null);
    } catch (error) {
      console.error('[Algo-PT] Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    await chrome.storage.session.remove('pendingResult');
    setPendingResult(null);
    setSelectedRating(null);
    setSelectedReason(null);
  }

  // Show result popup if there's a pending result
  if (pendingResult) {
    return (
      <div className="popup-container">
        <div className="header">
          <span className="logo">Algo-PT</span>
        </div>

        <div className="result-section">
          <div className="result-header">
            <div className="result-icon">
              {pendingResult.status === 'solved' ? '🎉' : '💪'}
            </div>
            <div className={`result-title ${pendingResult.status === 'solved' ? 'success' : 'failure'}`}>
              {pendingResult.status === 'solved' ? 'Solved!' : 'Keep trying!'}
            </div>
          </div>

          <div className="result-stats">
            <div className="stat">
              <div className="stat-value">#{pendingResult.problemId}</div>
              <div className="stat-label">Problem</div>
            </div>
            <div className="stat">
              <div className="stat-value">{formatTime(pendingResult.durationSeconds)}</div>
              <div className="stat-label">Time</div>
            </div>
          </div>

          {pendingResult.status === 'solved' ? (
            <div className="rating-section">
              <div className="rating-label">How did it feel?</div>
              <div className="rating-options">
                <button
                  className={`rating-btn easy ${selectedRating === 'easy' ? 'selected' : ''}`}
                  onClick={() => setSelectedRating('easy')}
                >
                  😊 Easy
                </button>
                <button
                  className={`rating-btn normal ${selectedRating === 'normal' ? 'selected' : ''}`}
                  onClick={() => setSelectedRating('normal')}
                >
                  😐 Normal
                </button>
                <button
                  className={`rating-btn hard ${selectedRating === 'hard' ? 'selected' : ''}`}
                  onClick={() => setSelectedRating('hard')}
                >
                  😤 Hard
                </button>
              </div>
            </div>
          ) : (
            <div className="rating-section">
              <div className="rating-label">What went wrong?</div>
              <div className="failure-options">
                <button
                  className={`failure-btn ${selectedReason === 'algo' ? 'selected' : ''}`}
                  onClick={() => setSelectedReason('algo')}
                >
                  🧠 Algorithm
                </button>
                <button
                  className={`failure-btn ${selectedReason === 'impl' ? 'selected' : ''}`}
                  onClick={() => setSelectedReason('impl')}
                >
                  💻 Implementation
                </button>
                <button
                  className={`failure-btn ${selectedReason === 'time' ? 'selected' : ''}`}
                  onClick={() => setSelectedReason('time')}
                >
                  ⏱️ Time Complexity
                </button>
                <button
                  className={`failure-btn ${selectedReason === 'edge' ? 'selected' : ''}`}
                  onClick={() => setSelectedReason('edge')}
                >
                  🔍 Edge Cases
                </button>
              </div>
            </div>
          )}

          <div className="submit-section">
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={submitting || (pendingResult.status === 'solved' && !selectedRating) || (pendingResult.status === 'failed' && !selectedReason)}
            >
              {submitting ? 'Saving...' : 'Save Result'}
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={handleSkip}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show timer status
  return (
    <div className="popup-container">
      <div className="header">
        <span className="logo">Algo-PT</span>
        <span className={`auth-status ${authStatus?.isAuthenticated ? '' : 'disconnected'}`}>
          {authStatus?.isAuthenticated ? 'Connected' : 'Not connected'}
        </span>
      </div>

      {timerStatus?.problemId ? (
        <div className="timer-section">
          <div className="timer-display">
            {formatTime(timerStatus.elapsedSeconds)}
          </div>
          <div className="problem-info">
            Problem #{timerStatus.problemId}
            {timerStatus.isRunning ? ' • Running' : ' • Paused'}
          </div>
          <div className="timer-controls">
            {timerStatus.isRunning ? (
              <button
                className="btn btn-secondary"
                onClick={() => chrome.runtime.sendMessage({ type: 'TIMER_CONTROL', payload: { action: 'pause' } })}
              >
                Pause
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => chrome.runtime.sendMessage({ type: 'TIMER_CONTROL', payload: { action: 'resume' } })}
              >
                Resume
              </button>
            )}
            <button
              className="btn btn-danger"
              onClick={() => chrome.runtime.sendMessage({ type: 'TIMER_CONTROL', payload: { action: 'reset' } })}
            >
              Reset
            </button>
          </div>
        </div>
      ) : (
        <div className="not-tracking">
          <div className="not-tracking-icon">⏱️</div>
          <div className="not-tracking-text">
            Not tracking any problem.<br />
            Visit a problem on Baekjoon to start.
          </div>
        </div>
      )}
    </div>
  );
}
