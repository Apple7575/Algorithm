# Quickstart: Algo-PT

이 가이드는 Algo-PT 개발 환경을 설정하고 첫 번째 기능을 실행하는 방법을 설명합니다.

## Prerequisites

- **Node.js**: 20.x LTS
- **pnpm**: 8.x+ (`npm install -g pnpm`)
- **Chrome**: 최신 버전 (Extension 테스트용)
- **Supabase CLI**: `npm install -g supabase` (선택)

## 1. Repository Setup

```bash
# Clone repository
git clone <repo-url>
cd Algorithm

# Install dependencies (all workspaces)
pnpm install

# Create environment files
cp web/.env.example web/.env.local
cp extension/.env.example extension/.env
```

## 2. Supabase Setup

### Option A: Supabase Cloud (권장)

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트 생성
2. Project Settings → API에서 키 복사
3. `.env.local` 파일 설정:

```env
# web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. SQL Editor에서 마이그레이션 실행:
   - `specs/001-algo-pt/data-model.md`의 SQL Migration 섹션 복사 후 실행

### Option B: Local Supabase (개발용)

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Get local credentials
supabase status
```

## 3. External API Keys

### Google Gemini API

1. [Google AI Studio](https://aistudio.google.com/)에서 API 키 생성
2. `.env.local`에 추가:

```env
GEMINI_API_KEY=your-gemini-api-key
```

### Solved.ac API

공개 API이므로 키가 필요 없습니다. Rate limiting에 주의하세요.

## 4. Development Servers

### Web Dashboard

```bash
# Start Next.js dev server
pnpm --filter web dev

# Open http://localhost:3000
```

### Chrome Extension

```bash
# Build extension (watch mode)
pnpm --filter extension dev

# Load in Chrome:
# 1. chrome://extensions 열기
# 2. "개발자 모드" 활성화
# 3. "압축해제된 확장 프로그램을 로드합니다" 클릭
# 4. extension/dist 폴더 선택
```

## 5. First Run Verification

### Web Dashboard 확인

1. http://localhost:3000 접속
2. "Sign Up" 클릭하여 계정 생성
3. 이메일 확인 (개발 환경에서는 Supabase Dashboard의 Auth → Users에서 확인)
4. 로그인 후 대시보드 표시 확인

### Extension 확인

1. Chrome 툴바에서 Extension 아이콘 클릭
2. "Connect to Dashboard" 또는 로그인 상태 확인
3. https://www.acmicpc.net/problem/1000 접속
4. 타이머 시작 확인 (Extension 팝업 또는 페이지 내 표시)

### 데이터 흐름 테스트

1. 백준에서 아무 문제나 풀이 (또는 제출)
2. Extension 팝업에서 결과 태깅
3. Web Dashboard에서 Study Log 확인
4. Today's Routine에 복습 문제 표시 확인 (다음 날)

## 6. Development Workflow

### 코드 구조

```
/
├── web/                 # Next.js 웹 대시보드
│   ├── src/app/         # App Router pages
│   ├── src/components/  # React components
│   └── src/lib/         # Utilities
├── extension/           # Chrome Extension
│   ├── src/background/  # Service worker
│   ├── src/content/     # Content scripts
│   └── src/popup/       # Popup UI
└── packages/shared/     # Shared types
```

### 주요 명령어

```bash
# 전체 타입 체크
pnpm typecheck

# 전체 린트
pnpm lint

# 전체 테스트
pnpm test

# 웹 빌드
pnpm --filter web build

# Extension 프로덕션 빌드
pnpm --filter extension build
```

### 커밋 컨벤션

```
feat(web): add AI hint request UI
feat(extension): implement timer persistence
fix(web): correct SM-2 calculation
docs(spec): update data model
```

## 7. Testing

### Unit Tests

```bash
# Web (Vitest)
pnpm --filter web test

# Extension (Jest)
pnpm --filter extension test
```

### E2E Tests

```bash
# Start all services first
pnpm dev

# Run Playwright tests
pnpm --filter web test:e2e
```

### Manual Testing Checklist

- [ ] 회원가입 / 로그인 / 로그아웃
- [ ] Extension에서 토큰 공유 확인
- [ ] 백준 문제 페이지에서 타이머 시작
- [ ] 탭 전환 시 타이머 일시정지
- [ ] 제출 결과 감지 및 팝업
- [ ] 체감 난이도 / 실패 원인 태깅
- [ ] Dashboard에서 Study Log 확인
- [ ] SM-2 복습 스케줄 계산
- [ ] AI 힌트 요청 (Flash 모드)
- [ ] AI 코드 리뷰 요청 (Pro 모드)
- [ ] 일일 요청 한도 도달 시 에러 처리
- [ ] Solved.ac 동기화

## 8. Deployment

### Web (Vercel)

```bash
# Vercel CLI
vercel

# Or connect GitHub repo to Vercel Dashboard
```

Environment Variables on Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

### Extension (Chrome Web Store)

1. `pnpm --filter extension build`
2. `extension/dist` 폴더를 ZIP으로 압축
3. Chrome Web Store Developer Dashboard에 업로드
4. 심사 대기 (보통 1-3일)

## Troubleshooting

### Extension이 웹과 통신하지 못함

- `manifest.json`의 `host_permissions`에 localhost와 production URL 확인
- 웹 대시보드의 CSP 설정 확인

### Supabase RLS 오류

- Supabase Dashboard → Authentication → Policies 확인
- 올바른 JWT 토큰이 전달되는지 확인

### Gemini API 429 오류

- 무료 티어 Rate limit 도달
- 잠시 후 재시도 또는 유료 플랜 업그레이드

### 백준 DOM 셀렉터 실패

- 백준 UI 업데이트 가능성
- `extension/src/lib/parser/` 셀렉터 업데이트 필요
