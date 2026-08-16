# Sprint Plan: learn-bird-names

**Date:** 2026-08-16  
**Scrum Master:** yjchae@a2d2.co.kr  
**Project Level:** 2  
**Total Stories:** 16  
**Total Points:** 36pt  
**Planned Sprints:** 3  
**Team Capacity:** 8pt / 2주 (8h/주 × 1인 시니어)  
**목표 완료:** 2026년 10월 중순

---

## Executive Summary

1인 개발, 주 8시간 이하 투입을 기준으로 3 스프린트로 구성한다.  
Sprint 1은 8/31까지 동작하는 사진→이름 퀴즈 프로토타입을 목표로 하며, Sprint 2는 SRS 통합과 전체 학습 경험을, Sprint 3은 Taxonomy 퀴즈와 완성·배포를 담당한다.

**⚠️ 데이터 큐레이션 별도 관리:**  
`species.json` 30종 데이터 입력(사진 수집·라이선스 확인·트리비아 작성)은 개발 스토리 포인트에서 제외한다. 30종 × 15~30분 = 약 8~15시간 추가 필요. Sprint 1 기간 중 개발과 병행해야 프로토타입이 가능하다.

**Key Metrics:**
- Total Stories: 16
- Total Points: 36pt
- Sprints: 3 (2주 + 3주 + 3주 = 8주)
- 스프린트 용량: 8pt/2주 (1pt = 2h 기준)
- 목표 완료: 2026년 10월 12일

---

## Story Inventory

---

### STORY-001: 프로젝트 세팅

**Epic:** EPIC-001 (종 데이터 시스템)  
**Priority:** Must Have  
**Points:** 1pt (2h)

**User Story:**  
As a 개발자,  
I want Next.js + Tailwind + Vitest + 폴더 구조가 완성된 기반,  
So that 이후 모든 스토리를 일관된 구조 위에서 구현할 수 있다.

**Acceptance Criteria:**
- [ ] `npx create-next-app`으로 Next.js 14 App Router 프로젝트 생성
- [ ] Tailwind CSS 설정 완료 (Firefox 우선, Safari 전용 속성 미사용)
- [ ] Vitest + React Testing Library 설치 및 샘플 테스트 통과
- [ ] `services/`, `components/`, `types/`, `public/data/`, `scripts/` 폴더 구조 생성
- [ ] `next.config.js`에 `output: 'export'` 설정

**Technical Notes:**  
`next.config.js`의 `images.remotePatterns`에 iNaturalist/GBIF 도메인 허용. TypeScript strict mode 활성화.

**Dependencies:** 없음

---

### STORY-002: Species 타입 정의 + JSON 스키마

**Epic:** EPIC-001  
**Priority:** Must Have  
**Points:** 1pt (2h)

**User Story:**  
As a 개발자,  
I want Species, SpeciesMedia, SpeciesTrivia TypeScript 타입과 JSON 스키마,  
So that 데이터 입력과 서비스 구현 시 타입 안전성을 확보할 수 있다.

**Acceptance Criteria:**
- [ ] `types/index.ts`에 `Species`, `SpeciesMedia`, `SpeciesTrivia`, `UserProgress`, `SpeciesProgress` 타입 정의
- [ ] `abundance: "ab"|"c"|"uc"|"sc"|"r"` 타입 포함
- [ ] `status: ("Res"|"SV"|"WV"|"PM"|"Vag"|"Probably extinct")[]` 타입 포함
- [ ] `public/data/species.json`에 최소 2종 샘플 데이터 작성 (구조 검증용)
- [ ] `trivia_source` 필드 없는 트리비아는 TypeScript 컴파일 오류 발생

**Technical Notes:**  
샘플 데이터 2종은 여름철새(SV) 1종 + 텃새(Res) 1종으로 구성해 두 status 유형을 검증.

**Dependencies:** STORY-001

---

### STORY-003: SpeciesService 구현 + 단위 테스트

**Epic:** EPIC-001  
**Priority:** Must Have  
**Points:** 2pt (4h)

**User Story:**  
As a QuizService / UI 컴포넌트,  
I want SpeciesService를 통해 종 데이터를 조회하고 오답 보기를 생성,  
So that 퀴즈 로직이 데이터 출처를 직접 참조하지 않아도 된다.

**Acceptance Criteria:**
- [ ] `getAll(filters?)` — abundance, status 필터 지원
- [ ] `getById(id)` — 단일 종 조회
- [ ] `getRandom(excludeIds?)` — 중복 제외 랜덤 선택
- [ ] `getDecoys(target, count: 3)` — difficulty_tier 기반 오답 보기 3개 생성
- [ ] `attribution` 미기재 사진은 자동 필터링 (NFR-004)
- [ ] 위 메서드 전체 단위 테스트 작성 및 통과

**Technical Notes:**  
`getDecoys`의 오답 보기 거리감: difficulty_tier 1 → 다른 目, tier 2 → 같은 目 다른 科, tier 3 → 같은 科 유사종. species.json을 모듈 레벨에서 한 번 로드해 메모리 캐싱.

**Dependencies:** STORY-001, STORY-002

---

### STORY-004: validate-data.js + GitHub Actions CI

**Epic:** EPIC-001  
**Priority:** Should Have  
**Points:** 1pt (2h)

**User Story:**  
As a 개발자,  
I want 데이터 무결성 검증과 CI 파이프라인,  
So that 라이선스 미기재 사진이나 출처 없는 트리비아가 배포에 포함되지 않는다.

**Acceptance Criteria:**
- [ ] `scripts/validate-data.js` — `attribution` 빈 문자열, `trivia_source` 빈 문자열 항목 검출 시 빌드 실패
- [ ] GitHub Actions: lint → validate-data → vitest → next build 순서로 실행
- [ ] main 브랜치 push 시 자동 실행

**Technical Notes:**  
Vercel 자동 배포는 GitHub Actions 통과 후에만 트리거.

**Dependencies:** STORY-001, STORY-002

---

### STORY-005: 오늘의 새 홈 화면 + BirdCard

**Epic:** EPIC-002 (오늘의 새)  
**Priority:** Must Have  
**Points:** 2pt (4h)

**User Story:**  
As a 초보 탐조인,  
I want 앱에 들어올 때마다 새로운 새와 트리비아를 만나고,  
So that 매 방문이 작은 발견이 되어 재방문 동기가 생긴다.

**Acceptance Criteria:**
- [ ] 앱 진입 시 랜덤 종 선택 (방문마다 새로 랜덤)
- [ ] BirdCard: 새 사진 + 한국 공식명 표시
- [ ] TriviaCard: 트리비아 1개 + 유형 레이블(생태/식별/계절) 표시
- [ ] "퀴즈 시작" 버튼 클릭 시 모드 선택 → 퀴즈 진입
- [ ] 모바일(375px) + PC(1280px) 레이아웃 정상

**Technical Notes:**  
BirdCard와 TriviaCard는 별도 컴포넌트로 분리. SpeciesService.getRandom()으로 종 선택.

**Dependencies:** STORY-003

---

### STORY-006: TriviaCard 컴포넌트

**Epic:** EPIC-002  
**Priority:** Should Have  
**Points:** 1pt (2h)

**User Story:**  
As a 학습자,  
I want 트리비아 카드에서 유형과 출처를 확인,  
So that 정보 신뢰도를 가늠하고 더 알아볼 수 있다.

**Acceptance Criteria:**
- [ ] 트리비아 유형 뱃지 표시 (생태 / 식별 / 계절)
- [ ] 출처(`trivia_source`) 말줄임 + 탭 시 전체 표시
- [ ] 종에 트리비아가 여러 개면 랜덤 1개 표시

**Dependencies:** STORY-005

---

### STORY-007: SRSEngine TDD — SM-2 경량 구현

**Epic:** EPIC-003 (퀴즈 엔진)  
**Priority:** Must Have  
**Points:** 2pt (4h)

**User Story:**  
As a ProgressService,  
I want SRSEngine.calculate(progress, quality)로 다음 복습일과 EF를 계산,  
So that 학습자가 틀린 새는 자주, 맞힌 새는 점점 드물게 만나게 된다.

**Acceptance Criteria:**
- [ ] SM-2 알고리즘 구현: EF 업데이트 + interval_days 계산 + next_review 날짜 반환
- [ ] quality 기준: 0=오답, 1=재시도정답, 2=힌트정답, 3~5=1번정답
- [ ] quality 0 → interval 초기화; quality 1,2 → 소폭 증가; quality 3~5 → 표준 증가
- [ ] **테스트 먼저 작성 후 구현 (TDD)**
- [ ] quality 0~5 시나리오 전체 단위 테스트 통과
- [ ] EF가 1.3 아래로 떨어지지 않는 하한 보장

**Technical Notes:**  
`services/srs.engine.ts` 순수 함수로 구현 (~50줄). 사이드 이펙트 없음 → 테스트 용이.

**Dependencies:** STORY-001

---

### STORY-008: ProgressService + LocalStorageAdapter

**Epic:** EPIC-003  
**Priority:** Must Have  
**Points:** 2pt (4h)

**User Story:**  
As a 학습자,  
I want 브라우저를 닫았다 열어도 학습 진도가 유지,  
So that 매번 처음부터 다시 시작하지 않아도 된다.

**Acceptance Criteria:**
- [ ] `getProgress(id)`, `getAllProgress()`, `updateProgress(id, quality)`, `getDueForReview()`, `getWeakSpecies(limit)`, `resetAll()` 구현
- [ ] localStorage 키: `learn-bird-names:progress`
- [ ] 파싱 실패 시 `ProgressCorruptedError` → 상위 UI에서 "초기화 안내 모달" 표시
- [ ] **TDD:** localStorage mock 환경에서 단위 테스트 작성 후 구현
- [ ] `updateProgress` 내부에서 SRSEngine.calculate() 호출해 next_review 갱신

**Dependencies:** STORY-007

---

### STORY-009: QuizService 코어 (프로토타입)

**Epic:** EPIC-003  
**Priority:** Must Have  
**Points:** 2pt (4h)

**User Story:**  
As a QuizCard UI,  
I want QuizService를 통해 세션 생성·문제 조회·답안 제출,  
So that UI가 퀴즈 로직을 직접 구현하지 않아도 된다.

**Acceptance Criteria:**
- [ ] `createSession(options)`: mode, scope, size 파라미터 지원
- [ ] `nextQuestion(session)`: 세션 내 중복 없이 다음 문제 반환
- [ ] `submitAnswer(session, answer, usedHint)`: 정답 여부 + SRS quality 반환
- [ ] 재시도 로직: 첫 오답 → `isRetry: true` 반환; 두 번째 오답 → 정답 공개
- [ ] 스트릭 카운터 세션 상태에 포함
- [ ] `getMatchingRound(session)`: 세션 종 목록 → 짝짓기 데이터 반환
- [ ] 범위 'weak' → ProgressService.getWeakSpecies() 연동

**Dependencies:** STORY-003, STORY-008

---

### STORY-010: 사진→이름 퀴즈 UI (QuizCard)

**Epic:** EPIC-003  
**Priority:** Must Have  
**Points:** 2pt (4h)

**User Story:**  
As a 학습자,  
I want 새 사진을 보고 4개 보기 중 이름을 선택,  
So that 반복 노출로 자연스럽게 새 이름을 기억할 수 있다.

**Acceptance Criteria:**
- [ ] 사진 표시 (모바일 기준 화면 너비 80% 이상)
- [ ] 사진 탭 → PhotoModal 확대 뷰
- [ ] 보기 4개 버튼 (한국 공식명 텍스트)
- [ ] 정답 → 초록 하이라이트 + "정답입니다" 텍스트
- [ ] 오답 → 빨간 하이라이트 + 재시도 안내
- [ ] 재시도 두 번째 오답 → 정답 버튼 초록 표시
- [ ] 힌트 버튼: 서식지 또는 목(目) 정보 1개 표시 (1회 제한)
- [ ] 스트릭 카운터 표시; 5·10연속 마일스톤 피드백
- [ ] 키보드 단축키 1~4로 보기 선택 가능
- [ ] 세션 종료 → 짝짓기 복습 화면으로 전환

**Dependencies:** STORY-009

---

### STORY-011: 이름→사진 퀴즈 UI (PhotoGrid)

**Epic:** EPIC-003  
**Priority:** Must Have  
**Points:** 2pt (4h)

**User Story:**  
As a 학습자,  
I want 새 이름을 보고 4장 사진 중 맞는 사진 선택,  
So that 시각적 식별 능력을 다른 방식으로 훈련할 수 있다.

**Acceptance Criteria:**
- [ ] 한국 공식명 + 2×2 사진 그리드 표시
- [ ] 각 사진 탭 → 확대 가능
- [ ] 정답/오답 피드백은 STORY-010과 동일한 패턴
- [ ] 오답 사진 3장은 오답 보기 종의 사진 각 1장씩

**Dependencies:** STORY-009, STORY-010

---

### STORY-012: 힌트 + 재시도 + 스트릭 (퀴즈 보완)

**Epic:** EPIC-003  
**Priority:** Should Have  
**Points:** 2pt (4h)

**User Story:**  
As a 학습자,  
I want 힌트와 재시도로 학습 좌절을 줄이고, 스트릭으로 동기를 얻고 싶다,  
So that 틀려도 포기하지 않고 계속 학습할 수 있다.

**Acceptance Criteria:**
- [ ] 힌트 사용 → SRS quality 감소 처리 (QuizService 연동)
- [ ] 5·10연속 마일스톤 별도 애니메이션/메시지 (텍스트 우선, 아이콘 최소화)
- [ ] 재시도 후 정답의 SRS quality는 일반 정답보다 낮음
- [ ] Taxonomy 퀴즈에도 동일한 힌트/재시도 패턴 적용

**Technical Notes:**  
STORY-010에서 기본 구현 시작, 이 스토리에서 SRS 연동과 마일스톤 UI 완성.

**Dependencies:** STORY-010

---

### STORY-013: 세션 마무리 짝짓기 복습 (MatchingGame)

**Epic:** EPIC-003  
**Priority:** Should Have  
**Points:** 3pt (6h)

**User Story:**  
As a 학습자,  
I want 10문제 세션 후 그 종들을 사진-이름 짝짓기로 한 번 더 확인,  
So that 세션에서 배운 것을 마무리하며 더 잘 기억할 수 있다.

**Acceptance Criteria:**
- [ ] 세션 종료 직후 짝짓기 화면 자동 전환
- [ ] 최대 10쌍 사진-이름 카드 매칭 (탭-투-매치 방식)
- [ ] 세션 내 1번에 정답 맞힌 종은 흐리게 표시 (완료 표시)
- [ ] 모두 매칭 완료 → 세션 결과 화면으로 이동
- [ ] 세션 결과: 정답 수 / 오답 수 / 스트릭 최고 기록

**Dependencies:** STORY-009, STORY-010

---

### STORY-014: Taxonomy 퀴즈 모드 (3가지 유형)

**Epic:** EPIC-003  
**Priority:** Should Have  
**Points:** 5pt (10h)

**User Story:**  
As a 중급 학습자,  
I want 개별 종을 어느 정도 익힌 후 분류학(목/과) 관계를 퀴즈로 배우고 싶다,  
So that 새들 사이의 계통 관계를 자연스럽게 이해할 수 있다.

**Acceptance Criteria:**
- [ ] 누적 정답 20종 미만 → 잠금; 달성 시 해제 알림 표시
- [ ] **유형 1 — 사진→목/과 맞히기:** 새 사진 보고 目 또는 科 4지선다
- [ ] **유형 2 — 이상한 종 찾기:** 같은 과 3마리 + 다른 과 1마리 중 이상한 종 선택
- [ ] **유형 3 — 과 이름→소속 판별:** 과(科) 이름 제시 후 소속/비소속 새 선택; 정답 공개 시 모든 보기의 사진+한국명+과 이름 함께 표시
- [ ] 세션 내 3가지 유형 고르게 혼합
- [ ] 힌트·재시도·스트릭 동일하게 적용

**Dependencies:** STORY-003, STORY-009, STORY-012

---

### STORY-015: 진도 대시보드 (ProgressBoard)

**Epic:** EPIC-004 (진도 관리)  
**Priority:** Must Have  
**Points:** 2pt (4h)

**User Story:**  
As a 학습자,  
I want 내가 얼마나 배웠는지 한눈에 확인하고 취약종을 파악,  
So that 어떤 새를 더 공부해야 하는지 방향을 잡을 수 있다.

**Acceptance Criteria:**
- [ ] 학습 종 수 / 전체 종 수 표시 (예: 15 / 30)
- [ ] 마스터 종 수 (연속 3회 이상 정답) 표시
- [ ] 취약종 목록 (오답 비율 높은 순, 최대 10개)
- [ ] 진도 초기화 버튼 + 확인 다이얼로그
- [ ] 로컬 스토리지 손상 시 초기화 안내 모달 자동 표시

**Dependencies:** STORY-008

---

### STORY-016: 퀴즈 범위 필터 선택

**Epic:** EPIC-004  
**Priority:** Should Have  
**Points:** 1pt (2h)

**User Story:**  
As a 학습자,  
I want 퀴즈 시작 전 범위(전체/취약종/서식지/오늘 복습)를 선택,  
So that 지금 내 상황에 맞는 학습에 집중할 수 있다.

**Acceptance Criteria:**
- [ ] 4가지 범위 선택: 전체 / 취약종만 / 서식지 그룹별 / 오늘 복습 대상
- [ ] 선택 범위 내 종이 5개 미만이면 경고 메시지
- [ ] 선택 상태가 세션 시작까지 유지

**Dependencies:** STORY-008, STORY-009

---

## Sprint Allocation

---

### Sprint 1 (8/16~8/31 · 2주 · 8pt) — "동작하는 프로토타입"

**Goal:** 앱이 배포되고, 사진→이름 퀴즈 1개 모드가 실제로 동작한다. 30종 데이터가 로드된다.

| Story | 제목 | 점수 | 우선순위 |
|-------|------|------|---------|
| STORY-001 | 프로젝트 세팅 | 1pt | Must Have |
| STORY-002 | Species 타입 + 스키마 | 1pt | Must Have |
| STORY-003 | SpeciesService + 테스트 | 2pt | Must Have |
| STORY-007 | SRSEngine TDD | 2pt | Must Have |
| STORY-009 | QuizService 코어 | 2pt | Must Have |

**총계:** 8pt / 8pt 용량 (100% → 데이터 병행 고려해 여유 없음)

**구현 순서:** 001 → 002 → 003 → 007 → 009  
(STORY-010 UI는 Sprint 2 첫 번째 스토리로 배치. 이 Sprint 종료 시점엔 서비스 레이어 완성 상태)

**⚠️ Sprint 1 리스크:**
- 데이터 큐레이션(30종)을 개발과 병행해야 함 — 별도 시간 확보 필요
- QuizService까지 완성하면 서비스 레이어 테스트는 가능하나, 퀴즈 UI(STORY-010)는 Sprint 2 시작 즉시 착수

**Sprint 1 완료 기준:**
- [ ] Vercel에 Next.js 앱 배포됨
- [ ] 30종 species.json 로드됨 (데이터 큐레이션 완료)
- [ ] SRSEngine 단위 테스트 전부 통과
- [ ] QuizService로 세션 생성·문제 생성 동작 확인

---

### Sprint 2 (9/1~9/21 · 3주 · 12pt) — "학습 경험 완성"

**Goal:** 사진→이름·이름→사진 두 퀴즈 모드 + 오늘의 새 홈 + 진도 저장 + 대시보드가 모두 동작한다.

| Story | 제목 | 점수 | 우선순위 |
|-------|------|------|---------|
| STORY-010 | 사진→이름 퀴즈 UI | 2pt | Must Have |
| STORY-008 | ProgressService + LocalStorageAdapter | 2pt | Must Have |
| STORY-005 | 오늘의 새 홈 화면 | 2pt | Must Have |
| STORY-006 | TriviaCard | 1pt | Should Have |
| STORY-011 | 이름→사진 퀴즈 UI | 2pt | Must Have |
| STORY-012 | 힌트 + 재시도 + 스트릭 보완 | 1pt | Should Have |
| STORY-015 | 진도 대시보드 | 2pt | Must Have |

**총계:** 12pt / 12pt 용량 (3주 × 4pt)

**구현 순서:** 010 → 008 → 005+006 → 011 → 012 → 015

**Sprint 2 완료 기준:**
- [ ] 사진→이름, 이름→사진 두 모드 Firefox에서 동작
- [ ] localStorage에 진도 저장·복원 동작
- [ ] 오늘의 새 + 트리비아 홈 화면 표시
- [ ] 진도 대시보드에서 학습 현황 확인 가능

---

### Sprint 3 (9/22~10/12 · 3주 · 12pt) — "완성 + 배포 준비"

**Goal:** Taxonomy 퀴즈 + 짝짓기 복습 + 범위 필터 완성. CI/CD 구축. 소규모 공개 가능한 상태.

| Story | 제목 | 점수 | 우선순위 |
|-------|------|------|---------|
| STORY-013 | 짝짓기 복습 (MatchingGame) | 3pt | Should Have |
| STORY-016 | 퀴즈 범위 필터 | 1pt | Should Have |
| STORY-014 | Taxonomy 퀴즈 (3가지 유형) | 5pt | Should Have |
| STORY-004 | validate-data.js + CI | 1pt | Should Have |
| QA Buffer | 반응형 QA·버그 수정·데이터 확장 | 2pt | — |

**총계:** 12pt / 12pt 용량

**Sprint 3 완료 기준:**
- [ ] 짝짓기 복습 게임 동작
- [ ] Taxonomy 퀴즈 3가지 유형 동작
- [ ] 범위 필터 선택 동작
- [ ] validate-data.js CI 통과
- [ ] Firefox + Chrome 크로스 브라우저 QA 완료
- [ ] 지인 공유 가능한 URL 상태 (Vercel 배포)

---

## Epic Traceability

| Epic | 이름 | 스토리 | 포인트 | 스프린트 |
|------|------|--------|--------|---------|
| EPIC-001 | 종 데이터 시스템 | 001, 002, 003, 004 | 5pt | S1, S3 |
| EPIC-002 | 오늘의 새 | 005, 006 | 3pt | S2 |
| EPIC-003 | 퀴즈 엔진 & 모드 | 007, 009, 010, 011, 012, 013, 014 | 18pt | S1, S2, S3 |
| EPIC-004 | 진도 관리 & SRS | 008, 015, 016 | 5pt | S2 |

---

## Functional Requirements Coverage

| FR | 이름 | Story | Sprint |
|----|------|-------|--------|
| FR-001 | 종 마스터 데이터 | STORY-002, 003 | S1 |
| FR-002 | 종별 복수 사진 | STORY-002, 003 | S1 |
| FR-003 | 트리비아 데이터 | STORY-002, 006 | S1, S2 |
| FR-004 | 오늘의 새 표시 | STORY-005 | S2 |
| FR-005 | 오늘의 새 트리비아 | STORY-006 | S2 |
| FR-006 | 오늘의 새 → 퀴즈 진입 | STORY-005 | S2 |
| FR-007 | 4지선다 출제 | STORY-009 | S1 |
| FR-008 | 즉각 피드백 + 재시도 | STORY-010, 012 | S2 |
| FR-009 | 세션 흐름 | STORY-009, 013 | S1, S3 |
| FR-010 | 힌트 | STORY-010, 012 | S2 |
| FR-011 | 연속 정답 스트릭 | STORY-010, 012 | S2 |
| FR-012 | 사진→이름 모드 | STORY-010 | S2 |
| FR-013 | 이름→사진 모드 | STORY-011 | S2 |
| FR-014 | 세션 마무리 짝짓기 | STORY-013 | S3 |
| FR-015 | Taxonomy 퀴즈 | STORY-014 | S3 |
| FR-016 | SRS | STORY-007, 008 | S1, S2 |
| FR-017 | 진도 대시보드 | STORY-015 | S2 |
| FR-018 | 퀴즈 범위 필터 | STORY-016 | S3 |

---

## Risks and Mitigation

**High:**
- **데이터 큐레이션 병목** — 30종 × 15~30분 = 8~15h. Sprint 1 중 개발과 병행 필수. 완료 안 되면 프로토타입 UI는 있어도 내용이 없는 상태가 됨. → 여름철새 10종부터 시작해 점진적 추가.
- **Taxonomy 퀴즈 범위 (5pt)** — Sprint 3에서 가장 큰 스토리. 데이터 부족(과별 종 수)하면 문제 생성이 어려울 수 있음. → 사전에 과별 종 수 확인 후 스코프 조정.

**Medium:**
- **SM-2 초기 파라미터 튜닝** — 실제 사용 전까지 EF·interval 값이 적절한지 알기 어려움. → Sprint 1 완료 후 직접 사용해보며 조정.
- **짝짓기 UX 인터랙션** — 탭-투-매치 방식이 모바일에서 직관적이지 않을 수 있음. → 프로토타입 후 UX 검토.

**Low:**
- **Firefox Android 호환성** — 개발 환경(PC)과 모바일 Firefox 렌더링 차이. → Sprint 3 QA에서 실기기 테스트.

---

## Definition of Done

스토리가 완료된 것으로 간주하는 기준:

- [ ] 코드 구현 및 커밋 완료
- [ ] Service Layer 스토리: 단위 테스트 작성 및 통과 (TDD 적용 레이어)
- [ ] UI 스토리: Firefox에서 모바일(375px) + PC(1280px) 레이아웃 확인
- [ ] 접근성: 버튼·링크에 텍스트 레이블 또는 aria-label 포함
- [ ] 라이선스: 사진 attribution 필드 있는 데이터만 노출 확인
- [ ] Vercel Preview URL에서 동작 확인

---

## Next Steps

**즉시 시작:**
1. `STORY-001` — `npx create-next-app@latest learn-bird-names` 실행
2. 데이터 큐레이션 병행 — 여름철새 10종부터 시작

**구현 순서 권장:**
```
STORY-007 (SRSEngine TDD) 를 가장 먼저 완성
→ 핵심 알고리즘이 테스트로 고정되면
  이후 모든 진도 관련 스토리가 안전하게 개발 가능
```

---

*BMAD Method v6 — Phase 4 (Implementation Planning) — Scrum Master*
