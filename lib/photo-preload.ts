// ─── 사진 미리 받기 ─────────────────────────────────────────────────────────────
// 퀴즈 세션은 문제 목록을 처음부터 알고 있으므로, 앞으로 나올 문제의 사진을 받아 두면
// "다음"을 눌렀을 때 사진이 즉시 뜬다. 브라우저 HTTP 캐시에 넣는 것이 전부라 실패해도
// 조용히 넘어간다. 같은 URL은 한 번만 요청한다.
//
// 순서가 중요하다(2026-09-27 cleor 관찰: 다음 사진을 동시에 요청하니 지금 사진이 느려짐).
// 사진 호스트(iNaturalist S3, 미국)는 한국에서 왕복이 길어 동시 요청이 서로 대역폭을 나눈다.
// 그래서 "묶음"을 순서대로 받는다: [지금 화면 사진들] → [다음 문제 사진들] → [그다음 문제].
// 한 묶음 안(이름→사진의 보기 4장)은 함께 받고, 묶음 사이는 앞 묶음이 다 끝난 뒤 시작한다.

const requested = new Set<string>();
/** URL → 가로/세로 비율. 미리 받거나 한 번 표시한 사진은 다음부터 상자가 비율을 미리 안다(선택지 A). */
const ratios = new Map<string, number>();

export function rememberPhotoRatio(url: string, width: number, height: number): void {
  if (width > 0 && height > 0) ratios.set(url, width / height);
}

export function knownPhotoRatio(url: string): number | undefined {
  return ratios.get(url);
}
/** 아직 끝나지 않은 요청. 같은 URL을 다시 만나면 새로 요청하지 않고 이 약속을 기다린다
 *  (React StrictMode의 이중 effect나 빠른 재렌더에서 앞 묶음을 건너뛰지 않도록). */
const inflight = new Map<string, Promise<void>>();

export interface PreloadDeps {
  /** 테스트용 주입. 기본은 window.Image. */
  createImage?: () => PreloadImage;
}

export interface PreloadImage {
  src: string;
  onload: null | (() => void);
  onerror: null | (() => void);
  /** 이미 캐시에 있으면 src 대입 직후 true. */
  complete?: boolean;
  /** 있으면 받은 뒤 미리 디코딩까지 해 둔다(표시 순간의 디코딩 지연 제거). */
  decode?: () => Promise<void>;
  naturalWidth?: number;
  naturalHeight?: number;
}

function canPreload(deps: PreloadDeps): boolean {
  return typeof window !== "undefined" || Boolean(deps.createImage);
}

function createDefault(): PreloadImage {
  const img = new window.Image();
  img.crossOrigin = "anonymous"; // 화면의 <img>와 같은 모드로 받아야 캐시를 공유한다
  return img as unknown as PreloadImage;
}

/**
 * 한 묶음을 함께 받고, 전부 끝나면(성공·실패 무관) resolve.
 * 이미 요청한 URL은 새로 요청하지 않되, 아직 진행 중이면 그 완료를 기다린다.
 */
function loadGroup(urls: readonly string[], deps: PreloadDeps): Promise<string[]> {
  const create = deps.createImage ?? createDefault;
  const started: string[] = [];
  const waits: Promise<void>[] = [];
  for (const url of urls) {
    const pending = inflight.get(url);
    if (pending) {
      waits.push(pending);
      continue;
    }
    if (requested.has(url)) continue;
    requested.add(url);
    const p = new Promise<void>((resolve) => {
      try {
        const img = create();
        const done = () => {
          if (img.naturalWidth && img.naturalHeight) rememberPhotoRatio(url, img.naturalWidth, img.naturalHeight);
          // 받은 뒤 디코딩까지 끝내 두면 화면에 올릴 때 지연이 없다. 실패해도 무시.
          if (typeof img.decode === "function") img.decode().catch(() => {}).finally(resolve);
          else resolve();
        };
        img.onload = done;
        img.onerror = () => resolve();
        img.src = url;
        started.push(url);
        if (img.complete) resolve();
      } catch {
        requested.delete(url);
        resolve();
      }
    }).finally(() => inflight.delete(url));
    inflight.set(url, p);
    waits.push(p);
  }
  return Promise.all(waits).then(() => started);
}

/**
 * 묶음들을 순서대로 미리 받는다. 돌려주는 함수를 부르면 아직 시작하지 않은 묶음은 건너뛴다
 * (이미 나간 요청은 취소하지 않는다 — 어차피 곧 쓸 사진이다).
 */
export function preloadGroups(
  groups: readonly (readonly (string | undefined)[])[],
  deps: PreloadDeps = {}
): () => void {
  if (!canPreload(deps)) return () => {};
  let cancelled = false;
  const clean = groups
    .map((g) => g.filter((u): u is string => Boolean(u)))
    .filter((g) => g.length > 0);
  (async () => {
    for (const group of clean) {
      if (cancelled) return;
      await loadGroup(group, deps);
    }
  })();
  return () => {
    cancelled = true;
  };
}

/** 한 묶음만 받는 단축형(순서 무관). 새로 요청한 URL 목록을 돌려준다. */
export function preloadPhotos(
  urls: readonly (string | undefined)[],
  deps: PreloadDeps = {}
): string[] {
  if (!canPreload(deps)) return [];
  const clean = urls.filter((u): u is string => Boolean(u));
  const create = deps.createImage ?? createDefault;
  const started: string[] = [];
  for (const url of clean) {
    if (requested.has(url)) continue;
    requested.add(url);
    try {
      create().src = url;
      started.push(url);
    } catch {
      requested.delete(url);
    }
  }
  return started;
}

/** 테스트 격리용. */
export function resetPreloadCache(): void {
  requested.clear();
  inflight.clear();
  ratios.clear();
}

/**
 * [지금 문제, 다음 문제, 그다음 문제 …] 순서의 사진 URL 묶음.
 * 첫 묶음은 지금 화면이 이미 요청 중인 사진이라, 그것이 끝난 뒤에야 다음 묶음이 나가게 하는 앵커다.
 * ahead=3: 한국→미국 S3가 장당 0.8~1.2초라, 빨리 답하는 사용자보다 앞서려면 여유가 필요하다.
 */
export function photoGroupsFrom<Q>(
  questions: readonly Q[],
  current: Q | undefined,
  urlsOf: (q: Q) => (string | undefined)[],
  ahead = 3
): string[][] {
  const idx = current ? questions.indexOf(current) : -1;
  const start = Math.max(idx, 0);
  return questions
    .slice(start, start + 1 + ahead)
    .map((q) => urlsOf(q).filter((u): u is string => Boolean(u)));
}

/** 앞으로 나올 문제 n개의 사진 URL(평면 목록). */
export function upcomingPhotoUrls<Q>(
  questions: readonly Q[],
  current: Q | undefined,
  urlsOf: (q: Q) => (string | undefined)[],
  count = 2
): string[] {
  const idx = current ? questions.indexOf(current) : -1;
  const next = questions.slice(idx + 1, idx + 1 + count);
  return next.flatMap(urlsOf).filter((u): u is string => Boolean(u));
}
