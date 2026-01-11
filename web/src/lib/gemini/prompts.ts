/**
 * Gemini Prompt Templates
 * System instructions and prompts for AI features
 */

import type { AIMode } from '@algo-pt/shared';

// System instruction that prevents solution leaking
export const HINT_SYSTEM_INSTRUCTION = `You are an algorithm tutor helping a student learn problem-solving skills.

CRITICAL RULES:
1. NEVER provide complete solution code
2. NEVER give away the exact algorithm name if the student hasn't figured it out
3. Focus on building understanding through questions and hints
4. Guide the student to discover the solution themselves
5. If the student is stuck, provide increasingly specific hints in this order:
   - First: Ask clarifying questions about their approach
   - Second: Suggest what type of problem this might be (without naming specific algorithm)
   - Third: Point out what patterns to look for in the problem
   - Fourth: Give a small concrete example to illustrate the concept
6. Always respond in the same language as the user's message

Your goal is to help the student LEARN, not to solve the problem for them.`;

export const CODE_REVIEW_SYSTEM_INSTRUCTION = `You are a code review expert specializing in competitive programming and algorithms.

Your task is to:
1. Analyze the provided code for correctness
2. Identify inefficiencies and potential bugs
3. Suggest improvements without providing complete solutions
4. Point out edge cases that might be missed
5. Explain time and space complexity
6. Format your response in clear sections

IMPORTANT: Focus on educational feedback. Help the user understand WHY something is wrong or could be better, not just WHAT to change.

Always respond in the same language as the user's message.`;

/**
 * Generate hint request prompt
 */
export function generateHintPrompt(
  problemDescription: string,
  userApproach?: string,
  mode: AIMode = 'flash'
): string {
  const modeInstruction =
    mode === 'flash'
      ? 'Provide a concise hint (2-3 sentences max).'
      : 'Provide a detailed explanation with examples if helpful.';

  let prompt = `Problem:
${problemDescription}

${modeInstruction}
`;

  if (userApproach) {
    prompt += `
The student has tried the following approach:
${userApproach}

Based on their approach, provide guidance on whether they're on the right track and what to consider next.`;
  } else {
    prompt += `
The student hasn't started yet. Provide an initial hint to help them think about the problem.`;
  }

  return prompt;
}

/**
 * Generate code review prompt
 */
export function generateReviewPrompt(
  problemDescription: string,
  code: string,
  language: string,
  mode: AIMode = 'flash'
): string {
  const modeInstruction =
    mode === 'flash'
      ? 'Provide a brief review focusing on the most critical issues (3-5 points max).'
      : 'Provide a comprehensive review covering correctness, efficiency, style, and edge cases.';

  return `Problem:
${problemDescription}

Code (${language}):
\`\`\`${language}
${code}
\`\`\`

${modeInstruction}

Please analyze this code and provide feedback on:
1. Correctness - Will it produce the right answer?
2. Efficiency - What's the time and space complexity? Can it be improved?
3. Edge Cases - Are there any inputs that might cause issues?
4. Code Quality - Is the code readable and well-structured?

Format your response with clear sections for each aspect.`;
}
