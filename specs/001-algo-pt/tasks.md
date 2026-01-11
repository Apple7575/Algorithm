# Tasks: Algo-PT

**Input**: Design documents from `/specs/001-algo-pt/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo 초기화 및 기본 구조 설정

- [ ] T001 Initialize pnpm workspace with `pnpm-workspace.yaml` at repository root
- [ ] T002 Create `web/` Next.js 14 project with App Router (`pnpm create next-app@latest`)
- [ ] T003 [P] Create `extension/` Chrome Extension project with Manifest V3
- [ ] T004 [P] Create `packages/shared/` TypeScript package for shared types
- [ ] T005 [P] Configure root `package.json` with workspace scripts (dev, build, lint, test)
- [ ] T006 [P] Setup ESLint + Prettier configuration (root level, inherited by workspaces)
- [ ] T007 [P] Setup TypeScript configuration with project references (`tsconfig.json`)
- [ ] T008 Install shared dependencies: Tailwind CSS in `web/`, Shadcn/ui components

**Checkpoint**: pnpm workspaces 동작 확인 (`pnpm install`, `pnpm --filter web dev`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 의존하는 핵심 인프라 구축

**⚠️ CRITICAL**: 이 단계 완료 전까지 User Story 작업 불가

### Supabase & Database

- [ ] T009 Create Supabase project and configure environment variables in `web/.env.local`
- [ ] T010 Create SQL migration file `supabase/migrations/001_initial_schema.sql` from data-model.md
- [ ] T011 Apply migration and verify tables (users, problems, study_logs, ai_usage)
- [ ] T012 Configure RLS policies for users, study_logs, ai_usage tables
- [ ] T013 [P] Create Supabase client utilities in `web/src/lib/supabase/client.ts` (browser) and `server.ts` (SSR)

### Shared Types

- [ ] T014 [P] Create entity types in `packages/shared/types/entities.ts` (User, Problem, StudyLog, AIUsage)
- [ ] T015 [P] Create extension message types in `packages/shared/types/messages.ts` from contracts/extension-messages.ts
- [ ] T016 [P] Create API types in `packages/shared/types/api.ts` from contracts/api.yaml
- [ ] T017 Setup package exports in `packages/shared/index.ts` and build configuration

### Authentication

- [ ] T018 Setup Supabase Auth in `web/src/app/(auth)/login/page.tsx`
- [ ] T019 [P] Create signup page `web/src/app/(auth)/signup/page.tsx`
- [ ] T020 Create auth middleware `web/src/middleware.ts` for protected routes
- [ ] T021 Create auth context/hook `web/src/hooks/useAuth.ts` for client components
- [ ] T022 Create user profile sync trigger (Supabase function) to sync auth.users → public.users

### Base UI Components

- [ ] T023 [P] Install Shadcn/ui base components (Button, Card, Input, Dialog, Toast)
- [ ] T024 [P] Create layout component `web/src/app/layout.tsx` with navigation
- [ ] T025 [P] Create dashboard layout `web/src/app/dashboard/layout.tsx`

**Checkpoint**: 로그인/회원가입 동작, Supabase 연결, 공유 타입 import 확인

---

## Phase 3: User Story 1 - Automatic Problem Solving Tracking (Priority: P1) 🎯 MVP

**Goal**: Chrome Extension이 백준에서 문제 풀이를 자동 추적하고 데이터를 수집

**Independent Test**: 익스텐션 설치 후 백준에서 문제 제출 시 팝업 표시 및 데이터 저장 확인

### Extension Core Infrastructure

- [ ] T026 [US1] Create manifest.json with permissions (storage, tabs, host_permissions for acmicpc.net)
- [ ] T027 [US1] Setup Vite/Webpack build for extension in `extension/vite.config.ts`
- [ ] T028 [US1] Create background service worker `extension/src/background/index.ts`
- [ ] T029 [US1] Create chrome.storage utility `extension/src/lib/storage/index.ts`

### Timer Module

- [ ] T030 [US1] Implement timer logic in `extension/src/lib/timer/timer.ts` with start/pause/resume/stop
- [ ] T031 [US1] Implement timer persistence using chrome.storage.session in `extension/src/lib/timer/persistence.ts`
- [ ] T032 [US1] Create timer state management in background service worker

### BOJ DOM Parser

- [ ] T033 [US1] Create URL pattern matcher `extension/src/lib/parser/url.ts` for BOJ problem pages
- [ ] T034 [US1] Create submission result detector `extension/src/lib/parser/result.ts` using MutationObserver
- [ ] T035 [US1] Create problem ID extractor from URL/DOM

### Content Script

- [ ] T036 [US1] Create content script `extension/src/content/index.ts` with page detection
- [ ] T037 [US1] Implement tab visibility handler for timer pause/resume (Page Visibility API)
- [ ] T038 [US1] Implement message passing between content script and background

### Result Popup UI

- [ ] T039 [US1] Create popup base UI `extension/src/popup/App.tsx` with React
- [ ] T040 [US1] Create success popup component with difficulty rating (Easy/Normal/Hard)
- [ ] T041 [US1] Create failure popup component with failure reason (algo/impl/time/edge)
- [ ] T042 [US1] Implement popup trigger on submission result detection

### Data Submission

- [ ] T043 [US1] Create API client for study_logs in `extension/src/lib/api/studyLog.ts`
- [ ] T044 [US1] Implement offline queue for failed submissions `extension/src/lib/storage/queue.ts`
- [ ] T045 [US1] Create problem metadata fetcher (from Solved.ac or cache)

### Auth Token Sharing

- [ ] T046 [US1] Implement token receiver in extension from web dashboard message
- [ ] T047 [US1] Create auth status indicator in popup UI
- [ ] T048 [US1] Implement token refresh request flow

**Checkpoint**: 백준에서 문제 풀이 → 결과 감지 → 팝업 → 태깅 → DB 저장 전체 흐름 확인

---

## Phase 4: User Story 2 - Smart Review Scheduling (Priority: P2)

**Goal**: SM-2 알고리즘으로 복습 일정 계산 및 Today's Routine 표시

**Independent Test**: 대시보드에서 오늘 복습해야 할 문제 목록 확인

### SM-2 Algorithm

- [ ] T049 [US2] Implement SM-2 algorithm in `web/src/lib/sm2/algorithm.ts`
- [ ] T050 [US2] Create difficulty-to-quality mapping (Easy=5, Normal=4, Hard=3, Failed=2)
- [ ] T051 [US2] Create SM-2 update function that returns new EF, interval, next_review_date

### Dashboard - Today's Routine

- [ ] T052 [US2] Create dashboard home page `web/src/app/dashboard/page.tsx`
- [ ] T053 [US2] Create Today's Routine component `web/src/components/dashboard/TodaysRoutine.tsx`
- [ ] T054 [US2] Implement query for due reviews (next_review_date <= today) in Supabase
- [ ] T055 [US2] Create problem card component with problem info + SM-2 metadata
- [ ] T056 [US2] Add overdue indicator for past-due problems

### Review Flow Integration

- [ ] T057 [US2] Update study_log creation to calculate initial SM-2 values
- [ ] T058 [US2] Create review completion handler that updates SM-2 fields
- [ ] T059 [US2] Add "Mark as Reviewed" action from dashboard

**Checkpoint**: 문제 풀이 후 다음 날 대시보드에서 복습 문제 표시 확인

---

## Phase 5: User Story 3 - Weakness-Based Problem Recommendation (Priority: P3)

**Goal**: 실패 원인 분석으로 약점 파악 및 문제 추천

**Independent Test**: 여러 문제 실패 태깅 후 추천 섹션에서 관련 문제 표시 확인

### Weakness Analysis

- [ ] T060 [US3] Create failure reason aggregation query in `web/src/lib/supabase/queries/weakness.ts`
- [ ] T061 [US3] Implement weakness score calculation (failure count by tag)
- [ ] T062 [US3] Create weakness summary component `web/src/components/dashboard/WeaknessSummary.tsx`

### Problem Recommendation

- [ ] T063 [US3] Create recommendation algorithm in `web/src/lib/recommendation/algorithm.ts`
- [ ] T064 [US3] Implement problem fetcher from Solved.ac by tag and level range
- [ ] T065 [US3] Create recommendation component `web/src/components/dashboard/Recommendations.tsx`
- [ ] T066 [US3] Display recommendation reason (which weakness it addresses)

### Problem Cache

- [ ] T067 [US3] Create problems cache updater (7-day expiry check)
- [ ] T068 [US3] Implement batch problem metadata fetch `/api/problems/batch`

**Checkpoint**: 특정 태그 실패 누적 시 해당 태그 문제 추천 표시

---

## Phase 6: User Story 4 - AI Hint & Code Review (Priority: P4)

**Goal**: Gemini API 연동으로 힌트 및 코드 리뷰 제공

**Independent Test**: AI 코치 센터에서 힌트/리뷰 요청 및 응답 확인

### Gemini API Integration

- [ ] T069 [US4] Create Gemini client in `web/src/lib/gemini/client.ts`
- [ ] T070 [US4] Implement hint prompt template (no solution, direction only)
- [ ] T071 [US4] Implement code review prompt template
- [ ] T072 [US4] Create model selector (gemini-2.0-flash vs gemini-exp-1206)

### Rate Limiting

- [ ] T073 [US4] Create AI usage tracker in `web/src/lib/gemini/usage.ts`
- [ ] T074 [US4] Implement daily limit check (Flash: 50, Pro: 10) with ai_usage table
- [ ] T075 [US4] Create rate limit error response handler

### API Routes

- [ ] T076 [US4] Create `/api/ai/hint` route in `web/src/app/api/ai/hint/route.ts`
- [ ] T077 [US4] Create `/api/ai/review` route in `web/src/app/api/ai/review/route.ts`
- [ ] T078 [US4] Add auth middleware to AI routes

### AI Coach UI

- [ ] T079 [US4] Create AI Coach page `web/src/app/ai-coach/page.tsx`
- [ ] T080 [US4] Create mode toggle component (Flash/Pro)
- [ ] T081 [US4] Create hint request form with problem selector
- [ ] T082 [US4] Create code review form with code input
- [ ] T083 [US4] Create response display component with markdown rendering
- [ ] T084 [US4] Display remaining daily requests count

**Checkpoint**: AI 힌트/리뷰 요청 → 응답 표시, 일일 한도 도달 시 에러 표시

---

## Phase 7: User Story 5 - External Data Sync (Priority: P5)

**Goal**: Solved.ac에서 풀이 기록 동기화

**Independent Test**: Sync 버튼 클릭 시 Solved.ac 기록이 시스템에 추가됨 확인

### Solved.ac API Client

- [ ] T085 [US5] Create Solved.ac API client in `web/src/lib/solved-ac/client.ts`
- [ ] T086 [US5] Implement user problem history fetcher
- [ ] T087 [US5] Implement problem metadata fetcher

### Sync Logic

- [ ] T088 [US5] Create sync API route `/api/sync/solved-ac` in `web/src/app/api/sync/solved-ac/route.ts`
- [ ] T089 [US5] Implement duplicate detection logic
- [ ] T090 [US5] Create default values for synced problems (difficulty: normal, failure_reason: null)
- [ ] T091 [US5] Calculate initial SM-2 values for synced problems

### Settings UI

- [ ] T092 [US5] Create settings page `web/src/app/settings/page.tsx`
- [ ] T093 [US5] Add Baekjoon ID input field
- [ ] T094 [US5] Add Sync button with progress indicator
- [ ] T095 [US5] Display sync results (synced count, skipped count)

**Checkpoint**: 백준 ID 입력 → Sync → Solved.ac 기록 가져오기 확인

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 전체 시스템 완성도 향상

### Extension-Web Integration

- [ ] T096 [P] Implement web → extension token sharing via chrome.runtime.sendMessage
- [ ] T097 [P] Add "Connect Extension" button in web dashboard settings
- [ ] T098 [P] Create extension installation detection in web

### Error Handling & UX

- [ ] T099 [P] Add global error boundary in web app
- [ ] T100 [P] Implement toast notifications for success/error states
- [ ] T101 [P] Add loading skeletons for dashboard components
- [ ] T102 [P] Create offline indicator and retry logic in extension

### Documentation & Validation

- [ ] T103 Validate quickstart.md against actual setup process
- [ ] T104 [P] Add JSDoc comments to public APIs
- [ ] T105 Run full E2E test: signup → extension install → solve problem → review schedule

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phases 3-7 (User Stories)**: All depend on Phase 2 completion
  - Can proceed in priority order (P1 → P5)
  - US2-US5 can partially overlap with US1 after T045
- **Phase 8 (Polish)**: Depends on all core user stories

### Critical Path

```
T001 → T002-T008 (parallel) → T009-T025 (foundational)
    → T026-T048 (US1: Extension MVP) → T049-T059 (US2: SM-2)
    → T060-T068 (US3: Recommendations) → T069-T084 (US4: AI)
    → T085-T095 (US5: Sync) → T096-T105 (Polish)
```

### Parallel Opportunities

**Phase 1**: T002, T003, T004 can run in parallel
**Phase 2**: T013-T017 can run in parallel (different files)
**Phase 3**: T030-T032 (timer), T033-T035 (parser), T039-T042 (popup) can overlap
**Phase 4**: T049-T051 (SM-2) can start while US1 is being tested
**Phase 8**: Most tasks are independent and can run in parallel

---

## Implementation Strategy

### MVP First (Phase 1-3 Only)

1. Complete Setup + Foundational
2. Complete US1 (Extension tracking)
3. **STOP and VALIDATE**: Test full extension flow
4. Deploy web to Vercel, submit extension to Chrome Web Store

### Incremental Delivery

| Milestone | Phases | Deliverable |
|-----------|--------|-------------|
| M1: MVP | 1-3 | Extension + basic dashboard |
| M2: Smart Review | +4 | SM-2 scheduling |
| M3: Recommendations | +5 | Weakness analysis |
| M4: AI Coach | +6 | Gemini integration |
| M5: Full Sync | +7 | Solved.ac sync |
| M6: Production | +8 | Polish + launch |

---

## Notes

- [P] = 병렬 실행 가능 (파일 충돌 없음)
- [US#] = User Story 매핑
- 각 User Story는 독립적으로 테스트 가능해야 함
- 커밋은 논리적 단위로 (T001-T003 함께 등)
- Checkpoint에서 수동 검증 필수
