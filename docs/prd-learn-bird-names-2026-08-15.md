# Product Requirements Document: learn-bird-names

**Date:** 2026-08-15  
**Author:** yjchae@a2d2.co.kr  
**Version:** 1.0  
**Project Type:** Web Game (반응형, PC + 모바일)  
**Project Level:** 2  
**Status:** Draft

---

## Document Overview

이 PRD는 learn-bird-names의 기능 및 비기능 요구사항을 정의하며, 구현의 진실의 원천으로 사용된다.

**Related Documents:**
- Product Brief: `docs/product-brief-learn-bird-names-2026-08-09.md`

---

## Executive Summary

한국 새의 이름과 분류를 사진 퀴즈 방식으로 자연스럽게 외울 수 있는 반응형 웹 게임. 초보 탐조인을 주 대상으로 하며, 스페이스드 리피티션(SRS) 기반 학습 설계와 즉각 피드백, 재시도 구조를 통해 "틀리면서 배우는" 경험을 핵심으로 한다. Phase 1은 한국 새 30~50종(여름 철새 우선)으로 구성된 프로토타입을 2026년 8월 말까지 완성하는 것을 목표로 한다.

---

## Product Goals

### Business Objectives

1. 2026년 8월 말까지 여름 철새 30~50종을 퀴즈로 학습할 수 있는 동작하는 프로토타입 완성
2. 소규모 공개 후 탐조에 관심 있는 지인 1~2명이 실제로 사용할 수 있는 수준 달성
3. 장기적으로 구독 모델(Subscription) 기반의 지속 가능한 서비스로 성장 (Phase 2+)

### Success Metrics

- 8월 말까지 여름 새 30~50종 퀴즈 가능한 프로토타입 동작
- 사용자 본인이 실제로 새 이름을 외우는 경험 확인
- 지인 1~2명에게 공유 가능한 URL 상태 달성
- 종 DB 구조가 사진 추가·확장에 열려 있는 상태 유지

---

## Functional Requirements

Functional Requirements(FRs)는 시스템이 **무엇을** 해야 하는지를 정의한다.

---

### FR-001: 종 마스터 데이터

**Priority:** Must Have

**Description:**
시스템은 각 새 종에 대해 다음 필드를 저장해야 한다: 한국 공식명, 학명, 영어명, 목(目)/과(科), 서식지, 난이도 등급(difficulty_tier), 희귀도(rarity: 한국 내 관찰 가능성). `rarity`와 `difficulty_tier`는 상관관계가 있으나 별도 필드로 독립 관리한다.

**Acceptance Criteria:**
- [ ] 30종 이상의 데이터가 로드되어 퀴즈에 사용 가능한 상태
- [ ] `difficulty_tier`와 `rarity`가 각각 독립적으로 저장되고 조회 가능함
- [ ] 종 데이터 누락 필드가 있을 경우 시스템이 경고 처리함

**Dependencies:** 없음

---

### FR-002: 종별 복수 사진

**Priority:** Must Have

**Description:**
각 종은 성별(sex) / 연령(age) / 깃(plumage) / 앵글(angle) 메타데이터를 가진 복수의 사진을 보유해야 한다. 각 사진에는 라이선스 정보(`license`)와 출처(`attribution`) 필드가 필수로 포함된다.

**Acceptance Criteria:**
- [ ] 종당 최소 1장, 권장 2장 이상의 사진 보유
- [ ] 모든 사진에 `sex`, `age`, `plumage`, `angle`, `license`, `attribution` 필드 포함
- [ ] 라이선스 미기재 사진은 퀴즈에 노출되지 않음

**Dependencies:** FR-001

---

### FR-003: 트리비아 데이터 (1:N)

**Priority:** Must Have

**Description:**
각 종은 1개 이상의 트리비아 항목을 보유하며, 상한은 없다(종마다 흥미로운 사실이 많을 수 있음). 트리비아 유형은 생태 사실 / 식별 포인트 / 계절·서식 중 하나로 분류한다. `trivia_source` 출처 필드가 필수이며, AI 생성 콘텐츠는 절대 사용 불가.

**Acceptance Criteria:**
- [ ] 종당 트리비아 1개 이상 존재
- [ ] 모든 트리비아에 `trivia_source` 필드 기재
- [ ] 출처 없는 트리비아는 시스템이 표시를 거부함
- [ ] 트리비아 유형(생태/식별/계절) 분류 필드 포함

**Dependencies:** FR-001

---

### FR-004: 오늘의 새 표시

**Priority:** Must Have

**Description:**
앱 진입 시 랜덤으로 새 한 종을 선택해 사진과 이름을 보여준다. 방문마다 새롭게 랜덤 선택한다.

**Acceptance Criteria:**
- [ ] 앱 진입(또는 새로고침) 시마다 랜덤 종 표시
- [ ] 종의 대표 사진 1장과 한국 공식명이 함께 표시됨

**Dependencies:** FR-001, FR-002

---

### FR-005: 오늘의 새 트리비아

**Priority:** Must Have

**Description:**
오늘의 새 화면에는 해당 종의 트리비아 1개가 함께 표시된다. 종에 트리비아가 여러 개면 랜덤 1개 선택.

**Acceptance Criteria:**
- [ ] 트리비아 1개가 오늘의 새 카드와 함께 표시됨
- [ ] 트리비아 유형(생태/식별/계절) 레이블이 표시됨
- [ ] 여러 트리비아 중 랜덤 1개가 선택됨

**Dependencies:** FR-003, FR-004

---

### FR-006: 오늘의 새 → 퀴즈 진입

**Priority:** Should Have

**Description:**
오늘의 새 화면에서 퀴즈 모드로 바로 진입할 수 있는 버튼을 제공한다.

**Acceptance Criteria:**
- [ ] 버튼 클릭 시 해당 종이 포함된 퀴즈 세션으로 이동
- [ ] 어떤 퀴즈 모드로 진입할지 선택 가능하거나 기본 모드로 바로 시작

**Dependencies:** FR-004, FR-007

---

### FR-007: 4지선다 문제 출제

**Priority:** Must Have

**Description:**
모든 퀴즈 모드는 정답 1개 + 오답 보기 3개 구조로 출제한다. 오답 보기는 난이도에 따라 거리감이 조정된다 (초급: 다른 目, 고급: 같은 屬 유사종).

**Acceptance Criteria:**
- [ ] 보기 4개가 항상 중복 없이 제시됨
- [ ] 오답 보기 선택 로직이 `difficulty_tier`를 참조함
- [ ] 동일 세션 내에서 동일 종이 중복 출제되지 않음

**Dependencies:** FR-001

---

### FR-008: 즉각 피드백 + 1회 재시도

**Priority:** Must Have

**Description:**
답 선택 즉시 정답/오답을 표시한다. 오답 선택 시 1회 재시도 기회가 주어지며, 2번째도 틀리면 정답을 공개한다. 재시도 후 정답은 SRS에서 "약한 정답"으로 처리한다.

**Acceptance Criteria:**
- [ ] 정답 선택 → 초록 하이라이트 표시
- [ ] 오답 선택 → 빨간 하이라이트 + 재시도 안내
- [ ] 2번째 오답 → 정답 하이라이트 공개
- [ ] 재시도 후 정답은 SRS 가중치가 1번에 정답보다 낮게 처리됨

**Dependencies:** FR-007, FR-016

---

### FR-009: 세션 흐름

**Priority:** Must Have

**Description:**
퀴즈는 10문제 단위 세션으로 구성된다. 세션 종료 시 맞힌 수 / 틀린 수 결과를 보여주고, 다시하기 또는 홈으로 이동 버튼을 제공한다.

**Acceptance Criteria:**
- [ ] 기본 세션 길이 10문제
- [ ] 세션 종료 화면에서 정답 수, 오답 수 표시
- [ ] "다시하기"와 "홈으로" 버튼 제공

**Dependencies:** FR-007, FR-008

---

### FR-010: 힌트

**Priority:** Should Have

**Description:**
문제 화면에서 힌트를 요청하면 해당 종의 서식지 또는 목(目) 정보 중 1가지를 보여준다. 힌트 사용 시 해당 문제는 정답이어도 SRS에서 복습 대상으로 표시한다.

**Acceptance Criteria:**
- [ ] 힌트는 문제당 1회만 사용 가능
- [ ] 힌트 사용 후 정답이어도 SRS 가중치 감소 처리
- [ ] 힌트 내용은 서식지 정보 또는 목(目) 이름 중 하나

**Dependencies:** FR-007, FR-016

---

### FR-011: 연속 정답 스트릭

**Priority:** Should Have

**Description:**
연속으로 정답을 맞히면 스트릭 카운터를 화면에 표시한다. 오답 또는 힌트 사용 시 스트릭이 초기화된다. 5연속, 10연속 등 마일스톤에서 시각적 피드백을 제공한다.

**Acceptance Criteria:**
- [ ] 스트릭 카운터가 문제 화면에 표시됨
- [ ] 오답 또는 힌트 사용 시 스트릭 0으로 초기화
- [ ] 5연속, 10연속 마일스톤에서 별도 피드백 제공 (애니메이션 또는 메시지)

**Dependencies:** FR-008

---

### FR-012: 사진 → 이름 퀴즈 모드

**Priority:** Must Have

**Description:**
새 사진 1장을 보고 한국 공식명을 4개 보기 중 선택한다. 사진은 해당 종의 SpeciesMedia 중 랜덤 선택한다. 사진 탭/클릭 시 확대 가능하다.

**Acceptance Criteria:**
- [ ] 사진이 충분히 크게 표시됨 (모바일 기준 화면 너비 80% 이상)
- [ ] 사진 탭 시 전체 화면 또는 확대 뷰 제공
- [ ] 보기 4개는 한국 공식명 텍스트로 표시

**Dependencies:** FR-001, FR-002, FR-007

---

### FR-013: 이름 → 사진 퀴즈 모드

**Priority:** Must Have

**Description:**
한국 공식명을 보고 맞는 사진을 4장 중 선택한다. 오답 사진 3장은 오답 보기 종의 사진 각 1장씩으로 구성한다. 각 사진 탭/클릭 시 확대 가능하다.

**Acceptance Criteria:**
- [ ] 4장 사진이 2x2 그리드로 표시됨
- [ ] 각 사진 탭 시 확대 뷰 제공
- [ ] 오답 보기 종의 사진도 라이선스 조건을 충족해야 함

**Dependencies:** FR-001, FR-002, FR-007

---

### FR-014: 세션 마무리 짝짓기 복습

**Priority:** Should Have

**Description:**
10문제 세션 종료 후, 해당 세션에 등장한 종 전체를 대상으로 사진-이름 짝짓기 복습 게임을 제공한다. 최대 10쌍. 통과 후 세션 결과 화면으로 이동한다.

**Acceptance Criteria:**
- [ ] 세션 종료 직후 짝짓기 게임 화면으로 자동 전환
- [ ] 최대 10쌍의 사진-이름 카드 매칭
- [ ] 세션 내에서 1번에 정답을 맞힌 종은 흐리게 표시하거나 제외 선택 가능
- [ ] 짝짓기 완료 후 세션 결과 화면으로 이동

**Dependencies:** FR-009, FR-012, FR-013

---

### FR-015: Taxonomy 퀴즈 모드 (3가지 유형)

**Priority:** Should Have

**Description:**
개별 종 퀴즈와 별도 모드로 운영되며, 누적 정답 20종 이상 달성 시 잠금 해제된다. 3가지 문제 유형을 세션 내에서 혼합 출제한다:

1. **사진 → 목/과 맞히기:** 새 사진을 보고 이 새가 속하는 목(目) 또는 과(科)를 4지선다로 선택
2. **이상한 종 찾기:** 같은 과 새 3마리 + 다른 과 새 1마리 중 나머지와 다른 종 선택
3. **과 이름 → 소속 판별:** 과(科) 이름을 제시하고 이 과에 속하는/속하지 않는 새를 사진 또는 텍스트 보기 중 선택. 정답 공개 시 모든 보기의 사진 + 한국명 + 과 이름 함께 표시

**Acceptance Criteria:**
- [ ] 개별 종 퀴즈 누적 정답 20종 이상 시 Taxonomy 모드 잠금 해제
- [ ] 세션 내 3가지 유형이 고르게 혼합 출제됨
- [ ] 유형 3에서 정답 공개 시 모든 보기의 사진 + 한국명 + 과 이름이 표시됨

**Dependencies:** FR-001, FR-002, FR-007, FR-016

---

### FR-016: 스페이스드 리피티션 (SRS)

**Priority:** Must Have

**Description:**
각 종의 학습 상태를 로컬 스토리지에 저장한다. 저장 항목: 정답 횟수, 오답 횟수, 마지막 출제일, 다음 복습 예정일. 정답 품질에 따라 SRS 가중치를 달리 적용한다.

| 상황 | SRS 처리 |
|------|---------|
| 1번에 정답 | 표준 간격 증가 |
| 힌트 사용 후 정답 | 약한 정답 (간격 소폭 증가) |
| 재시도 후 정답 | 약한 정답 (간격 소폭 증가) |
| 오답 | 간격 초기화 또는 최소값으로 감소 |

**Acceptance Criteria:**
- [ ] 브라우저 재시작 후에도 학습 데이터 유지
- [ ] 정답 품질(1회/힌트/재시도)별로 다른 SRS 간격 적용
- [ ] 다음 복습 예정일 기준으로 퀴즈 출제 우선순위 결정

**Dependencies:** FR-001

---

### FR-017: 진도 대시보드

**Priority:** Must Have

**Description:**
학습한 종 수, 마스터한 종 수, 취약 종 목록을 시각적으로 보여주는 대시보드를 제공한다. 로컬 스토리지 기반. 진도 초기화 버튼 포함.

**Acceptance Criteria:**
- [ ] 학습 완료 종 수 / 전체 종 수 표시
- [ ] 마스터 종 수 (기준: 연속 N회 정답) 표시
- [ ] 취약 종 목록 (오답 비율 높은 순) 표시
- [ ] 진도 초기화 버튼 및 확인 다이얼로그 포함

**Dependencies:** FR-016

---

### FR-018: 퀴즈 범위 필터 선택

**Priority:** Should Have

**Description:**
퀴즈 시작 전 범위를 선택할 수 있다: 전체 / 취약 종만 / 서식지 그룹별 / 오늘의 복습 대상.

**Acceptance Criteria:**
- [ ] 4가지 범위 선택지 제공
- [ ] 선택한 범위 내 종이 5개 미만이면 경고 메시지 표시
- [ ] 선택 범위가 세션 시작까지 유지됨

**Dependencies:** FR-016, FR-017

---

## Non-Functional Requirements

---

### NFR-001: 성능

**Priority:** Must Have

**Description:**
퀴즈 화면 전환 및 문제 로딩은 200ms 이내. 첫 페이지 로드(Cold Start)는 3G 환경에서 3초 이내.

**Acceptance Criteria:**
- [ ] Lighthouse Performance 점수 80 이상
- [ ] 퀴즈 문제 전환 응답 시간 200ms 이내

**Rationale:** 학습 흐름의 끊김 없는 리듬이 학습 효과에 직결됨

---

### NFR-002: 반응형 UI (Firefox 최우선)

**Priority:** Must Have

**Description:**
Firefox (PC + 모바일)에 최우선 최적화. Chrome과 Safari는 차선 지원. PC(1280px 이상)와 모바일(375px~) 레이아웃 모두 정상 동작.

**Acceptance Criteria:**
- [ ] Firefox 최신 버전 (PC + Android) 완전 지원
- [ ] Chrome / Safari 최신 버전 정상 동작
- [ ] 375px~1920px 범위 레이아웃 깨짐 없음

**Rationale:** 사용자 본인이 Firefox를 주 브라우저로 사용

---

### NFR-003: 로컬 저장 내구성

**Priority:** Must Have

**Description:**
진도 데이터는 localStorage에 저장되며, 브라우저 재시작 후에도 유지된다. 데이터 손상 시 초기화 흐름을 안내한다.

**Acceptance Criteria:**
- [ ] 의도적 초기화 버튼 외에 진도 데이터가 삭제되지 않음
- [ ] 데이터 파싱 실패 시 사용자에게 초기화 안내 메시지 표시

**Rationale:** 로그인 없이 SRS 진도를 유지하는 유일한 수단

---

### NFR-004: 사진 라이선스 준수

**Priority:** Must Have

**Description:**
표시되는 모든 사진은 CC 라이선스 정보가 DB에 기록되어 있어야 한다. 라이선스 미기재 사진은 시스템이 표시를 거부한다.

**Acceptance Criteria:**
- [ ] 모든 사진에 `license`, `attribution` 필드 필수
- [ ] 필드 미기재 사진은 퀴즈 및 오늘의 새에 노출 불가

**Rationale:** CC 라이선스 위반 방지; iNaturalist CC-BY-NC 조건 준수

---

### NFR-005: 접근성

**Priority:** Should Have

**Description:**
주요 UI 요소는 키보드 접근 및 스크린리더 기본 지원. 색상만으로 정답/오답을 구분하지 않으며, 아이콘은 꼭 필요한 경우에만 사용하고 텍스트 레이블을 우선한다.

**Acceptance Criteria:**
- [ ] 키보드로 퀴즈 진행 가능 (Tab + Enter)
- [ ] 정답/오답 구분에 색상 외 텍스트 피드백 병행
- [ ] 아이콘 사용 시 반드시 텍스트 레이블 또는 aria-label 포함

**Rationale:** 기본적인 접근성 보장; 아이콘 과용은 UI 복잡도를 높임

---

### NFR-006: 무료 인프라

**Priority:** Should Have

**Description:**
Phase 1은 유료 API나 유료 호스팅 없이 운영 가능해야 한다.

**Acceptance Criteria:**
- [ ] Vercel 무료 플랜 또는 GitHub Pages로 배포 가능
- [ ] 외부 API 호출이 있다면 모두 무료 티어 내에서 운영

**Rationale:** Phase 1 예산 제약 (무료 서비스만 사용)

---

## Epics

---

### EPIC-001: 종 데이터 시스템

**Description:**
새 종 마스터 데이터, 복수 사진, 트리비아를 저장하고 관리하는 데이터 레이어. 모든 퀴즈 모드와 오늘의 새 기능의 기반.

**Functional Requirements:**
- FR-001, FR-002, FR-003

**Story Count Estimate:** 3-5개

**Priority:** Must Have

**Business Value:**
데이터 구조의 완성도가 전체 학습 경험 품질을 결정함. 사진 확장과 종 추가가 쉬운 구조여야 Phase 2로 이어짐.

---

### EPIC-002: 학습 첫 화면 (오늘의 새)

**Description:**
앱 진입 시 랜덤 새 한 종을 소개하고 트리비아를 제공하는 첫 화면. 학습 동기 유발과 퀴즈 진입 경로 역할.

**Functional Requirements:**
- FR-004, FR-005, FR-006

**Story Count Estimate:** 2-3개

**Priority:** Must Have

**Business Value:**
매 방문마다 새로운 새를 만나는 경험으로 재방문 동기를 만들고, 자연스럽게 퀴즈로 유입.

---

### EPIC-003: 퀴즈 엔진 & 모드

**Description:**
4지선다 퀴즈 코어와 세 가지 퀴즈 모드(사진→이름, 이름→사진, Taxonomy), 힌트, 스트릭, 재시도, 세션 마무리 짝짓기 복습을 포함한 전체 퀴즈 경험.

**Functional Requirements:**
- FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015

**Story Count Estimate:** 8-12개

**Priority:** Must Have

**Business Value:**
제품의 핵심 가치 전달 영역. 틀리면서 배우는 경험, 스트릭, 재시도, 마무리 복습이 학습 완성도와 재미를 결정함.

---

### EPIC-004: 진도 관리 & SRS

**Description:**
스페이스드 리피티션 기반 학습 상태 저장, 진도 대시보드, 퀴즈 범위 필터를 포함한 장기 학습 지속성 레이어.

**Functional Requirements:**
- FR-016, FR-017, FR-018

**Story Count Estimate:** 4-6개

**Priority:** Must Have

**Business Value:**
SRS가 없으면 단순 퀴즈에 그침. 진도 추적과 취약 종 집중 학습이 실제로 새 이름을 외우게 만드는 핵심 메커니즘.

---

## User Stories (High-Level)

상세 User Stories는 Phase 4 Sprint Planning에서 작성한다.

---

## User Personas

### Primary: 초보 탐조인 (대한민국)
- 도감은 있지만 종 이름 암기가 어려움
- 게임처럼 즐기면서 배우기를 원함
- 실제로 본 새의 이름을 알고 싶은 즉각적 동기 보유

### Secondary: 탐조 비경험자
- 지인에게 탐조 취미를 권할 때 입문 도구로 소개받는 사용자
- 부담 없는 첫 경험이 중요

---

## User Flows

### Flow 1: 퀴즈 학습 메인 플로우
```
앱 진입 → 오늘의 새 + 트리비아 확인 → 퀴즈 모드 선택 → 
범위 필터 선택 → 10문제 퀴즈 진행 → 짝짓기 복습 → 
세션 결과 확인 → 다시하기 or 홈
```

### Flow 2: SRS 복습 플로우
```
앱 진입 → 진도 대시보드 확인 → "오늘의 복습 대상" 필터 선택 → 
취약 종 중심 퀴즈 → 결과 확인
```

### Flow 3: Taxonomy 모드 잠금 해제
```
개별 종 퀴즈 진행 → 누적 정답 20종 달성 → 
Taxonomy 모드 잠금 해제 알림 → Taxonomy 퀴즈 진입
```

---

## Dependencies

### Internal Dependencies
- 종 데이터(EPIC-001)는 모든 퀴즈 모드(EPIC-003)와 오늘의 새(EPIC-002)의 선행 조건
- SRS(FR-016)는 퀴즈 피드백(FR-008), 힌트(FR-010), 범위 필터(FR-018)의 선행 조건

### External Dependencies
- **NIBR 국가생물종지식정보시스템 API:** 한국 공식명·분류 데이터 수집
- **iNaturalist API / GBIF API:** CC 라이선스 사진 수집 (무료 티어)
- **Vercel / GitHub Pages:** 호스팅 (무료 플랜)

---

## Assumptions

1. NIBR / iNaturalist API로 충분한 한국 새 데이터를 무료로 수집 가능하다
2. Phase 1 범위(30~50종)의 사진 큐레이션은 3주 내 수동으로 가능하다
3. localStorage 진도 저장으로 Phase 1에서 충분한 사용 경험이 가능하다
4. 구독 모델 도입 전 무료 공개로 소규모 사용자 확보가 가능하다

---

## Out of Scope (Phase 1)

- 로그인 / 계정 시스템 (localStorage로 대체)
- 외국 새 (북미, 유럽 등)
- 울음소리 퀴즈 / 음원
- 커뮤니티·소셜 기능
- 네이티브 앱 (iOS / Android)
- 유료 API 사용
- Admin UI (데이터는 JSON 파일 또는 직접 DB 입력)
- 창의적 학습 팩 (Phase 2 브레인스토밍 과제)

---

## Open Questions

1. **SRS 알고리즘:** SM-2 알고리즘을 그대로 쓸지, 단순화된 커스텀 로직을 쓸지 → Architecture 단계에서 결정
2. **Taxonomy 잠금 해제 기준:** 20종이 적절한지 실제 사용 후 조정 가능
3. **짝짓기 복습 UX:** 드래그앤드롭 vs 탭-투-매치 → UX 단계에서 결정
4. **데이터 입력 워크플로우:** JSON 파일 직접 편집 vs 간단한 CLI 스크립트

---

## Approval & Sign-off

### Stakeholders

| 역할 | 관계 | 영향도 |
|------|------|--------|
| 사용자 (프로젝트 오너) | 기획·개발·사용 모두 담당 | 높음 |
| 탐조 관심 지인 | 초기 베타 사용자 | 낮음 |

### Approval Status

- [ ] Product Owner

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-15 | yjchae@a2d2.co.kr | Initial PRD |

---

## Next Steps

### Phase 3: Architecture

`/bmad:architecture`를 실행해 이 요구사항을 충족하는 시스템 아키텍처를 설계한다.

아키텍처는 다음을 결정한다:
- 기술 스택 (Next.js + Tailwind 등)
- 데이터 모델 (Species, SpeciesMedia, SpeciesTrivia, UserProgress)
- SRS 알고리즘 선택
- 배포 방식 (Vercel 등)

---

*BMAD Method v6 — Phase 2 (Planning) — Product Manager*

---

## Appendix A: Requirements Traceability Matrix

| Epic ID | Epic Name | Functional Requirements | Story Count (Est.) |
|---------|-----------|-------------------------|-------------------|
| EPIC-001 | 종 데이터 시스템 | FR-001, FR-002, FR-003 | 3-5 |
| EPIC-002 | 학습 첫 화면 (오늘의 새) | FR-004, FR-005, FR-006 | 2-3 |
| EPIC-003 | 퀴즈 엔진 & 모드 | FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015 | 8-12 |
| EPIC-004 | 진도 관리 & SRS | FR-016, FR-017, FR-018 | 4-6 |

---

## Appendix B: Prioritization Details

### Functional Requirements

| Priority | Count | FRs |
|----------|-------|-----|
| Must Have | 11 | FR-001~009, FR-012, FR-013, FR-016, FR-017 |
| Should Have | 7 | FR-006, FR-010, FR-011, FR-014, FR-015, FR-018 |
| Could Have | 0 | — |

### Non-Functional Requirements

| Priority | Count | NFRs |
|----------|-------|------|
| Must Have | 4 | NFR-001~004 |
| Should Have | 2 | NFR-005~006 |
