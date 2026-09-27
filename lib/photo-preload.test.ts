import { beforeEach, describe, expect, it } from "vitest";
import { preloadPhotos, resetPreloadCache, upcomingPhotoUrls } from "./photo-preload";

describe("preloadPhotos", () => {
  beforeEach(() => resetPreloadCache());

  it("각 URL에 Image를 만들어 src를 넣고, 빈 값·중복은 건너뛴다", () => {
    const made: string[] = [];
    const createImage = () => {
      const img = { _src: "" } as { src: string; _src: string };
      Object.defineProperty(img, "src", {
        set(v: string) {
          made.push(v);
        },
      });
      return img;
    };
    const started = preloadPhotos(["a.jpg", undefined, "b.jpg", "a.jpg"], { createImage });
    expect(started).toEqual(["a.jpg", "b.jpg"]);
    expect(made).toEqual(["a.jpg", "b.jpg"]);
    expect(preloadPhotos(["a.jpg"], { createImage })).toEqual([]);
  });
});

describe("upcomingPhotoUrls", () => {
  const qs = [
    { id: "q1", urls: ["1.jpg"] },
    { id: "q2", urls: ["2.jpg", "2b.jpg"] },
    { id: "q3", urls: ["3.jpg"] },
    { id: "q4", urls: [undefined, "4.jpg"] },
  ];
  it("현재 문제 다음 n개의 사진만 모은다", () => {
    expect(upcomingPhotoUrls(qs, qs[0], (q) => q.urls, 2)).toEqual(["2.jpg", "2b.jpg", "3.jpg"]);
    expect(upcomingPhotoUrls(qs, qs[2], (q) => q.urls, 2)).toEqual(["4.jpg"]);
    expect(upcomingPhotoUrls(qs, qs[3], (q) => q.urls)).toEqual([]);
  });
  it("현재 문제가 없으면 처음부터 n개", () => {
    expect(upcomingPhotoUrls(qs, undefined, (q) => q.urls, 1)).toEqual(["1.jpg"]);
  });
});
