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
// 1=쉬움(친숙하고 고유한 외형) / 2=보통 / 3=어려움(유사종 혼동 가능)

export type MediaAngle = "perched" | "flying" | "swimming" | "unknown";
export type MediaSex = "male" | "female" | "unknown";
export type MediaAge = "adult" | "juvenile" | "unknown";
export type MediaPlumage = "breeding" | "nonbreeding" | "unknown";

export type TriviaType = "ecology" | "identification" | "seasonal";

export interface SpeciesMedia {
  url: string;
  sex: MediaSex;
  age: MediaAge;
  plumage: MediaPlumage;
  angle: MediaAngle;
  license: string;
  attribution: string;
  quality_score: 1 | 2 | 3;
}

export interface SpeciesTrivia {
  content: string;
  type: TriviaType;
  trivia_source: string;
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
