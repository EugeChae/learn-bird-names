// ─── 사진 미리 받기 ─────────────────────────────────────────────────────────────
// 퀴즈 세션은 문제 목록을 처음부터 알고 있으므로, 다음 문제의 사진을 지금 받아 두면
// "다음" 버튼을 눌렀을 때 사진이 즉시 뜬다. 브라우저 HTTP 캐시에 넣는 것이 전부라
// 실패해도 조용히 넘어간다. 같은 URL은 한 번만 요청한다.

const requested = new Set<string>();

export interface PreloadDeps {
  /** 테스트용 주입. 기본은 window.Image. */
  createImage?: () => { src: string };
}

/** URL 목록을 미리 받는다. 이미 요청한 URL은 건너뛰고, 새로 요청한 URL만 돌려준다. */
export function preloadPhotos(
  urls: readonly (string | undefined)[],
  deps: PreloadDeps = {}
): string[] {
  if (typeof window === "undefined" && !deps.createImage) return [];
  const create = deps.createImage ?? (() => new window.Image());
  const started: string[] = [];
  for (const url of urls) {
    if (!url || requested.has(url)) continue;
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
}

/** 앞으로 나올 문제 n개의 사진 URL(문제 사진 + 보기 사진)을 모은다. */
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
