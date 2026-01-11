/**
 * Solved.ac API Client
 * Fetches problem metadata from Solved.ac
 */

const SOLVED_AC_API = 'https://solved.ac/api/v3';

export interface SolvedAcProblem {
  problemId: number;
  titleKo: string;
  title: string;
  level: number;
  tags: Array<{
    key: string;
    displayNames: Array<{
      language: string;
      name: string;
    }>;
  }>;
}

export interface SolvedAcUser {
  handle: string;
  tier: number;
  rating: number;
  solvedCount: number;
}

export interface ProblemMetadata {
  problem_id: number;
  title: string;
  level: number | null;
  tags: string[];
}

/**
 * Fetch single problem metadata from Solved.ac
 */
export async function fetchProblem(problemId: number): Promise<ProblemMetadata | null> {
  try {
    const response = await fetch(`${SOLVED_AC_API}/problem/show?problemId=${problemId}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return null;
    }

    const data: SolvedAcProblem = await response.json();

    return {
      problem_id: data.problemId,
      title: data.titleKo || data.title,
      level: data.level,
      tags: data.tags.map(t => t.key),
    };
  } catch (error) {
    console.error(`Error fetching problem ${problemId}:`, error);
    return null;
  }
}

/**
 * Fetch multiple problems from Solved.ac
 * Note: Solved.ac doesn't have a batch endpoint, so we fetch one by one
 */
export async function fetchProblemMetadata(
  problemIds: number[]
): Promise<ProblemMetadata[]> {
  const results: ProblemMetadata[] = [];

  // Fetch in parallel with concurrency limit
  const CONCURRENCY = 5;

  for (let i = 0; i < problemIds.length; i += CONCURRENCY) {
    const batch = problemIds.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(id => fetchProblem(id)));

    for (const result of batchResults) {
      if (result) {
        results.push(result);
      }
    }

    // Rate limit protection
    if (i + CONCURRENCY < problemIds.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
}

/**
 * Fetch user info from Solved.ac
 */
export async function fetchUser(handle: string): Promise<SolvedAcUser | null> {
  try {
    const response = await fetch(`${SOLVED_AC_API}/user/show?handle=${handle}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching user ${handle}:`, error);
    return null;
  }
}

/**
 * Fetch user's solved problems from Solved.ac
 */
export async function fetchUserSolvedProblems(
  handle: string
): Promise<number[]> {
  try {
    // Solved.ac provides solved problems through search
    const response = await fetch(
      `${SOLVED_AC_API}/search/problem?query=solved_by:${handle}&sort=id&direction=asc`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.items?.map((p: SolvedAcProblem) => p.problemId) ?? [];
  } catch (error) {
    console.error(`Error fetching solved problems for ${handle}:`, error);
    return [];
  }
}

/**
 * Search problems by tag and level range
 */
export async function searchProblems(
  tag: string,
  levelMin: number,
  levelMax: number,
  limit = 10
): Promise<ProblemMetadata[]> {
  try {
    const query = `tag:${tag} *${levelMin}..${levelMax}`;
    const response = await fetch(
      `${SOLVED_AC_API}/search/problem?query=${encodeURIComponent(query)}&sort=solved&direction=desc`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const problems: SolvedAcProblem[] = data.items?.slice(0, limit) ?? [];

    return problems.map(p => ({
      problem_id: p.problemId,
      title: p.titleKo || p.title,
      level: p.level,
      tags: p.tags.map(t => t.key),
    }));
  } catch (error) {
    console.error(`Error searching problems:`, error);
    return [];
  }
}
