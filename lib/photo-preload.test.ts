import { beforeEach, describe, expect, it } from "vitest";
import {
  photoGroupsFrom,
  preloadGroups,
  preloadPhotos,
  resetPreloadCache,
  upcomingPhotoUrls,
  type PreloadImage,
} from "./photo-preload";

/** 가짜 Image: src 대입 순서를 기록하고, 테스트가 finish()로 onload를 직접 울린다. */
function fakeImages() {
  const made: { url: string; img: PreloadImage }[] = [];
  const createImage = (): PreloadImage => {
    const img: PreloadImage = { src: "", onload: null, onerror: null };
    let s = "";
    Object.defineProperty(img, "src", {
      get: () => s,
      set(v: string) {
        s = v;
        made.push({ url: v, img });
      },
    });
    return img;
  };
  const finish = (url: string) => made.find((m) => m.url === url)?.img.onload?.();
  const urls = () => made.map((m) => m.url);
  return { createImage, finish, urls };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("preloadPhotos", () => {
  beforeEach(() => resetPreloadCache());

  it("각 URL에 Image를 만들어 src를 넣고, 빈 값·중복은 건너뛴다", () => {
    const f = fakeImages();
    expect(preloadPhotos(["a.jpg", undefined, "b.jpg", "a.jpg"], f)).toEqual(["a.jpg", "b.jpg"]);
    expect(f.urls()).toEqual(["a.jpg", "b.jpg"]);
    expect(preloadPhotos(["a.jpg"], f)).toEqual([]);
  });
});

describe("preloadGroups", () => {
  beforeEach(() => resetPreloadCache());

  it("앞 묶음이 다 끝나야 다음 묶음을 요청한다 (현재 사진과 대역폭을 나누지 않는다)", async () => {
    const f = fakeImages();
    preloadGroups([["now.jpg"], ["next1.jpg", "next1b.jpg"], ["next2.jpg"]], f);
    await tick();
    expect(f.urls()).toEqual(["now.jpg"]);
    f.finish("now.jpg");
    await tick();
    expect(f.urls()).toEqual(["now.jpg", "next1.jpg", "next1b.jpg"]);
    f.finish("next1.jpg");
    await tick();
    expect(f.urls()).toHaveLength(3); // 묶음 안 하나만 끝나선 안 넘어간다
    f.finish("next1b.jpg");
    await tick();
    expect(f.urls()).toEqual(["now.jpg", "next1.jpg", "next1b.jpg", "next2.jpg"]);
  });

  it("취소하면 아직 시작 안 한 묶음은 건너뛴다", async () => {
    const f = fakeImages();
    const cancel = preloadGroups([["a.jpg"], ["b.jpg"]], f);
    await tick();
    cancel();
    f.finish("a.jpg");
    await tick();
    expect(f.urls()).toEqual(["a.jpg"]);
  });

  it("같은 묶음을 두 번 시작해도(StrictMode) 앞 묶음이 진행 중이면 기다린다", async () => {
    const f = fakeImages();
    const cancel1 = preloadGroups([["a.jpg"], ["b.jpg"]], f);
    await tick();
    cancel1();
    preloadGroups([["a.jpg"], ["b.jpg"]], f);
    await tick();
    expect(f.urls()).toEqual(["a.jpg"]); // a가 아직 진행 중이라 b는 대기
    f.finish("a.jpg");
    await tick();
    await tick();
    expect(f.urls()).toEqual(["a.jpg", "b.jpg"]);
  });

  it("끝난 URL만 있는 묶음은 바로 지나간다", async () => {
    const f = fakeImages();
    preloadGroups([["a.jpg"]], f);
    await tick();
    f.finish("a.jpg");
    await tick();
    preloadGroups([["a.jpg"], ["b.jpg"]], f);
    await tick();
    expect(f.urls()).toEqual(["a.jpg", "b.jpg"]);
  });
});

const qs = [
  { id: "q1", urls: ["1.jpg"] },
  { id: "q2", urls: ["2.jpg", "2b.jpg"] },
  { id: "q3", urls: ["3.jpg"] },
  { id: "q4", urls: [undefined, "4.jpg"] },
];

describe("photoGroupsFrom", () => {
  it("현재 문제부터 ahead개까지 묶음으로", () => {
    expect(photoGroupsFrom(qs, qs[0], (q) => q.urls, 2)).toEqual([["1.jpg"], ["2.jpg", "2b.jpg"], ["3.jpg"]]);
    expect(photoGroupsFrom(qs, qs[0], (q) => q.urls)).toHaveLength(4); // 기본 3개 앞까지
    expect(photoGroupsFrom(qs, qs[2], (q) => q.urls, 2)).toEqual([["3.jpg"], ["4.jpg"]]);
    expect(photoGroupsFrom(qs, undefined, (q) => q.urls, 1)).toEqual([["1.jpg"], ["2.jpg", "2b.jpg"]]);
  });
});

describe("upcomingPhotoUrls", () => {
  it("현재 문제 다음 n개의 사진만 모은다", () => {
    expect(upcomingPhotoUrls(qs, qs[0], (q) => q.urls, 2)).toEqual(["2.jpg", "2b.jpg", "3.jpg"]);
    expect(upcomingPhotoUrls(qs, qs[3], (q) => q.urls)).toEqual([]);
  });
});
