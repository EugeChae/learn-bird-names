// ─── Bird Data Types ──────────────────────────────────────────────────────────

export type Abundance = "ab" | "c" | "uc" | "sc" | "r";
// ab=많음(Abundant) / c=흔함(Common) / uc=흔하지않음(Uncommon)
// sc=적음(Scarce) / r=희귀함(Rare)

export type Status =
  | "Res"
  | "SV"
  | "WV"
  | "PM"
  | "Vag"
  | "Probably extinct";
// Res=텃새 / SV=여름철새 / WV=겨울철새 / PM=나그네새 / Vag=길잃은새

export type DifficultyTier = 1 | 2 | 3;
// 친숙도. 1=일상에서 만나고 이름도 대개 아는 새 / 2=탐조를 시작하면 곧 만나는 새 /
// 3=탐조인이 아니면 모르는 새. 오답 보기 거리는 tier가 아니라 학습자 레벨(LearnerLevel)이 정한다.
// 종의 difficulty_tier는 "가장 알아보기 쉬운 형태(보통 수컷 번식깃)" 기준의 기본값이고,
// 사진별로 덜 친숙한 형태(암컷·유조·겨울깃)는 SpeciesMedia.difficulty_tier로 올려 적는다.

export type LearnerLevel = 1 | 2 | 3;
// 오답 보기 거리 단계. 1=먼 종(다른 目)에서만 / 2=같은 目 다른 科 / 3=혼동 상대·같은 科 유사종.
// 승급 규칙은 progress.service.getLearnerLevel 참고(친숙도 tier별 숙지율 70%).

export type MediaAngle = "perched" | "flying" | "swimming" | "unknown";
export type MediaSex = "male" | "female" | "unknown";
export type MediaAge = "adult" | "juvenile" | "unknown";
export type MediaPlumage = "breeding" | "nonbreeding" | "unknown";

export type TriviaType = "ecology" | "identification" | "seasonal";
export type TriviaMoment = "dawn" | "day" | "dusk";
// 새의 하루(STORY-017): 이 문장이 새벽/한낮/해질녘 중 어느 순간의 생활인가.
// 사실·출처는 그대로, 동사 시제만 현재. 시각 근거가 없는 사실은 "지금쯤"으로만 쓴다.

export interface SpeciesMedia {
  url: string;
  sex: MediaSex;
  age: MediaAge;
  plumage: MediaPlumage;
  angle: MediaAngle;
  license: string;
  attribution: string;
  quality_score: 1 | 2 | 3;
  /**
   * 이 사진만의 난이도. 없으면 종의 difficulty_tier를 따른다.
   * 예: 원앙 수컷 사진은 종 기본값 1, 암컷 사진은 3.
   * 규칙(validate-data.js가 강제): 종 tier 이상이어야 하고, media[0](대표 사진)에는 쓰지 않는다.
   */
  difficulty_tier?: DifficultyTier;
}

export interface SpeciesTrivia {
  content: string;
  type: TriviaType;
  trivia_source: string;
  /** 있으면 홈 "오늘 만날 새"가 사용자 시계에 맞춰 고른다. 없으면 생태 트리비아로 폴백. */
  moment?: TriviaMoment;
}

export interface Species {
  id: string;
  name_korean: string;
  name_latin: string;
  name_english: string;
  order: string;
  family: string;
  habitat: string[];
  difficulty_tier: DifficultyTier;
  /**
   * 필드에서 실제로 혼동되는 종의 id 목록(대칭 — validate-data.js가 강제).
   * 학습자 레벨 3에서 오답 보기로 우선 등장한다. 예: 까마귀 ↔ 큰부리까마귀 ↔ 떼까마귀.
   */
  confusable_with?: string[];
  abundance: Abundance;
  status: Status[];
  media: SpeciesMedia[];
  trivia: SpeciesTrivia[];
}

// ─── SRS / Progress Types ─────────────────────────────────────────────────────

export type SRSQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0=오답 / 1=재시도정답 / 2=힌트정답 / 3~5=1번에정답(난이도별)

export interface SpeciesProgress {
  correct_count: number;
  incorrect_count: number;
  last_seen: string;
  next_review: string;
  easiness_factor: number;
  interval_days: number;
  last_quality: SRSQuality;
  /**
   * 연속 정답 횟수(오답 시 0으로 리셋). 마스터 판정용(STORY-015).
   * STORY-008 이전 저장 데이터엔 없을 수 있어 optional — 읽는 쪽에서 `?? 0`.
   */
  consecutive_correct?: number;
}

export type UserProgress = Record<string, SpeciesProgress>;

// ─── Quiz Types ───────────────────────────────────────────────────────────────

export type QuizMode = "photo-to-name" | "name-to-photo" | "taxonomy";
export type QuizScope = "all" | "weak" | "review" | "habitat";

export interface QuizSessionOptions {
  mode: QuizMode;
  scope: QuizScope;
  size: number;
}

export interface QuizQuestion {
  species: Species;
  choices: Species[];
  correctId: string;
  usedHint: boolean;
  attemptCount: number;
  /**
   * 문제가 마감될 때 확정되는 최종 정답 여부(세션 결과 카운트용, STORY-013).
   * 재시도 중(첫 오답, 미확정)에는 undefined. attemptCount만으로는
   * "재시도 후 정답"과 "두 번 틀려 공개"를 구분할 수 없어 별도로 기록한다.
   */
  resolvedCorrect?: boolean;
}

export interface AnswerResult {
  correct: boolean;
  isRetry: boolean;
  quality: SRSQuality;
  correctSpecies: Species;
}

export interface QuizSession {
  id: string;
  options: QuizSessionOptions;
  questions: QuizQuestion[];
  currentIndex: number;
  streak: number;
  maxStreak: number;
  completedSpeciesIds: string[];
}

export interface MatchingPair {
  species: Species;
  matched: boolean;
  wasEasy: boolean;
}

// ─── Taxonomy Quiz Types (STORY-014 / FR-015) ─────────────────────────────────

export type TaxonomyQuestionType =
  | "photo-to-taxon" // 유형1: 사진 보고 목/과 맞히기
  | "odd-one-out" // 유형2: 같은 과 3 + 다른 과 1 중 이상한 종
  | "family-membership"; // 유형3: 과 이름 → 소속/비소속 종 판별

export interface TaxonomyChoice {
  /** 보기 식별자. taxon 라벨(목/과) 또는 종 id. */
  id: string;
  /** 화면에 보일 한국어 라벨(taxon 한국어명 또는 종 한국명). */
  label: string;
  /** 있으면 사진·한국명 렌더용(유형2·3). 유형1의 taxon 보기엔 없음. */
  species?: Species;
}

export interface TaxonomyQuestion {
  id: string;
  type: TaxonomyQuestionType;
  /** 유형1: 사진 볼 종. */
  promptSpecies?: Species;
  /** 유형1에서 目/科 중 무엇을 묻는지. */
  taxonLevel?: "order" | "family";
  /** 유형3: 제시하는 과(科)의 한국어명. */
  familyLabel?: string;
  /** 유형3: 소속(true)/비소속(false) 종 고르기. */
  askBelongs?: boolean;
  choices: TaxonomyChoice[];
  correctId: string;
  usedHint: boolean;
  attemptCount: number;
  resolvedCorrect?: boolean;
}

export interface TaxonomySession {
  id: string;
  questions: TaxonomyQuestion[];
  currentIndex: number;
  streak: number;
  maxStreak: number;
}

export interface TaxonomyAnswerResult {
  correct: boolean;
  isRetry: boolean;
  correctId: string;
}
