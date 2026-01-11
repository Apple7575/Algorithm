/**
 * Google Gemini API Client
 * Provides AI hint and code review functionality
 */

import type { AIMode } from '@algo-pt/shared';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Model selection based on mode
const MODELS: Record<AIMode, string> = {
  flash: 'gemini-2.0-flash-exp',
  pro: 'gemini-1.5-pro',
};

export interface GeminiResponse {
  text: string;
  finishReason: string;
}

interface GenerateContentResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason: string;
  }>;
}

/**
 * Generate content using Gemini API
 */
export async function generateContent(
  prompt: string,
  mode: AIMode,
  systemInstruction?: string
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = MODELS[mode];
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const body: {
    contents: Array<{ parts: Array<{ text: string }> }>;
    systemInstruction?: { parts: Array<{ text: string }> };
  } = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: GenerateContentResponse = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response from Gemini');
  }

  const candidate = data.candidates[0];
  const text = candidate.content.parts.map(p => p.text).join('');

  return {
    text,
    finishReason: candidate.finishReason,
  };
}

/**
 * Get available model for mode
 */
export function getModelForMode(mode: AIMode): string {
  return MODELS[mode];
}
