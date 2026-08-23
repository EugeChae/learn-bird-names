import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhotoGridQuizCard from "@/components/PhotoGridQuizCard";
import { createSession } from "@/services/quiz.service";
import { getProgress } from "@/services/progress.service";
import type { Species, DifficultyTier, QuizSession } from "@/types";

// ─── 픽스처 (QuizCard.test와 동일 구조) ─────────────────────────────────────────

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
    { mode: "name-to-photo", scope: "all", size },
    { rng: seededRng(seed), pool: POOL, decoyPool: POOL }
  );
}

const selectLabel = (i: number) => `${i + 1}번 사진 선택`;

// ─── 테스트 ─────────────────────────────────────────────────────────────────────

describe("PhotoGridQuizCard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("정답 종 이름과 2×2 사진 그리드(4장)를 렌더한다", () => {
    const s = makeSession(1);
    render(<PhotoGridQuizCard session={s} />);
    expect(
      screen.getByText(s.questions[0].species.name_korean)
    ).toBeInTheDocument();
    for (let i = 0; i < 4; i++) {
      expect(
        screen.getByRole("button", { name: selectLabel(i) })
      ).toBeInTheDocument();
    }
    expect(s.questions[0].choices).toHaveLength(4);
    expect(screen.getByText(/연속/)).toBeInTheDocument();
  });

  it("사진 alt·확대 모달은 종 이름을 노출하지 않는다(정답 유출 방지)", () => {
    const s = makeSession(1);
    render(<PhotoGridQuizCard session={s} />);
    // 그리드 사진 alt은 번호만 ("새 사진 N")
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByAltText(`새 사진 ${i}`)).toBeInTheDocument();
    }
    // 오답 종 이름이 화면에 드러나지 않는다 (질문 종 이름만 존재)
    const decoy = s.questions[0].choices.find(
      (c) => c.id !== s.questions[0].correctId
    )!;
    expect(screen.queryByText(decoy.name_korean)).toBeNull();
  });

  it("정답 사진을 고르면 정답 피드백과 다음 버튼이 나온다", async () => {
    const user = userEvent.setup();
    const s = makeSession(1);
    render(<PhotoGridQuizCard session={s} />);
    const q = s.questions[0];
    const correctIdx = q.choices.findIndex((c) => c.id === q.correctId);
    await user.click(
      screen.getByRole("button", { name: selectLabel(correctIdx) })
    );
    expect(screen.getByText(/정답입니다/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toBeInTheDocument();
  });

  it("첫 오답은 재시도 안내를 주고 정답을 공개하지 않는다", async () => {
    const user = userEvent.setup();
    const s = makeSession(1);
    render(<PhotoGridQuizCard session={s} />);
    const q = s.questions[0];
    const wrongIdx = q.choices.findIndex((c) => c.id !== q.correctId);
    const correctIdx = q.choices.findIndex((c) => c.id === q.correctId);
    await user.click(screen.getByRole("button", { name: selectLabel(wrongIdx) }));
    expect(screen.getByText(/다시 시도/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "다음" })).toBeNull();
    await user.click(
      screen.getByRole("button", { name: selectLabel(correctIdx) })
    );
    expect(screen.getByText(/정답입니다/)).toBeInTheDocument();
  });

  it("두 번째 오답이면 정답 사진을 공개한다", async () => {
    const user = userEvent.setup();
    const s = makeSession(1);
    render(<PhotoGridQuizCard session={s} />);
    const q = s.questions[0];
    const wrongIdxs = q.choices
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.id !== q.correctId)
      .map(({ i }) => i);
    await user.click(
      screen.getByRole("button", { name: selectLabel(wrongIdxs[0]) })
    );
    await user.click(
      screen.getByRole("button", { name: selectLabel(wrongIdxs[1]) })
    );
    expect(screen.getByText(/정답 사진을 초록색/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toBeInTheDocument();
  });

  it("힌트 버튼은 정보를 1회 보여주고 사라진다", async () => {
    const user = userEvent.setup();
    render(<PhotoGridQuizCard session={makeSession(1)} />);
    await user.click(screen.getByRole("button", { name: /힌트 보기/ }));
    expect(screen.getByText(/서식지:/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /힌트 보기/ })).toBeNull();
  });

  it("키보드 숫자키로 사진을 선택할 수 있다", () => {
    const s = makeSession(1);
    render(<PhotoGridQuizCard session={s} />);
    const q = s.questions[0];
    const correctIdx = q.choices.findIndex((c) => c.id === q.correctId);
    fireEvent.keyDown(window, { key: String(correctIdx + 1) });
    expect(screen.getByText(/정답입니다/)).toBeInTheDocument();
  });

  it("확대 버튼으로 사진 모달이 열리고 닫힌다", async () => {
    const user = userEvent.setup();
    render(<PhotoGridQuizCard session={makeSession(1)} />);
    await user.click(screen.getByRole("button", { name: "1번 사진 확대" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("확정된 답만 진도에 저장하고, 재시도 중에는 쓰지 않는다", async () => {
    const user = userEvent.setup();
    const s = makeSession(1);
    render(<PhotoGridQuizCard session={s} />);
    const q = s.questions[0];
    const wrongIdx = q.choices.findIndex((c) => c.id !== q.correctId);
    const correctIdx = q.choices.findIndex((c) => c.id === q.correctId);
    await user.click(screen.getByRole("button", { name: selectLabel(wrongIdx) }));
    expect(getProgress(q.correctId)).toBeNull();
    await user.click(
      screen.getByRole("button", { name: selectLabel(correctIdx) })
    );
    const saved = getProgress(q.correctId);
    expect(saved).not.toBeNull();
    expect(saved?.last_quality).toBe(1);
    expect(saved?.correct_count).toBe(1);
  });

  it("모든 문제를 풀면 짝짓기 복습 화면으로 전환한다", async () => {
    const user = userEvent.setup();
    const s = makeSession(1);
    render(<PhotoGridQuizCard session={s} />);
    const q = s.questions[0];
    const correctIdx = q.choices.findIndex((c) => c.id === q.correctId);
    fireEvent.keyDown(window, { key: String(correctIdx + 1) });
    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.getByText(/퀴즈 완료/)).toBeInTheDocument();
    expect(screen.getByText(/짝짓기 복습/)).toBeInTheDocument();
  });
});
