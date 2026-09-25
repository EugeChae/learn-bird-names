# Stories 017–019: 사진별 티어 실제 가동 (암컷 사진 → 출제 런타임 → 승급 알림)

**작성:** 2026-09-25 · **상태:** Draft (사용자 검토 대기)  
**전제:** PR #8 머지(a4738e1). 친숙도 tier · `confusable_with` · 학습자 레벨 · `SpeciesMedia.difficulty_tier?` 스키마가 main에 있다.  
**배경:** 사진별 티어를 담을 자리는 만들었지만 사진이 0장이고, 퀴즈는 종당 대표 사진(`media[0]`) 하나만 쓴다. 이 세 스토리는 그 빈칸을 데이터 → 런타임 → 피드백 순으로 채운다. 한 번에 하나씩, 각각 PR 하나.

관련 문서: `docs/difficulty-tiers-2026-09-20.md`(세 축 정의), `docs/photo-audit-2026-09-15.md`(사진 수집 파이프라인), 메모리 `feedback-photo-selection-criteria`(사진 선택 기준).

---

### STORY-017: 오리과 암컷 사진 수집

**Epic:** EPIC-001 (종 데이터 시스템)  
**Priority:** Must Have  
**Points:** 2pt (4h, 그중 사용자 검수 약 30분)

**User Story:**  
As a 학습자,  
I want 오리류의 암컷 사진이 데이터에 있고 "암컷은 어려운 형태"로 표시되어 있는 것,  
So that 수컷만 외워서 다 아는 줄 착각하지 않고, 실제 탐조에서 마주치는 암컷도 배울 수 있다.

**범위:**  
오리과 17종 중 암수 외형이 뚜렷이 다른 **14종**: 청둥오리, 흰뺨검둥오리(암수 유사하나 혼동 쌍이라 포함), 원앙, 가창오리, 쇠오리, 고방오리, 넓적부리, 흰죽지, 댕기흰죽지, 홍머리오리, 청머리오리, 비오리, 흰비오리, 흰뺨오리.  
**제외:** 큰기러기, 쇠기러기, 큰고니 — 암수 동형이라 암컷 사진이 학습 가치가 없다. 유조 사진은 별도 스토리.

**Acceptance Criteria:**
- [ ] 14종 각각 `media[1]`에 암컷 사진 1장 추가: `sex: "female"`, `age: "adult"`, `difficulty_tier: 3`, license·attribution 기재
- [ ] 흰뺨검둥오리는 암수 동형이므로 `difficulty_tier: 2`(종 tier 1 이상이면 됨) — 규칙 "사진 tier ≥ 종 tier"를 지키면서 과장하지 않는다
- [ ] `media[0]`(대표 사진)은 변경하지 않는다
- [ ] 후보 사진은 iNaturalist에서 종당 6장 받아 콘택트시트로 제시하고, 사용자가 사진 선택 기준(전신·거리감·서식 배경·단독 개체, 얼빡샷 지양)으로 고른다
- [ ] 선택된 사진은 동정 대조(관측의 커뮤니티 taxon = 우리 학명, research grade) 통과, HEAD 200 확인
- [ ] `npm run validate-data` 통과, `npm run data-sheet`에서 tier 칸에 "female/adult → tier 3" 표시 확인
- [ ] 기존 테스트 전부 통과(컴포넌트는 여전히 `media[0]`만 쓰므로 화면 변화 없음)

**Technical Notes:**  
- iNat API: `observations?taxon_name=<학명>&term_id=9&term_value_id=10`(annotation: sex=female)&quality_grade=research&photo_license=cc-by,cc-by-nc&place_id=6924(한국)`. 한국 후보가 3장 미만이면 place 제한 해제.  
- 분당 약 60회 제한 → 요청 간격 400ms 이상, 429 재시도. 지난 감사 스크립트(`photoaudit.mjs`, `fetch4.mjs`, `sheet4.py`, `patch_photos.py`)의 흐름을 재사용하되 이번엔 레포 `scripts/`에 넣지 않는다(일회성).  
- sex 주석이 없는 관측이 많으므로, 주석 없는 후보도 시트에 넣고 사용자가 육안으로 암컷 여부를 판단한다. 시트에 관측 링크를 붙인다.

**Dependencies:** 없음 (PR #8 머지 완료)

---

### STORY-018: 출제 사진 선택 런타임

**Epic:** EPIC-003 (퀴즈 엔진 & 모드)  
**Priority:** Must Have  
**Points:** 3pt (6h)

**User Story:**  
As a 학습자,  
I want 레벨이 올라가면 암컷·유조 사진으로도 문제가 나오고, 그 문제는 더 어려운 문제로 취급되는 것,  
So that 한 종을 여러 형태로 알게 되고, 어려운 형태를 맞혔을 때 그만큼 인정받는다.

**Acceptance Criteria:**
- [ ] `QuizQuestion`에 `photo: SpeciesMedia`(출제 사진)와 `effectiveTier: DifficultyTier` 추가. 기존 `species`는 유지
- [ ] 출제 사진 선택 규칙(`species.service.pickQuizPhoto(species, level, rng)`):
  - Lv1: 종 tier 이하 사진만 → 사실상 대표 사진
  - Lv2: 종 tier 이하 사진만(동일). 암컷 사진은 아직 안 나온다
  - Lv3: 모든 사진 중 rng로 선택. 암컷 사진이 있는 종은 50% 확률로 암컷 출제
  - 후보가 대표 사진뿐이면 항상 그것
- [ ] 정답 시 SRS quality는 `effectiveTier` 기준(`cleanQuality`): 암컷 사진(tier 3)을 한 번에 맞히면 quality 3 → 더 자주 복습
- [ ] 오답 보기(`selectDecoys`)는 변경 없음 — 거리는 레벨이 정한다(PR #8 결정 유지)
- [ ] 컴포넌트 7곳의 `media[0]` 하드코딩 제거:
  - `QuizCard`(문제 사진) → `question.photo`
  - `PhotoGridQuizCard`(이름→사진 모드의 4장) → 정답 종은 `question.photo`, 오답 종은 대표 사진
  - `MatchingGame`, `TaxonomyCard`, `BirdCard`(오늘의 새) → 대표 사진 유지(공용 헬퍼 `representativePhoto(species)`로 교체해 하드코딩만 없앰)
- [ ] 정답 공개 화면에서 출제 사진이 대표 사진이 아니면 형태 배지 표시: "암컷", "어린 새", "겨울깃"(sex/age/plumage에서 도출, unknown이면 표시 안 함)
- [ ] 진도 대시보드 레벨 카드의 Lv3 설명에 "암컷·어린 새 사진도 나와요" 한 줄 추가
- [ ] 테스트: 사진 선택 규칙(레벨별·후보 없음·rng 결정론), quality가 사진 tier를 따르는지, 배지 렌더, 기존 253+ 테스트 통과
- [ ] 세션 결정론 유지: 같은 rng 시드면 같은 사진이 뽑힌다(사진 선택도 주입된 rng 사용)

**Technical Notes:**  
- `createSession`에서 `pickQuizPhoto`를 호출해 `photo`·`effectiveTier`를 문제에 박는다. `submitAnswer`의 `cleanQuality(question.species.difficulty_tier)`를 `cleanQuality(question.effectiveTier)`로.  
- 기존 `getEffectiveTier`, `getMediaUpToTier` 헬퍼 재사용.  
- 이름→사진 모드에서 오답 종에 암컷 사진을 쓰면 난이도가 두 축으로 동시에 오르므로 이번엔 정답 종만 암컷 허용.  
- Firefox 우선 확인(NFR-002). 이미지 로딩 실패 시 fallback은 기존 방식 그대로.

**Dependencies:** STORY-017 (암컷 사진 없이는 동작 확인 불가. 단, 테스트는 합성 데이터로 가능해 병렬 착수는 가능)

---

### STORY-019: 레벨 승급 알림

**Epic:** EPIC-004 (진도 관리 & SRS)  
**Priority:** Should Have  
**Points:** 1pt (2h)

**User Story:**  
As a 학습자,  
I want 레벨이 오른 순간 세션 완료 화면에서 알림을 받는 것,  
So that 승급이 대시보드에 가야만 보이는 조용한 사건이 아니라 성취로 느껴진다.

**Acceptance Criteria:**
- [ ] 세션 시작 시 레벨을 기억하고(`QuizSession.startLevel`), 세션 완료 시 `getLearnerLevel().level`과 비교
- [ ] 올랐으면 `SessionComplete`에 배너: "Lv2가 됐어요! 이제 비슷한 무리끼리 보기에 나와요"(레벨별 문구는 `ProgressBoard`의 LEVEL_LABEL 재사용)
- [ ] 배너에 "진도 보기" 링크(→ `/progress`)
- [ ] 안 올랐으면 아무것도 표시하지 않는다. 최고 레벨 도달 시 문구는 "최고 레벨이에요"
- [ ] 저장소 불가 환경에서도 세션 완료 화면이 깨지지 않는다(레벨 읽기 실패 → 배너 없음)
- [ ] 테스트: 승급/미승급/최고 레벨/저장소 실패 4케이스

**Technical Notes:**  
- `getLearnerLevel`은 호출 시 저장하므로 세션 완료 시점 호출 한 번으로 승급이 확정·저장된다. 별도 저장 로직 불필요.  
- 승급 판정은 마지막 문제의 `updateProgress` 이후에 해야 한다(순서 주의).

**Dependencies:** 없음 (STORY-017/018과 독립. 순서상 마지막에 두는 이유는 018로 화면이 바뀐 뒤 배너 위치를 잡는 게 낫기 때문)

---

## 순서와 산출물

| 순서 | 스토리 | PR | 사용자 개입 |
|---|---|---|---|
| 1 | STORY-017 암컷 사진 수집 | `photo-female-ducks` | 콘택트시트 14장 검수·선택 |
| 2 | STORY-018 출제 사진 런타임 | `quiz-photo-tiers` | Firefox에서 Lv3 세션 한 번 확인(진도 초기화 후 테스트용 레벨 강제는 `?level=3` 쿼리로 — 개발 전용, 프로덕션 빌드에서는 무시) |
| 3 | STORY-019 승급 알림 | `level-up-banner` | 없음 |

**의도적으로 안 하는 것**
- 친숙도 tier 순서로 출제 범위를 잠그는 기능 — 레벨이 이미 "쉬운 것부터"를 오답 거리로 구현하고 있어, 범위까지 잠그면 초반 34종만 보여 지루해질 위험. 실사용 반응 뒤 결정.
- 유조·겨울깃 사진 — 암컷 파이프라인이 한 번 돌고 나면 같은 방식으로 확장. 큰기러기·쇠기러기·큰고니는 유조가 더 유용.
- 오답 종의 암컷 사진(이름→사진 모드) — 난이도 두 축 동시 상승. Lv3 이후 반응 보고.

**Open Questions (사용자 결정 필요)**
1. Lv3에서 암컷 출제 확률 50%가 적절한가, 아니면 "대표 사진을 마스터한 종만 암컷 출제"처럼 종별 진도에 연동할까? → 단순한 50%로 시작하고 데이터 보고 조정하는 것을 제안.
2. STORY-018의 개발용 `?level=3` 쿼리를 둘지, 아니면 진도 저장소를 직접 조작해 테스트할지. → 쿼리가 QA에 편하므로 두되 프로덕션 빌드에서 무시하는 것을 제안.
