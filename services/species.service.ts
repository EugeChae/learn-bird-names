import speciesData from "@/public/data/species.json";
import type {
  Species,
  SpeciesMedia,
  Status,
  Abundance,
  DifficultyTier,
  LearnerLevel,
} from "@/types";

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface SpeciesFilters {
  status?: Status[];
  abundance?: Abundance[];
}

// ─── License hygiene (NFR-004) ─────────────────────────────────────────────────

/**
 * attribution 또는 license가 비어 있는 사진을 제거한다.
 * 라이선스 미기재 사진은 표시 금지(NFR-004) — 런타임에서도 이중으로 차단한다.
 */
export function sanitizeMedia(species: Species): Species {
  return {
    ...species,
    media: species.media.filter(
      (m) => m.attribution.trim().length > 0 && m.license.trim().length > 0
    ),
  };
}

// ─── Module-level cache (NFR-001) ──────────────────────────────────────────────

// species.json을 모듈 로드 시 한 번만 읽어 메모리에 캐싱한다.
// Phase 2에서는 이 상수만 fetch 결과로 교체하면 되고, 하위 로직은 그대로 재사용된다.
const ALL_SPECIES: Species[] = (speciesData as Species[]).map(sanitizeMedia);

// ─── Query API ─────────────────────────────────────────────────────────────────

/** 전체 종 조회. status / abundance 필터를 OR 조건으로 적용한다. */
export function getAll(filters?: SpeciesFilters): Species[] {
  let result = ALL_SPECIES;

  if (filters?.status && filters.status.length > 0) {
    const wanted = new Set(filters.status);
    result = result.filter((s) => s.status.some((st) => wanted.has(st)));
  }

  if (filters?.abundance && filters.abundance.length > 0) {
    const wanted = new Set(filters.abundance);
    result = result.filter((s) => wanted.has(s.abundance));
  }

  return result;
}

/** 단일 종 조회. 없으면 undefined (호출부에서 처리). */
export function getById(id: string): Species | undefined {
  return ALL_SPECIES.find((s) => s.id === id);
}

/** 난이도 tier로 필터링(종 기본 tier 기준). */
export function getByDifficulty(tier: DifficultyTier): Species[] {
  return ALL_SPECIES.filter((s) => s.difficulty_tier === tier);
}

/**
 * 특정 사진으로 출제할 때의 실효 난이도. 사진에 tier가 있으면 그것, 없으면 종 tier.
 * 오답 거리감·SRS quality는 이 값을 써야 "원앙 암컷" 문제가 tier 3으로 취급된다.
 */
export function getEffectiveTier(
  species: Species,
  media?: SpeciesMedia
): DifficultyTier {
  return media?.difficulty_tier ?? species.difficulty_tier;
}

/** 실효 난이도가 maxTier 이하인 사진만 반환(초급 세션에서 암컷·유조 사진 제외용). */
export function getMediaUpToTier(
  species: Species,
  maxTier: DifficultyTier
): SpeciesMedia[] {
  return species.media.filter((m) => getEffectiveTier(species, m) <= maxTier);
}

/**
 * 데이터에 등장하는 서식지 태그를 빈도 내림차순(같으면 이름순)으로 반환한다.
 * 서식지별 퀴즈 범위(STORY-016)의 선택지·"5종 미만" 경고 카운트에 쓰인다.
 */
export function getHabitats(): { habitat: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of ALL_SPECIES) {
    for (const h of s.habitat) {
      counts.set(h, (counts.get(h) ?? 0) + 1);
    }
  }
  return Array.from(counts, ([habitat, count]) => ({ habitat, count })).sort(
    (a, b) => b.count - a.count || a.habitat.localeCompare(b.habitat, "ko")
  );
}

/** 지정한 id들을 제외한 무작위 1종. 후보가 없으면 undefined. */
export function getRandom(
  excludeIds: string[] = [],
  rng: () => number = Math.random
): Species | undefined {
  const exclude = new Set(excludeIds);
  const pool = ALL_SPECIES.filter((s) => !exclude.has(s.id));
  if (pool.length === 0) return undefined;
  return pool[Math.floor(rng() * pool.length)];
}

// ─── Decoy generation ────────────────────────────────────────────────────────

/** Fisher-Yates 셔플 (rng 주입으로 테스트 결정론 확보). 원본 불변. */
function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 대상의 혼동 상대(confusable_with) 중 pool에 있는 종. */
export function getConfusables(
  target: Species,
  pool: readonly Species[]
): Species[] {
  const wanted = new Set(target.confusable_with ?? []);
  if (wanted.size === 0) return [];
  return pool.filter((s) => wanted.has(s.id));
}

/**
 * 대상 종에 대한 오답 보기를 학습자 레벨에 따라 고른다.
 * 거리는 종의 난이도가 아니라 학습자가 정한다(친숙도 tier와 분리, 2026-09-20).
 * - level 1(입문): 먼 종에서만 — 다른 目 → 같은 目 다른 科 → 같은 科. 혼동 상대는 맨 뒤.
 * - level 2: 같은 目 다른 科 → 같은 科(혼동 상대 포함) → 다른 目.
 * - level 3: 혼동 상대(confusable_with) → 같은 科 → 같은 目 다른 科 → 다른 目.
 *
 * 우선순위 그룹을 순서대로 소진하며 count개까지 채운다. 후보가 부족하면
 * 가능한 만큼만 반환한다(좁힌 범위에서도 안전).
 */
export function selectDecoys(
  target: Species,
  pool: readonly Species[],
  count = 3,
  rng: () => number = Math.random,
  level: LearnerLevel = 1
): Species[] {
  const others = pool.filter((s) => s.id !== target.id);
  const confusableIds = new Set(target.confusable_with ?? []);

  const confusable = others.filter((s) => confusableIds.has(s.id));
  const rest = others.filter((s) => !confusableIds.has(s.id));
  const differentOrder = rest.filter((s) => s.order !== target.order);
  const sameOrderDiffFamily = rest.filter(
    (s) => s.order === target.order && s.family !== target.family
  );
  const sameFamily = rest.filter(
    (s) => s.order === target.order && s.family === target.family
  );

  let priority: Species[][];
  switch (level) {
    case 1:
      priority = [differentOrder, sameOrderDiffFamily, sameFamily, confusable];
      break;
    case 2:
      priority = [sameOrderDiffFamily, [...sameFamily, ...confusable], differentOrder];
      break;
    case 3:
      priority = [confusable, sameFamily, sameOrderDiffFamily, differentOrder];
      break;
  }

  const picked: Species[] = [];
  const seen = new Set<string>();
  for (const group of priority) {
    if (picked.length >= count) break;
    for (const s of shuffle(group, rng)) {
      if (picked.length >= count) break;
      if (!seen.has(s.id)) {
        seen.add(s.id);
        picked.push(s);
      }
    }
  }

  return picked;
}

/** 대상 종에 대한 오답 보기 3개(기본)를 실데이터에서 생성한다. */
export function getDecoys(
  target: Species,
  count = 3,
  rng: () => number = Math.random,
  level: LearnerLevel = 1
): Species[] {
  return selectDecoys(target, ALL_SPECIES, count, rng, level);
}
