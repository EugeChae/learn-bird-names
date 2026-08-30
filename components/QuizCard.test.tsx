import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizCard from "@/components/QuizCard";
import { createSession } from "@/services/quiz.service";
import { getProgress } from "@/services/progress.service";
import type { Species, DifficultyTier, QuizSession } from "@/types";

// ─── 픽스처 ─────────────────────────────────────────────────────────────────────

function sp(
  id: string,
  name: string,
  order: string,
  family: string,
  tier: DifficultyTier = 1
): Species {
  return {
    id,
    name_korean: name,
    name_latin: id,
    name_english: id,
    order,
    family,
    habitat: ["도시·마을"],
    difficulty_tier: tier,
    abundance: "c",
    status: ["Res"],
    media: [
      {
        url: `https://example.com/${id}.jpg`,
        sex: "unknown",
        age: "adult",
        plumage: "unknown",
        angle: "unknown",
        license: "CC-BY-NC",
        attribution: `(c) ${name} 촬영자`,
        quality_score: 2,
      },
    ],
    trivia: [],
  };
}

const POOL: Species[] = [
  sp("magpie", "까치", "Passeriformes", "Corvidae"),
  sp("swallow", "제비", "Passeriformes", "Hirundinidae"),
  sp("sparrow", "참새", "Passeriformes", "Passeridae"),
  sp("heron", "왜가리", "Pelecaniformes", "Ardeidae"),
  sp("duck", "청둥오리", "Anseriformes", "Anatidae"),
];

function seededRng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeSession(size = 1, seed = 1): QuizSession {
  return createSession(
    { mode: "photo-to-name", scope: "all", size },
    { rng: seededRng(seed), pool: POOL, decoyPool: POOL }
  );
}

const nameRe = (s: string) => new RegExp(s);

// ─── 테스트 ─────────────────────────────────────────────────────────────────────

describe("QuizCard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("사진, 4지선다 보기, 스트릭을 렌더한다", () => {
    const s = makeSession(1);
    render(<QuizCard session={s} />);
    expect(
      screen.getByRole("img", { name: "맞혀야 할 새 사진" })
    ).toBeInTheDocument();
    for (const c of s.questions[0].choices) {
      expect(
        screen.getByRole("button", { name: nameRe(c.name_korean) })
      ).toBeInTheDocument();
    }
    expect(s.questions[0].choices).toHaveLength(4);
    expect(screen.getByText(/연속/)).toBeInTheDocument();
  });

  it("정답을 고르면 정답 피드백과 다음 버튼이 나온다", async () => {
    const user = userEvent.setup();
    const s = makeSession(1);
    render(<QuizCard session={s} />);
    await user.click(
      screen.getByRole("button", { name: nameRe(s.questions[0].species.name_korean) })
    );
    expect(screen.getByText(/정답입니다/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toBeInTheDocument();
  });

  it("첫 오답은 재시도 안내를 주고 정답을 공개하지 않는다", async () => {
    const user = userEvent.setup();
    const s = makeSession(1);
    render(<QuizCard session={s} />);
    const q = s.questions[0];
    const wrong = q.choices.find((c) => c.id !== q.correctId)!;
    await user.click(screen.getByRole("button", { name: nameRe(wrong.name_korean) }));
    expect(screen.getByText(/다시 시도/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "다음" })).toBeNull();
    // 재시도로 정답 → 정답 피드백
    await user.click(
      screen.getByRole("button", { name: nameRe(q.species.name_korean) })
    );
    expect(screen.getByText(/정답입니다/)).toBeInTheDocument();
  });

  it("두 번째 오답이면 정답을 공개한다", async () => {
    const user = userEvent.setup();
    const s = makeSession(1);
    render(<QuizCard session={s} />);
    const q = s.questions[0];
    const wrongs = q.choices.filter((c) => c.id !== q.correctId);
    await user.click(screen.getByRole("button", { name: nameRe(wrongs[0].name_korean) }));
    await user.click(screen.getByRole("button", { name: nameRe(wrongs[1].name_korean) }));
    expect(screen.getByText(/정답은/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toBeInTheDocument();
  });

  it("힌트 버튼은 정보를 1회 보여주고 사라진다", async () => {
    const user = userEvent.setup();
    render(<QuizCard session={makeSession(1)} />);
    await user.click(screen.getByRole("button", { name: /힌트 보기/ }));
    expect(screen.getByText(/서식지:/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /힌트 보기/ })).toBeNull();
  });

  it("키보드 숫자키로 보기를 선택할 수 있다", () => {
    const s = makeSession(1);
    render(<QuizCard session={s} />);
    const q = s.questions[0];
    const correctIdx = q.choices.findIndex((c) => c.id === q.correctId);
    fireEvent.keyDown(window, { key: String(correctIdx + 1) });
    expect(screen.getByText(/정답입니다/)).toBeInTheDocument();
  });

  it("사진을 탭하면 확대 모달이 열리고 닫힌다", async () => {
    const user = userEvent.setup();
    render(<QuizCard session={makeSession(1)} />);
    await user.click(screen.getByRole("button", { name: "새 사진 확대" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("확정된 답만 진도에 저장하고, 재시도 중에는 쓰지 않는다", async () => {
    const user = userEvent.setup();
    const s = makeSession(1);
    render(<QuizCard session={s} />);
    const q = s.questions[0];
    const wrong = q.choices.find((c) => c.id !== q.correctId)!;
    await user.click(screen.getByRole("button", { name: nameRe(wrong.name_korean) }));
    expect(getProgress(q.correctId)).toBeNull();
    await user.click(
      screen.getByRole("button", { name: nameRe(q.species.name_korean) })
    );
    const saved = getProgress(q.correctId);
    expect(saved).not.toBeNull();
    expect(saved?.last_quality).toBe(1);
    expect(saved?.correct_count).toBe(1);
  });

  it("5연속 정답을 달성하면 마일스톤 배너가 뜬다 (STORY-012)", async () => {
    const user = userEvent.setup();
    const s = makeSession(5, 1); // POOL 5종 → 5문제
    render(<QuizCard session={s} />);
    for (let i = 0; i < 5; i++) {
      await user.click(
        screen.getByRole("button", {
          name: nameRe(s.questions[i].species.name_korean),
        })
      );
      if (i < 4) {
        await user.click(screen.getByRole("button", { name: "다음" }));
      }
    }
    expect(screen.getByText(/5연속 정답/)).toBeInTheDocument();
  });

  it("힌트를 쓰고 맞히면 진도 quality가 힌트값(2)으로 저장된다 (STORY-012)", async () => {
    const user = userEvent.setup();
    const s = makeSession(1);
    render(<QuizCard session={s} />);
    await user.click(screen.getByRole("button", { name: /힌트 보기/ }));
    const q = s.questions[0];
    await user.click(
      screen.getByRole("button", { name: nameRe(q.species.name_korean) })
    );
    expect(getProgress(q.correctId)?.last_quality).toBe(2);
  });

  it("모든 문제를 1번에 맞히면 세션 결과 화면으로 전환한다", async () => {
    const user = userEvent.setup();
    const s = makeSession(1);
    render(<QuizCard session={s} />);
    const q = s.questions[0];
    const correctIdx = q.choices.findIndex((c) => c.id === q.correctId);
    fireEvent.keyDown(window, { key: String(correctIdx + 1) });
    await user.click(screen.getByRole("button", { name: "다음" }));
    // 전부 1번에 정답 → 짝지을 종이 없어 결과 화면으로 직행 (STORY-013)
    expect(screen.getByText("퀴즈 완료!")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "세션 결과" })).toBeInTheDocument();
  });
});
