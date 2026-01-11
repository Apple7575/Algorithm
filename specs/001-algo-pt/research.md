# Research: Algo-PT

**Date**: 2026-01-12
**Feature**: 001-algo-pt

## 1. SM-2 Algorithm Implementation

### Decision
SuperMemo SM-2 알고리즘을 TypeScript로 직접 구현

### Rationale
- SM-2는 공개된 알고리즘으로 구현이 단순함 (50줄 미만)
- 외부 의존성 없이 커스터마이징 가능
- 체감 난이도(Easy/Normal/Hard)를 SM-2 quality rating(0-5)에 매핑

### Algorithm Details
```typescript
// SM-2 핵심 공식
// EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
// EF: Easiness Factor (최소 1.3)
// q: quality of response (0-5)

// 체감 난이도 매핑:
// Easy → q=5 (perfect response)
// Normal → q=4 (correct with hesitation)
// Hard → q=3 (correct with difficulty)
// Failed → q=2 (incorrect, remembered)

// 복습 간격 계산:
// n=1: interval = 1일
// n=2: interval = 6일
// n>2: interval = 이전간격 * EF
```

### Alternatives Considered
- **Anki's FSRS**: 더 정교하지만 구현 복잡도 높음 → 초기 버전에 과함
- **Leitner System**: 단순하지만 개인화 부족 → SM-2가 더 적합

---

## 2. Chrome Extension Architecture (Manifest V3)

### Decision
Service Worker 기반 Manifest V3 사용, React로 Popup UI 구현

### Rationale
- Manifest V2는 2024년부터 지원 중단 (Chrome Web Store 정책)
- Service Worker는 백그라운드 지속성이 없지만, 알람 API로 타이머 구현 가능
- React는 웹 대시보드와 컴포넌트 재사용 가능

### Key Implementation Patterns
```typescript
// 1. 탭 활성화 감지 (Page Visibility API)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseTimer();
  else resumeTimer();
});

// 2. 타이머 지속성 (chrome.storage.session)
// - sessionStorage 대신 chrome.storage.session 사용
// - 새로고침에도 유지, 브라우저 종료시 삭제

// 3. 결과 감지 (MutationObserver)
// - 백준 채점 결과 영역 DOM 변화 감시
// - "맞았습니다" / "틀렸습니다" 텍스트 파싱
```

### Alternatives Considered
- **Plasmo Framework**: 편리하지만 번들 크기 증가 → 수동 설정 선호
- **CRXJS Vite Plugin**: Vite 기반 빠른 개발 → 고려 가능하지만 pnpm 호환성 확인 필요

---

## 3. Supabase Authentication & Extension Token Sharing

### Decision
웹에서 로그인 후 인증 토큰을 Extension에 전달 (chrome.storage.local)

### Rationale
- Extension에서 OAuth 플로우 구현은 복잡함
- 웹에서 로그인 후 토큰 공유가 UX 측면에서 단순
- Supabase의 JWT는 Extension에서 직접 API 호출에 사용 가능

### Implementation Flow
```
1. 사용자가 Web Dashboard에서 Supabase Auth로 로그인
2. 로그인 성공 시, Web이 Extension에 메시지 전송 (chrome.runtime.sendMessage)
3. Extension이 토큰을 chrome.storage.local에 저장
4. Extension이 Supabase API 호출 시 저장된 토큰 사용
5. 토큰 만료 시 Web에서 갱신 후 다시 전달
```

### Security Considerations
- `chrome.storage.local`은 Extension 전용 (다른 Extension 접근 불가)
- 토큰은 Supabase JWT (서명 검증됨)
- HTTPS 통신 필수 (Content Security Policy)

---

## 4. Solved.ac API Integration

### Decision
Solved.ac 공개 API 사용 (비공식이지만 널리 사용됨)

### Rationale
- 문제 난이도, 태그, 사용자 풀이 기록 등 풍부한 데이터 제공
- 공식 API는 없지만 `https://solved.ac/api/v3/` 엔드포인트 안정적
- Rate limiting 존재하므로 캐싱 필요

### Key Endpoints
```
GET /api/v3/problem/show?problemId={id}
- 문제 메타데이터 (제목, 난이도, 태그)

GET /api/v3/user/show?handle={handle}
- 사용자 정보 (티어, 푼 문제 수)

GET /api/v3/user/problem_stats?handle={handle}
- 사용자 문제 풀이 통계
```

### Caching Strategy
- 문제 메타데이터: 7일 캐시 (난이도/태그는 자주 안 변함)
- 사용자 풀이 기록: 동기화 시에만 fetch, 이후 로컬 DB 우선

---

## 5. Google Gemini API Integration

### Decision
Gemini API 직접 호출 (Google AI Studio API Key 방식)

### Rationale
- Vertex AI보다 설정이 단순 (API Key만 필요)
- 개인 프로젝트 규모에 적합
- 무료 티어 존재 (Flash 모델)

### Model Selection
```typescript
// 빠른 모드 (Flash)
const flashModel = 'gemini-2.0-flash';
// - 빠른 응답 (1-2초)
// - 저렴한 비용
// - 단순 힌트에 적합

// 고급 모드 (Pro)
const proModel = 'gemini-exp-1206'; // 또는 최신 Pro 모델
// - 복잡한 분석
// - 코드 리뷰에 적합
// - 비용 높음
```

### Prompt Engineering (힌트용)
```text
시스템 프롬프트:
"당신은 알고리즘 튜터입니다. 절대로 정답 코드를 제공하지 마세요.
학생이 스스로 문제를 풀 수 있도록 힌트만 제공하세요.
힌트는 단계적으로 제공하며, 처음에는 추상적인 방향만 제시하세요."

사용자 요청 시:
"문제: {problem_description}
현재 접근: {user_approach if any}
힌트를 주세요."
```

### Rate Limiting Implementation
```typescript
// 일일 제한 추적
interface UserAIUsage {
  userId: string;
  date: string; // YYYY-MM-DD
  flashCount: number; // max 50
  proCount: number;   // max 10
}

// Supabase에 저장, 자정에 리셋
```

---

## 6. Baekjoon DOM Parsing

### Decision
MutationObserver + CSS Selector 기반 DOM 파싱

### Rationale
- 백준 페이지 구조가 비교적 안정적
- XPath보다 CSS Selector가 유지보수 용이
- MutationObserver로 SPA 스타일 변화 대응

### Key Selectors (acmicpc.net)
```typescript
// 문제 페이지 감지
const PROBLEM_URL_PATTERN = /^https:\/\/www\.acmicpc\.net\/problem\/(\d+)/;

// 문제 번호
const problemId = window.location.pathname.split('/')[2];

// 채점 결과 테이블
const RESULT_TABLE = '#status-table tbody tr:first-child';
const RESULT_TEXT = '.result-text';
// "맞았습니다!!", "틀렸습니다", "시간 초과" 등

// 제출 버튼
const SUBMIT_BUTTON = '#submit_button';
```

### Robustness
- 셀렉터 실패 시 graceful degradation (수동 입력 fallback)
- 버전 체크: Extension 업데이트 알림

---

## 7. Next.js 14 App Router Best Practices

### Decision
Server Components 기본, Client Components 필요시만 사용

### Rationale
- 초기 로드 성능 향상
- SEO 이점 (대시보드는 SEO 불필요하지만 패턴 일관성)
- Supabase SSR 클라이언트 활용

### Patterns
```typescript
// Server Component (기본)
// - 데이터 fetching
// - 정적 UI

// Client Component ('use client')
// - 인터랙티브 UI (타이머, 폼)
// - 브라우저 API 사용
// - useState, useEffect 필요시

// Supabase SSR
// - createServerClient for Server Components
// - createBrowserClient for Client Components
```

---

## 8. Monorepo Structure with pnpm

### Decision
pnpm workspaces로 모노레포 구성 (web, extension, shared)

### Rationale
- 타입 정의 공유 (User, Problem, StudyLog 등)
- 상수 공유 (API endpoints, error codes)
- 독립 배포 가능 (web → Vercel, extension → Chrome Web Store)

### Workspace Setup
```yaml
# pnpm-workspace.yaml
packages:
  - 'web'
  - 'extension'
  - 'packages/*'
```

```json
// packages/shared/package.json
{
  "name": "@algo-pt/shared",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

---

## Summary

모든 기술적 결정이 완료되었습니다. NEEDS CLARIFICATION 항목 없음.

| Topic | Decision | Confidence |
|-------|----------|------------|
| SM-2 Algorithm | TypeScript 직접 구현 | High |
| Extension Architecture | Manifest V3 + React | High |
| Auth Token Sharing | chrome.storage.local via message | High |
| Problem Metadata | Solved.ac API + 7일 캐시 | Medium (API 안정성) |
| AI Integration | Gemini API (Flash/Pro) | High |
| DOM Parsing | MutationObserver + CSS Selectors | Medium (DOM 변경 리스크) |
| Frontend Framework | Next.js 14 App Router | High |
| Monorepo | pnpm workspaces | High |
