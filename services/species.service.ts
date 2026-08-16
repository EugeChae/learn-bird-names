import speciesData from "@/public/data/species.json";
import type {
  Species,
  Status,
  Abundance,
  DifficultyTier,
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

/** 난이도 tier로 필터링. */
export function getByDifficulty(tier: DifficultyTier): Species[] {
  return ALL_SPECIES.filter((s) => s.difficulty_tier === tier);
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

/**
 * 오답 보기 선택 (순수 함수). tier에 따라 "거리감"을 조절한다:
 * - tier 1(쉬움): 먼 거리부터 — 다른 目 → 같은 目 다른 科 → 같은 科
 * - tier 2(보통): 같은 目 다른 科 → 같은 科 → 다른 目
 * - tier 3(어려움): 가까운 유사종부터 — 같은 科 → 같은 目 다른 科 → 다른 目
 *
 * 우선순위 그룹을 순서대로 소진하며 count개까지 채운다. 후보가 부족하면
 * 가능한 만큼만 반환한다(데이터가 적은 초기 단계에서도 안전).
 */
export function selectDecoys(
  target: Species,
  pool: readonly Species[],
  count = 3,
  rng: () => number = Math.random
): Species[] {
  const others = pool.filter((s) => s.id !== target.id);

  const differentOrder = others.filter((s) => s.order !== target.order);
  const sameOrderDiffFamily = others.filter(
    (s) => s.order === target.order && s.family !== target.family
  );
  const sameFamily = others.filter(
    (s) => s.order === target.order && s.family === target.family
  );

  let priority: Species[][];
  switch (target.difficulty_tier) {
    case 1:
      priority = [differentOrder, sameOrderDiffFamily, sameFamily];
      break;
    case 2:
      priority = [sameOrderDiffFamily, sameFamily, differentOrder];
      break;
    case 3:
      priority = [sameFamily, sameOrderDiffFamily, differentOrder];
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
  rng: () => number = Math.random
): Species[] {
  return selectDecoys(target, ALL_SPECIES, count, rng);
}
