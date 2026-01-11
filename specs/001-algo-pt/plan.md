# Implementation Plan: Algo-PT (Personalized Algorithm Personal Trainer)

**Branch**: `001-algo-pt` | **Date**: 2026-01-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-algo-pt/spec.md`

## Summary

AI 기반 개인화 알고리즘 학습 시스템. 브라우저 익스텐션이 백준에서 풀이 데이터를 자동 수집하고,
웹 대시보드에서 SM-2 기반 복습 스케줄링, 약점 분석, AI 힌트/코드 리뷰를 제공한다.

**핵심 컴포넌트:**
1. Chrome Extension - 백준 문제 풀이 자동 추적 (타이머, 결과 감지, 데이터 전송)
2. Web Dashboard - Next.js 기반 학습 관리 및 AI 코칭 인터페이스
3. Backend - Supabase (Auth, Database, Realtime)
4. AI Integration - Google Gemini API (Flash/Pro 듀얼 모드)

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend/Extension), SQL (Supabase)
**Primary Dependencies**:
- Frontend: Next.js 14+ (App Router), Tailwind CSS, Shadcn/ui
- Extension: Chrome Extension Manifest V3, React
- Backend: Supabase (PostgreSQL, Auth, Edge Functions)
- AI: Google Gemini API (gemini-2.0-flash, gemini-exp-1206)

**Storage**: Supabase PostgreSQL (managed)
**Testing**: Vitest (unit), Playwright (E2E), Jest (Extension)
**Target Platform**: Web (Chrome browser), Chrome Extension
**Project Type**: Web application (frontend + backend + extension)
**Performance Goals**:
- 팝업 표시: 제출 후 5초 이내
- AI 응답 시작: 3초 이내 (Flash 모드)
- 동시 사용자: 100명

**Constraints**:
- AI 일일 요청 제한: Flash 50회, Pro 10회
- 타이머 측정 오차: 1% 미만
- 학습 데이터: 영구 보존

**Scale/Scope**: 개인 사용자 ~ 100명 동시 접속

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. Clean Code & Readability | ✅ PASS | TypeScript + ESLint/Prettier 적용, 명확한 네이밍 규칙 준수 |
| II. Test-First Development | ✅ PASS | Vitest/Playwright로 테스트 우선 개발, 각 기능별 테스트 작성 |
| III. Complexity Analysis | ⚠️ PARTIAL | SM-2 알고리즘 복잡도 문서화 필요, API 응답 시간 분석 포함 |
| IV. Language Consistency | ⚠️ DEVIATION | Python → TypeScript (웹 앱이므로 정당화됨) |
| V. Problem Categorization & Documentation | ✅ PASS | 코드 구조화, API 문서화, 컴포넌트 문서화 |

**Deviation Justification (Principle IV):**
헌법은 알고리즘 풀이용 Python을 규정하지만, Algo-PT는 웹 애플리케이션이므로 TypeScript가 적합.
Next.js/React 생태계와 Supabase 클라이언트가 TypeScript를 최적 지원.

## Project Structure

### Documentation (this feature)

```text
specs/001-algo-pt/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API specs)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Web Dashboard (Next.js)
web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth routes (login, signup)
│   │   ├── dashboard/          # Main dashboard
│   │   ├── ai-coach/           # AI hint & review
│   │   └── settings/           # User settings
│   ├── components/
│   │   ├── ui/                 # Shadcn/ui components
│   │   ├── dashboard/          # Dashboard-specific components
│   │   └── ai/                 # AI chat components
│   ├── lib/
│   │   ├── supabase/           # Supabase client & utils
│   │   ├── sm2/                # SM-2 algorithm implementation
│   │   ├── gemini/             # Gemini API client
│   │   └── solved-ac/          # Solved.ac API client
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript type definitions
├── tests/
│   ├── unit/                   # Vitest unit tests
│   └── e2e/                    # Playwright E2E tests
└── public/

# Chrome Extension
extension/
├── src/
│   ├── background/             # Service worker
│   ├── content/                # Content scripts (BOJ injection)
│   ├── popup/                  # Extension popup UI
│   ├── lib/
│   │   ├── timer/              # Timer logic
│   │   ├── parser/             # BOJ DOM parser
│   │   └── storage/            # Chrome storage utils
│   └── types/
├── tests/
└── manifest.json               # Manifest V3

# Shared
packages/
└── shared/
    ├── types/                  # Shared TypeScript types
    └── constants/              # Shared constants
```

**Structure Decision**: Web application with separate Chrome extension.
Monorepo structure using pnpm workspaces for shared types between web and extension.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| TypeScript instead of Python (Principle IV) | Web application requires JS ecosystem | Python web frameworks (Django/FastAPI) lack Next.js의 풀스택 DX, Supabase 통합 |
| 3 projects (web, extension, shared) | Extension과 Web은 독립 배포 필요, 타입 공유 필요 | 단일 프로젝트는 Extension manifest와 Next.js 빌드 충돌 |
