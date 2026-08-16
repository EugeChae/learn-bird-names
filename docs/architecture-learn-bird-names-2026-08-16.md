# System Architecture: learn-bird-names

**Date:** 2026-08-16  
**Architect:** yjchae@a2d2.co.kr  
**Version:** 1.0  
**Project Type:** Web Game (반응형, PC + 모바일)  
**Project Level:** 2  
**Status:** Draft

---

## Document Overview

이 문서는 learn-bird-names의 시스템 아키텍처를 정의한다. PRD의 모든 FR·NFR을 충족하는 기술 청사진을 제공하며, Phase 2 서버 추가를 고려한 확장 가능한 구조를 지향한다.

**Related Documents:**
- PRD: `docs/prd-learn-bird-names-2026-08-15.md`
- Product Brief: `docs/product-brief-learn-bird-names-2026-08-09.md`

---

## Executive Summary

Phase 1은 백엔드 없는 완전 정적 Next.js 앱으로 구현한다. 모든 종 데이터는 번들 JSON으로 제공되며, 학습 진도는 브라우저 localStorage에 저장된다. Service Layer 추상화로 Phase 2 서버 추가 시 UI 코드 변경 없이 내부 구현만 교체할 수 있다.

---

## Architectural Drivers

PRD NFR 중 아키텍처를 결정하는 핵심 드라이버:

1. **NFR-003 (로컬 저장):** localStorage만 사용 → 백엔드 없이 완전 클라이언트 사이드로 구현 가능
2. **NFR-006 (무료 인프라):** 정적 호스팅만 가능 → Next.js static export 필수
3. **NFR-001 (성능):** 사진이 핵심 콘텐츠 → 이미지 최적화·지연 로딩이 주요 병목
4. **NFR-002 (Firefox 최우선):** CSS Grid/Flexbox 기준, Safari 전용 API 배제
5. **NFR-004 (라이선스):** 사진 표시 전 attribution 필드 필수 검증

---

## System Overview

### Architectural Pattern

**Client-Side SPA + Static Export (Layered Architecture)**

계층 간 명확한 의존성 방향을 유지한다: UI → Service → Data. 역방향 의존은 허용하지 않는다.

### Architecture Diagram

```
┌──────────────────────────────────────────────┐
│                 Browser                       │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │           Pages (Next.js App Router)   │  │
│  │   /          /quiz/[mode]   /progress  │  │
│  ├────────────────────────────────────────┤  │
│  │              UI Components             │  │
│  │  BirdCard  QuizCard   ProgressBoard    │  │
│  │  MatchingGame  TriviaCard  Modal       │  │
│  ├────────────────────────────────────────┤  │
│  │             Service Layer              │  │
│  │  SpeciesService    ProgressService     │  │
│  │  QuizService       SRSEngine           │  │
│  ├────────────────────────────────────────┤  │
│  │              Data Layer                │  │
│  │  /public/data/species.json (bundled)   │  │
│  │  LocalStorageAdapter                   │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘

Vercel (Static Hosting) → CDN → Browser
```

### Phase 2 전환 경로

```
Phase 1 (현재)          Phase 2 (추가)
Service Layer           Service Layer
  └─ JSON 파일 읽기  →    └─ fetch('/api/...') 로 교체
  └─ localStorage    →    └─ API 호출 로 교체
                     +  Next.js API Routes 추가
                     +  Database 연결
UI 컴포넌트: 변경 없음
```

---

## Technology Stack

### Frontend

**Choice:** Next.js 14 (App Router) + React 18

**Rationale:**
- Phase 2에서 `output: 'export'` 제거 후 API Routes 활성화만으로 서버 전환 가능 (레포 분리 불필요)
- App Router의 Server Components는 Phase 1 static export에서 Client Components로 폴백
- Vercel과 궁합 최적

**Trade-offs:**
- ✓ Phase 2 전환 비용 최소화
- ✗ Vite+React 대비 초기 설정 복잡도 소폭 높음

---

### Styling

**Choice:** Tailwind CSS v3

**Rationale:**
- 반응형 유틸리티 클래스로 375px~1920px 빠르게 대응
- Firefox/Chrome/Safari CSS 호환성 문제 없음
- 커스텀 CSS 최소화로 브라우저 간 렌더링 차이 억제

**Trade-offs:**
- ✓ 빠른 반응형 구현, 일관된 디자인 토큰
- ✗ 클래스명 길어짐; 컴포넌트 추출로 관리

---

### 데이터 저장

**Choice:** JSON 파일 (bundled) + localStorage

**Rationale:**
- Phase 1 서버 없음; 종 데이터 업데이트 주기가 낮음 (배포 주기와 동일)
- localStorage는 브라우저 표준; 추가 의존성 없음

**Trade-offs:**
- ✓ 런타임 fetch 없어 오프라인도 동작
- ✗ 데이터 업데이트 시 재배포 필요; 기기 간 진도 공유 불가 (Phase 2 해결)

---

### SRS 알고리즘

**Choice:** SM-2 경량 구현 (직접 작성, ~50줄)

**Rationale:**
- 외부 SRS 라이브러리는 localStorage 연동 커스터마이징이 어렵고 번들 사이즈 증가
- 힌트 사용/재시도 정답 등 커스텀 quality 점수 처리가 필요

**Trade-offs:**
- ✓ 알고리즘 튜닝 자유도 높음
- ✗ 초기 검증 필요; SM-2 unit test 필수

---

### 테스트

**Choice:** Vitest + React Testing Library

**Rationale:**
- Vite 기반으로 Next.js와 통합 쉬움; Jest보다 실행 속도 빠름
- React Testing Library는 사용자 관점 테스트 (구현 세부사항 불결합)

---

### 패키지 매니저 & 빌드

**Choice:** npm + Next.js 빌드

**Rationale:** Node.js 기본 포함; 1인 프로젝트에서 패키지 매니저 차이 무의미

---

### 배포

**Choice:** Vercel (무료 플랜)

**Rationale:**
- Next.js 공식 호스팅; main 브랜치 push → 자동 배포
- 무료 플랜으로 Phase 1 충분
- Phase 2 API Routes 추가 시 설정 변경 없이 서버리스 함수로 자동 전환

---

## System Components

### Component 1: Pages (Next.js App Router)

**Purpose:** URL 라우팅 및 레이아웃 관리

**Responsibilities:**
- `/` — 오늘의 새 (BirdOfDay) 화면
- `/quiz/[mode]` — 퀴즈 세션 (photo-to-name / name-to-photo / taxonomy)
- `/progress` — 진도 대시보드

**Dependencies:** UI Components, Service Layer

**FRs Addressed:** FR-004, FR-009, FR-017

---

### Component 2: UI Components

**Purpose:** 재사용 가능한 React 컴포넌트

**주요 컴포넌트:**

| 컴포넌트 | 역할 | FRs |
|---------|------|-----|
| `BirdCard` | 새 사진 + 이름 + 트리비아 표시 | FR-004, FR-005 |
| `QuizCard` | 문제 + 보기 4개 + 힌트 + 스트릭 | FR-007~011 |
| `PhotoGrid` | 이름→사진 모드 2x2 그리드 | FR-013 |
| `MatchingGame` | 세션 마무리 짝짓기 | FR-014 |
| `TaxonomyQuiz` | Taxonomy 3가지 유형 | FR-015 |
| `ProgressBoard` | 대시보드 + 취약종 목록 | FR-017 |
| `PhotoModal` | 사진 확대 뷰 | FR-012, FR-013 |

**Dependencies:** Service Layer (props로 데이터 수신)

---

### Component 3: Service Layer

**Purpose:** 비즈니스 로직 캡슐화 + Phase 2 전환 추상화 경계

**SpeciesService:**
```typescript
getAll(filters?: { status?: Status[], abundance?: Abundance[] }): Species[]
getById(id: string): Species
getRandom(excludeIds?: string[]): Species
getByDifficulty(tier: 1|2|3): Species[]
getDecoys(target: Species, count: 3): Species[]
```

**ProgressService:**
```typescript
getProgress(speciesId: string): SpeciesProgress | null
getAllProgress(): UserProgress
updateProgress(speciesId: string, quality: 0|1|2|3|4|5): void
getDueForReview(): Species[]
getWeakSpecies(limit: number): Species[]
resetAll(): void
```

**QuizService:**
```typescript
createSession(options: {
  mode: 'photo-to-name' | 'name-to-photo' | 'taxonomy'
  scope: 'all' | 'weak' | 'review' | 'habitat'
  size: number
}): QuizSession
nextQuestion(session: QuizSession): Question
submitAnswer(session: QuizSession, answer: string, usedHint: boolean): AnswerResult
getMatchingRound(session: QuizSession): MatchingRound
```

**SRSEngine:**
```typescript
calculate(current: SpeciesProgress, quality: 0|1|2|3|4|5): SpeciesProgress
// quality 기준:
// 0 = 오답
// 1 = 재시도 후 정답 (약한 정답)
// 2 = 힌트 사용 후 정답 (약한 정답)
// 3~5 = 1번에 정답 (난이도별 차등)
```

**FRs Addressed:** FR-007~018 전체

---

### Component 4: Data Layer

**Purpose:** 데이터 소스 추상화

**SpeciesDataSource:**
- `/public/data/species.json` 로드
- 라이선스 미기재 항목 필터링 (NFR-004)
- 빌드 시 번들, 런타임 fetch 없음

**LocalStorageAdapter:**
- `UserProgress` 직렬화/역직렬화
- 파싱 실패 시 예외 포착 → UI에 초기화 안내 전달 (NFR-003)
- 키: `learn-bird-names:progress`

---

## Data Architecture

### Data Model

```typescript
interface Species {
  id: string                    // "pica-pica"
  name_korean: string           // "까치"
  name_latin: string            // "Pica pica"
  name_english: string          // "Eurasian Magpie"
  order: string                 // "참새목"
  family: string                // "까마귀과"
  habitat: string[]             // ["도심", "농경지"]
  difficulty_tier: 1 | 2 | 3   // 1=쉬움, 3=어려움
  abundance: "ab" | "c" | "uc" | "sc" | "r"
  // ab=많음 / c=흔함 / uc=흔하지않음 / sc=적음 / r=희귀함
  status: Status[]              // 복수 가능 (예: ["SV", "PM"])
  media: SpeciesMedia[]
  trivia: SpeciesTrivia[]
}

type Status = "Res" | "SV" | "WV" | "PM" | "Vag" | "Probably extinct"
// Res=텃새 / SV=여름철새 / WV=겨울철새 / PM=나그네새 / Vag=길잃은새

interface SpeciesMedia {
  url: string
  sex: "male" | "female" | "unknown"
  age: "adult" | "juvenile" | "unknown"
  plumage: "breeding" | "nonbreeding" | "unknown"
  angle: "perched" | "flying" | "swimming" | "unknown"
  license: string               // "CC BY-NC 4.0"
  attribution: string           // "© John Doe / iNaturalist"
  quality_score: 1 | 2 | 3
}

interface SpeciesTrivia {
  content: string
  type: "ecology" | "identification" | "seasonal"
  trivia_source: string         // 출처 필수 (AI 생성 금지)
}

interface SpeciesProgress {
  correct_count: number
  incorrect_count: number
  last_seen: string             // ISO date
  next_review: string           // ISO date
  easiness_factor: number       // SM-2 EF, 초기값 2.5
  interval_days: number
  last_quality: 0 | 1 | 2 | 3 | 4 | 5
}

type UserProgress = Record<string, SpeciesProgress>
```

### Database Design

Phase 1: 파일 시스템 (JSON) + localStorage

```
/public/data/
  species.json          # 전체 종 마스터 데이터

localStorage:
  learn-bird-names:progress    # UserProgress JSON
```

Phase 2 전환 시 동일 스키마를 PostgreSQL 테이블로 이전.

### Data Flow

```
읽기 경로:
species.json → SpeciesService → QuizService → QuizCard (UI)

쓰기 경로:
QuizCard → submitAnswer() → SRSEngine.calculate() → 
ProgressService.updateProgress() → LocalStorageAdapter → localStorage

진도 조회:
ProgressBoard → ProgressService.getAllProgress() → 
LocalStorageAdapter → localStorage
```

---

## API Design

### Service Layer Interface (Phase 1 내부 API)

Phase 1은 REST API 없음. Service Layer가 내부 API 역할. Phase 2에서 각 메서드가 `fetch('/api/...')` 형태로 교체됨.

### Phase 2 예상 REST Endpoints

```
GET  /api/species               전체 종 목록 (필터 파라미터)
GET  /api/species/:id           단일 종 조회

GET  /api/users/:id/progress    진도 조회
POST /api/users/:id/progress    진도 업데이트
DEL  /api/users/:id/progress    진도 초기화

POST /api/auth/register         회원가입
POST /api/auth/login            로그인 (JWT 반환)
```

### Authentication & Authorization

Phase 1: 없음 (localStorage, 인증 불필요)  
Phase 2: JWT (httpOnly 쿠키) + Next.js Middleware로 라우트 보호

---

## Non-Functional Requirements Coverage

### NFR-001: 성능

**Requirement:** 퀴즈 화면 전환 200ms 이내, Cold Start 3G 3초 이내, Lighthouse 80+

**Architecture Solution:**
- Next.js `<Image>` 컴포넌트: WebP 자동 변환 + `sizes` 속성으로 모바일/PC 해상도 분기
- species.json 빌드 시 번들 → 런타임 fetch 없음
- 퀴즈 컴포넌트 lazy import (`dynamic()`)로 초기 번들 분리
- 사진 `loading="lazy"` + `priority` 속성 조합

**Validation:** Vercel Analytics + Lighthouse CI (PR 빌드 시 자동 측정)

---

### NFR-002: 반응형 UI (Firefox 최우선)

**Requirement:** Firefox PC+모바일 최우선, 375px~1920px 지원

**Architecture Solution:**
- Tailwind CSS Grid/Flexbox 기반 (브라우저 간 호환성 높음)
- Safari 전용 CSS 속성 (`-webkit-*`) 사용 금지 원칙
- QA 우선순위: Firefox PC → Firefox Android → Chrome → Safari

**Validation:** Firefox DevTools로 1차 QA; BrowserStack 무료 플랜으로 크로스 브라우저 확인

---

### NFR-003: 로컬 저장 내구성

**Requirement:** 브라우저 재시작 후 진도 유지, 손상 시 안내

**Architecture Solution:**
- `LocalStorageAdapter`가 try-catch로 파싱 실패 포착
- 실패 시 `ProgressCorruptedError` throw → 상위 UI에서 "진도 초기화" 안내 모달 표시
- localStorage 키 네임스페이스: `learn-bird-names:progress` (타 앱과 충돌 방지)

**Validation:** 단위 테스트에서 손상된 JSON 주입 시나리오 검증

---

### NFR-004: 사진 라이선스 준수

**Requirement:** license/attribution 필드 없는 사진 표시 금지

**Architecture Solution:**
- `SpeciesService.getAll()` 내부에서 `media` 배열 필터링: `attribution`이 빈 문자열이면 해당 사진 제외
- 빌드 시 데이터 검증 스크립트 (`scripts/validate-data.js`) 실행: 위반 항목 있으면 빌드 실패

**Validation:** validate-data.js CI 통합; 런타임에도 SpeciesService 필터링 이중 적용

---

### NFR-005: 접근성

**Requirement:** 키보드 접근 가능, 색상 외 텍스트 피드백, 아이콘 최소화

**Architecture Solution:**
- 퀴즈 보기에 키보드 단축키 1~4 바인딩
- 정답/오답: 색상 + "정답입니다" / "틀렸습니다" 텍스트 병행
- `<button>`, `<a>` 만 클릭 가능 (div onClick 금지)
- 아이콘 사용 시 `aria-label` 또는 인접 텍스트 레이블 필수

---

### NFR-006: 무료 인프라

**Requirement:** 유료 API/호스팅 없이 운영

**Architecture Solution:**
- Vercel 무료 플랜 (월 100GB 대역폭, Phase 1 충분)
- 외부 API 호출 없음 (데이터 전부 번들)
- 이미지: iNaturalist/GBIF에서 수집 후 `/public/images/`에 직접 저장 (CDN 의존 없음)

---

## Security Architecture

### Authentication

Phase 1: 없음  
Phase 2: JWT (httpOnly 쿠키, 7일 만료) + Refresh Token

### Authorization

Phase 1: 없음 (단일 사용자, 로컬 데이터)

### Data Encryption

- 전송 중: Vercel HTTPS 기본 제공 (TLS 1.3)
- 저장 중: localStorage 암호화 불필요 (개인 진도 데이터, 민감 정보 없음)

### Security Best Practices

- `dangerouslySetInnerHTML` 사용 금지
- `next.config.js` `images.remotePatterns`에 iNaturalist/GBIF 도메인만 허용
- 트리비아 콘텐츠: AI 생성 금지, 수동 검수 (데이터 무결성 정책)
- Content Security Policy 헤더: Vercel `next.config.js`에 설정

---

## Scalability & Performance

### Scaling Strategy

Phase 1: 정적 파일 CDN 서빙 → Vercel Edge Network 자동 적용  
Phase 2: Next.js 서버리스 함수 수평 확장 (Vercel 자동 처리)

### Performance Optimization

- 이미지: WebP + `sizes` 속성 + lazy loading
- 번들: Dynamic import로 퀴즈 모드별 코드 분할
- species.json: 전체 로드 후 메모리 캐싱 (세션 중 재요청 없음)
- SRS 계산: 동기 연산, async 불필요

### Caching Strategy

- 정적 자산 (JS/CSS/이미지): Vercel CDN 캐시 (긴 TTL + 콘텐츠 해시)
- species.json: 앱 초기화 시 메모리에 로드, 세션 유지
- 진도 데이터: localStorage (영구)

---

## Reliability & Availability

### High Availability

Vercel Edge Network이 자동으로 다중 리전 서빙. 정적 앱이므로 단일 장애점 없음.

### Disaster Recovery

- 코드: GitHub 레포 (백업 역할)
- 사용자 진도: localStorage (기기 단위 저장, 서버 백업 없음 — Phase 2에서 해결)
- 데이터: species.json은 레포에 포함

### Monitoring

- Vercel Analytics: 페이지뷰, 성능 측정
- 에러 모니터링: Phase 2에서 Sentry 추가 예정
- Phase 1: 콘솔 에러 수동 모니터링

---

## Development Architecture

### Code Organization

```
learn-bird-names/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 오늘의 새
│   ├── quiz/
│   │   └── [mode]/page.tsx
│   └── progress/page.tsx
├── components/             # UI 컴포넌트
│   ├── bird/
│   ├── quiz/
│   └── progress/
├── services/               # Service Layer
│   ├── species.service.ts
│   ├── progress.service.ts
│   ├── quiz.service.ts
│   └── srs.engine.ts
├── lib/                    # 유틸리티
│   └── localStorage.adapter.ts
├── types/                  # TypeScript 타입
│   └── index.ts
├── public/
│   └── data/
│       └── species.json
└── scripts/
    └── validate-data.js    # 빌드 전 데이터 검증
```

### Testing Strategy (TDD 적용 기준)

**TDD 적용 레이어 (테스트 먼저 작성):**

| 레이어 | 유형 | 도구 | 우선순위 |
|--------|------|------|---------|
| SRSEngine | Unit | Vitest | 최우선 — 핵심 알고리즘 |
| QuizService | Unit | Vitest | 오답 보기 생성 로직 |
| ProgressService | Unit + Integration | Vitest | localStorage mock |
| SpeciesService | Unit | Vitest | 필터/라이선스 검증 |
| UI Components | Component | React Testing Library | 퀴즈 핵심 경로만 |

**TDD 미적용 레이어:** Pages(라우팅), Tailwind 스타일, species.json 데이터 내용

**커버리지 목표:** Service Layer 80%+; UI 50%+

### CI/CD Pipeline

```
GitHub push (main)
  → GitHub Actions
      1. pnpm install
      2. scripts/validate-data.js (데이터 무결성)
      3. vitest run (테스트)
      4. next build (빌드)
      5. Lighthouse CI (성능 점수 확인)
  → Vercel 자동 배포 (Actions 통과 후)
```

### Environments

| 환경 | URL | 용도 |
|------|-----|------|
| Development | localhost:3000 | 로컬 개발 |
| Production | learn-bird-names.vercel.app | 배포 |

Phase 1은 Staging 환경 불필요.

---

## Requirements Traceability

### Functional Requirements Coverage

| FR ID | FR 이름 | 담당 컴포넌트 |
|-------|---------|------------|
| FR-001 | 종 마스터 데이터 | SpeciesService, species.json |
| FR-002 | 종별 복수 사진 | SpeciesService, SpeciesMedia 스키마 |
| FR-003 | 트리비아 데이터 | SpeciesService, SpeciesTrivia 스키마 |
| FR-004 | 오늘의 새 표시 | `/` Page, BirdCard |
| FR-005 | 오늘의 새 트리비아 | BirdCard, TriviaCard |
| FR-006 | 오늘의 새 → 퀴즈 진입 | BirdCard → `/quiz/[mode]` |
| FR-007 | 4지선다 출제 | QuizService.nextQuestion(), QuizCard |
| FR-008 | 즉각 피드백 + 재시도 | QuizService.submitAnswer(), QuizCard |
| FR-009 | 세션 흐름 | QuizService.createSession(), `/quiz/[mode]` Page |
| FR-010 | 힌트 | QuizCard, SRSEngine (quality 감소) |
| FR-011 | 연속 정답 스트릭 | QuizCard (로컬 상태) |
| FR-012 | 사진→이름 모드 | QuizService (mode: photo-to-name), QuizCard |
| FR-013 | 이름→사진 모드 | QuizService (mode: name-to-photo), PhotoGrid |
| FR-014 | 세션 마무리 짝짓기 | QuizService.getMatchingRound(), MatchingGame |
| FR-015 | Taxonomy 퀴즈 | QuizService (mode: taxonomy), TaxonomyQuiz |
| FR-016 | SRS | SRSEngine, ProgressService |
| FR-017 | 진도 대시보드 | ProgressService, ProgressBoard, `/progress` Page |
| FR-018 | 퀴즈 범위 필터 | QuizService.createSession(scope), 필터 UI |

### Non-Functional Requirements Coverage

| NFR ID | NFR 이름 | 솔루션 | 검증 방법 |
|--------|---------|--------|---------|
| NFR-001 | 성능 | Next.js Image + lazy import + 번들 JSON | Lighthouse CI |
| NFR-002 | Firefox 최우선 | Tailwind + Safari 전용 API 금지 | Firefox DevTools QA |
| NFR-003 | 로컬 저장 | LocalStorageAdapter + 파싱 에러 처리 | Vitest 손상 JSON 시나리오 |
| NFR-004 | 라이선스 준수 | validate-data.js + SpeciesService 필터 | CI 빌드 게이트 |
| NFR-005 | 접근성 | semantic HTML + 키보드 단축키 + 텍스트 피드백 | 수동 QA |
| NFR-006 | 무료 인프라 | Vercel 무료 + 번들 데이터 | 비용 모니터링 |

---

## Trade-offs & Decision Log

### ADR-001: Next.js static export 선택
**Status:** Accepted  
**Context:** Phase 1 서버 불필요 + 무료 호스팅 제약 + Phase 2 서버 전환 고려  
**Decision:** `next.config.js`에 `output: 'export'` 설정으로 완전 정적 빌드  
**Consequences:**
- Phase 2에서 `output: 'export'` 제거 후 API Routes 활성화만으로 전환
- static export 모드에서 Next.js Image 최적화는 빌드 타임에만 동작 (런타임 변환 없음)

### ADR-002: SM-2 알고리즘 직접 구현
**Status:** Accepted  
**Context:** 외부 SRS 라이브러리(ts-fsrs 등)는 localStorage 연동 커스터마이징 어렵고 번들 사이즈 증가. 힌트/재시도 등 커스텀 quality 점수 처리 필요  
**Decision:** SM-2 핵심 공식만 `srs.engine.ts`에 경량 구현 (~50줄)  
**Consequences:**
- 알고리즘 튜닝 자유도 높음
- SRSEngine 단위 테스트 필수 (quality 0~5 시나리오 전체 검증)

### ADR-003: 데이터를 번들 JSON으로 관리
**Status:** Accepted  
**Context:** Phase 1 무료 인프라, 서버 없음. 종 데이터 업데이트 주기 낮음  
**Decision:** `species.json`을 `/public/data/`에 배치, 빌드 시 포함  
**Consequences:**
- 런타임 API 호출 없어 오프라인 동작
- 데이터 업데이트 시 재배포 필요 (종 추가 = 새 배포)

### ADR-004: abundance/status 표준 코드 사용
**Status:** Accepted  
**Context:** 자체 숫자 스케일(1-5) 대신 Birds Korea 체크리스트 표준 코드 사용  
**Decision:** `abundance: "ab"|"c"|"uc"|"sc"|"r"`, `status: Status[]` (복수 허용)  
**Consequences:**
- 실제 조류 관찰 기록과 데이터 호환성 확보
- `status` 배열로 SV+PM 같은 복합 상태 자연스럽게 처리

---

## Open Issues & Risks

| 이슈 | 영향 | 대응 |
|------|------|------|
| 짝짓기 UI 인터랙션 방식 미정 | FR-014 | 드래그앤드롭 vs 탭-투-매치 → UX 설계 단계에서 결정 |
| Taxonomy 잠금 해제 기준 20종 적절성 | FR-015 | 실제 사용 후 조정 가능 |
| iNaturalist 사진 URL 영속성 | NFR-004 | 외부 URL 의존 시 링크 깨짐 위험 → `/public/images/`에 직접 저장 권장 |
| validate-data.js 스크립트 구현 | NFR-004 | Architecture 이후 별도 작성 필요 |

---

## Assumptions & Constraints

- Node.js 18+ 로컬 개발 환경
- GitHub 레포 + Vercel 연동 (무료 플랜)
- 사진은 `/public/images/`에 직접 저장 (외부 URL 의존 최소화)
- species.json 초기 데이터: 수동 큐레이션 (NIBR/iNaturalist 참조)

---

## Future Considerations

- **Phase 2:** `output: 'export'` 제거 → API Routes 활성화 → PostgreSQL 연결 → 계정 시스템
- **Phase 2:** Sentry 에러 모니터링 추가
- **Phase 2:** 울음소리 필드 (`audio` in SpeciesMedia) 스키마에 미리 예약 가능
- **Phase 3:** 외국 새 확장 시 `region` 필드 추가

---

## Approval & Sign-off

**Review Status:**
- [ ] Product Owner

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-16 | yjchae@a2d2.co.kr | Initial architecture |

---

## Next Steps

### Phase 4: Sprint Planning & Implementation

`/bmad:sprint-planning`을 실행해 Epic을 상세 스토리로 분해하고 구현을 시작한다.

**구현 원칙:**
1. Service Layer 인터페이스를 먼저 정의하고 테스트 작성 (TDD)
2. SRSEngine부터 구현 시작 — 가장 핵심적이고 테스트 가능한 단위
3. species.json 스키마는 이 문서의 타입 정의를 그대로 사용
4. UI 컴포넌트는 Service Layer 완성 후 연결

**완성된 기획 문서:**
- ✓ Product Brief
- ✓ PRD
- ✓ Architecture

---

*BMAD Method v6 — Phase 3 (Solutioning) — System Architect*

---

## Appendix A: Technology Evaluation Matrix

| 카테고리 | 후보 | 선택 이유 |
|---------|------|---------|
| 프레임워크 | Next.js vs Vite+React vs SvelteKit | Next.js — Phase 2 서버 전환 비용 최소 |
| SRS | ts-fsrs vs 직접구현 | 직접구현 — 커스텀 quality 처리, 번들 경량화 |
| 스타일링 | Tailwind vs CSS Modules vs styled-components | Tailwind — 반응형 속도, 브라우저 호환 |
| 테스트 | Vitest vs Jest | Vitest — 빌드 속도, Vite 생태계 |
| 배포 | Vercel vs GitHub Pages vs Netlify | Vercel — Next.js 공식, API Routes 전환 준비 |

---

## Appendix B: Phase 2 Migration Checklist

Phase 2 서버 추가 시 변경 항목:

```
[ ] next.config.js: output: 'export' 제거
[ ] SpeciesService: JSON 읽기 → fetch('/api/species')
[ ] ProgressService: localStorage → fetch('/api/users/:id/progress')
[ ] app/api/ 폴더 생성 (API Routes)
[ ] Database 연결 설정
[ ] 인증 미들웨어 추가
[ ] UI 컴포넌트: 변경 없음
```
