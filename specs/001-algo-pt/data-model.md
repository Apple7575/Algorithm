# Data Model: Algo-PT

**Date**: 2026-01-12
**Storage**: Supabase PostgreSQL

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │  problems   │       │ study_logs  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ problem_id  │──┐    │ id (PK)     │
│ email       │  │    │ (PK)        │  │    │ user_id(FK) │──┐
│ baekjoon_id │  │    │ title       │  │    │ problem_id  │──┤
│ target_tier │  │    │ level       │  │    │ (FK)        │  │
│ created_at  │  │    │ tags        │  │    │ status      │  │
│ updated_at  │  │    │ cached_at   │  │    │ duration_s  │  │
└─────────────┘  │    └─────────────┘  │    │ difficulty  │  │
                 │                      │    │ failure_rsn │  │
                 │                      │    │ solved_at   │  │
                 │                      │    │ next_review │  │
                 │                      │    │ ef          │  │
                 │                      │    │ interval    │  │
                 │                      │    │ repetitions │  │
                 └──────────────────────┴───>└─────────────┘
                           1:N                      N:1

┌─────────────┐
│ ai_usage    │
├─────────────┤
│ id (PK)     │
│ user_id(FK) │──> users.id
│ date        │
│ flash_count │
│ pro_count   │
└─────────────┘
```

## Tables

### 1. users

시스템 사용자 정보. Supabase Auth와 연동.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Supabase Auth user ID |
| email | VARCHAR(255) | NOT NULL, UNIQUE | 이메일 (Supabase Auth에서 동기화) |
| baekjoon_id | VARCHAR(50) | UNIQUE | 백준 아이디 (선택적) |
| target_tier | VARCHAR(20) | | 목표 티어 (e.g., "Gold IV") |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 가입 일시 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정 일시 |

**Indexes:**
- `idx_users_baekjoon_id` ON baekjoon_id

**RLS Policies:**
- SELECT: `auth.uid() = id`
- UPDATE: `auth.uid() = id`

---

### 2. problems

알고리즘 문제 메타데이터. Solved.ac API에서 캐싱.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| problem_id | INTEGER | PK | 백준 문제 번호 |
| title | VARCHAR(255) | NOT NULL | 문제 제목 |
| level | INTEGER | | Solved.ac 난이도 (0-30) |
| tags | JSONB | DEFAULT '[]' | 알고리즘 태그 배열 |
| cached_at | TIMESTAMPTZ | DEFAULT NOW() | 캐시 시점 |

**Indexes:**
- `idx_problems_level` ON level
- `idx_problems_tags` ON tags USING GIN

**Notes:**
- 7일 이상 된 캐시는 Solved.ac에서 갱신
- tags 예시: `["dp", "greedy", "math"]`

---

### 3. study_logs

사용자의 문제 풀이 기록. SM-2 스케줄링 데이터 포함.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 로그 ID |
| user_id | UUID | FK → users.id, NOT NULL | 사용자 |
| problem_id | INTEGER | FK → problems.problem_id, NOT NULL | 문제 |
| status | VARCHAR(20) | NOT NULL | 'solved', 'failed', 'review_needed' |
| duration_seconds | INTEGER | | 순수 풀이 시간 (초) |
| difficulty_rating | VARCHAR(10) | | 'easy', 'normal', 'hard', NULL |
| failure_reason | VARCHAR(20) | | 'algo', 'impl', 'time', 'edge', NULL |
| solved_at | TIMESTAMPTZ | DEFAULT NOW() | 풀이 완료 시점 |
| next_review_date | DATE | | SM-2 다음 복습 예정일 |
| easiness_factor | DECIMAL(4,2) | DEFAULT 2.50 | SM-2 EF (1.30 ~ 2.50) |
| interval_days | INTEGER | DEFAULT 0 | SM-2 현재 간격 (일) |
| repetitions | INTEGER | DEFAULT 0 | SM-2 연속 정답 횟수 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 레코드 생성 시점 |

**Indexes:**
- `idx_study_logs_user_next_review` ON (user_id, next_review_date)
- `idx_study_logs_user_problem` ON (user_id, problem_id)
- `idx_study_logs_user_status` ON (user_id, status)
- `idx_study_logs_failure_reason` ON (user_id, failure_reason) WHERE failure_reason IS NOT NULL

**Constraints:**
- CHECK (status IN ('solved', 'failed', 'review_needed'))
- CHECK (difficulty_rating IN ('easy', 'normal', 'hard') OR difficulty_rating IS NULL)
- CHECK (failure_reason IN ('algo', 'impl', 'time', 'edge') OR failure_reason IS NULL)
- CHECK (easiness_factor >= 1.30)

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`

---

### 4. ai_usage

AI 요청 일일 사용량 추적.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| user_id | UUID | FK → users.id, NOT NULL | 사용자 |
| date | DATE | NOT NULL, DEFAULT CURRENT_DATE | 날짜 |
| flash_count | INTEGER | DEFAULT 0 | Flash 모드 사용 횟수 |
| pro_count | INTEGER | DEFAULT 0 | Pro 모드 사용 횟수 |

**Indexes:**
- `idx_ai_usage_user_date` ON (user_id, date) UNIQUE

**Constraints:**
- CHECK (flash_count >= 0 AND flash_count <= 50)
- CHECK (pro_count >= 0 AND pro_count <= 10)

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`

---

## Enums (Reference)

```sql
-- status enum values
'solved'        -- 정답
'failed'        -- 오답
'review_needed' -- 복습 필요 (SM-2에서 설정)

-- difficulty_rating enum values
'easy'   -- 쉬웠음 (SM-2 q=5)
'normal' -- 적당함 (SM-2 q=4)
'hard'   -- 어려웠음 (SM-2 q=3)

-- failure_reason enum values
'algo' -- 알고리즘 미숙
'impl' -- 구현 실수
'time' -- 시간복잡도 설계 미스
'edge' -- 엣지케이스 누락
```

---

## TypeScript Types (Shared Package)

```typescript
// packages/shared/types/entities.ts

export interface User {
  id: string;
  email: string;
  baekjoon_id: string | null;
  target_tier: string | null;
  created_at: string;
  updated_at: string;
}

export interface Problem {
  problem_id: number;
  title: string;
  level: number | null;
  tags: string[];
  cached_at: string;
}

export type StudyStatus = 'solved' | 'failed' | 'review_needed';
export type DifficultyRating = 'easy' | 'normal' | 'hard';
export type FailureReason = 'algo' | 'impl' | 'time' | 'edge';

export interface StudyLog {
  id: string;
  user_id: string;
  problem_id: number;
  status: StudyStatus;
  duration_seconds: number | null;
  difficulty_rating: DifficultyRating | null;
  failure_reason: FailureReason | null;
  solved_at: string;
  next_review_date: string | null;
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  created_at: string;
}

export interface AIUsage {
  id: string;
  user_id: string;
  date: string;
  flash_count: number;
  pro_count: number;
}
```

---

## State Transitions

### StudyLog Status Transitions

```
[New Problem]
     │
     ▼
┌─────────┐     정답 + 체감난이도      ┌─────────┐
│ (start) │ ─────────────────────────> │ solved  │
└─────────┘                            └─────────┘
     │                                      │
     │ 오답 + 실패원인                       │ SM-2: next_review_date 도래
     ▼                                      ▼
┌─────────┐                            ┌─────────────────┐
│ failed  │ ───── 재시도 성공 ─────────> │ review_needed  │
└─────────┘                            └─────────────────┘
     │                                      │
     │ SM-2 리셋 (짧은 간격)                  │ 복습 완료
     └──────────────────────────────────────┘
```

### SM-2 Algorithm Flow

```typescript
function updateSM2(
  log: StudyLog,
  quality: number // 0-5 based on difficulty_rating
): Partial<StudyLog> {
  let { easiness_factor, interval_days, repetitions } = log;

  if (quality < 3) {
    // Failed: reset
    repetitions = 0;
    interval_days = 1;
  } else {
    // Success: advance
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * easiness_factor);
    }
    repetitions += 1;
  }

  // Update EF
  easiness_factor = Math.max(
    1.3,
    easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const next_review_date = addDays(new Date(), interval_days);

  return {
    easiness_factor,
    interval_days,
    repetitions,
    next_review_date: next_review_date.toISOString().split('T')[0],
    status: quality < 3 ? 'review_needed' : 'solved'
  };
}
```

---

## Supabase SQL Migration

```sql
-- 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  baekjoon_id VARCHAR(50) UNIQUE,
  target_tier VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problems table (cache from Solved.ac)
CREATE TABLE problems (
  problem_id INTEGER PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  level INTEGER,
  tags JSONB DEFAULT '[]',
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study logs table
CREATE TABLE study_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER NOT NULL REFERENCES problems(problem_id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('solved', 'failed', 'review_needed')),
  duration_seconds INTEGER,
  difficulty_rating VARCHAR(10) CHECK (difficulty_rating IN ('easy', 'normal', 'hard')),
  failure_reason VARCHAR(20) CHECK (failure_reason IN ('algo', 'impl', 'time', 'edge')),
  solved_at TIMESTAMPTZ DEFAULT NOW(),
  next_review_date DATE,
  easiness_factor DECIMAL(4,2) DEFAULT 2.50 CHECK (easiness_factor >= 1.30),
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI usage tracking
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  flash_count INTEGER DEFAULT 0 CHECK (flash_count >= 0 AND flash_count <= 50),
  pro_count INTEGER DEFAULT 0 CHECK (pro_count >= 0 AND pro_count <= 10),
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_users_baekjoon_id ON users(baekjoon_id);
CREATE INDEX idx_problems_level ON problems(level);
CREATE INDEX idx_problems_tags ON problems USING GIN(tags);
CREATE INDEX idx_study_logs_user_next_review ON study_logs(user_id, next_review_date);
CREATE INDEX idx_study_logs_user_problem ON study_logs(user_id, problem_id);
CREATE INDEX idx_study_logs_user_status ON study_logs(user_id, status);
CREATE INDEX idx_study_logs_failure_reason ON study_logs(user_id, failure_reason)
  WHERE failure_reason IS NOT NULL;
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, date);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Study logs policies
CREATE POLICY "Users can view own logs" ON study_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON study_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON study_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- AI usage policies
CREATE POLICY "Users can view own AI usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI usage" ON ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI usage" ON ai_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Problems table is public (cached metadata)
-- No RLS needed
```
