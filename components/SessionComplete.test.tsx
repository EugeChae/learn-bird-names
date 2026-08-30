import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SessionComplete from "@/components/SessionComplete";
import {
  createSession,
  nextQuestion,
  submitAnswer,
} from "@/services/quiz.service";
import type { Species, QuizSession } from "@/types";

function sp(id: string, name: string, order: string, family: string): Species {
  return {
    id,
    name_korean: name,
    name_latin: id,
    name_english: id,
    order,
    family,
    habitat: [],
    difficulty_tier: 1,
    abundance: "c",
    status: ["Res"],
    media: [
      {
        url: `https://x/${id}.jpg`,
        sex: "unknown",
        age: "adult",
        plumage: "unknown",
        angle: "unknown",
        license: "CC",
        attribution: "a",
        quality_score: 2,
      },
    ],
    trivia: [],
  };
}

const POOL: Species[] = [
  sp("magpie", "까치", "Passeriformes", "Corvidae"),
  sp("sparrow", "참새", "Passeriformes", "Passeridae"),
  sp("heron", "왜가리", "Pelecaniformes", "Ardeidae"),
  sp("duck", "청둥오리", "Anseriformes", "Anatidae"),
];

function rng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** 1문제 세션을 만들고 결과를 지정대로 몰아준다. */
function oneQuestion(outcome: "clean" | "revealed"): QuizSession {
  const s = createSession(
    { mode: "photo-to-name", scope: "all", size: 1 },
    { rng: rng(3), pool: POOL, decoyPool: POOL }
  );
  const q = nextQuestion(s)!;
  if (outcome === "clean") {
    submitAnswer(s, q.correctId, false);
  } else {
    const wrong = q.choices.find((c) => c.id !== q.correctId)!.id;
    submitAnswer(s, wrong, false);
    submitAnswer(s, wrong, false);
  }
  return s;
}

describe("SessionComplete", () => {
  it("전부 1번에 맞힌 세션은 짝짓기를 건너뛰고 결과 화면으로 시작한다", () => {
    render(<SessionComplete session={oneQuestion("clean")} />);
    expect(screen.getByRole("region", { name: "세션 결과" })).toBeInTheDocument();
    expect(screen.getByText("퀴즈 완료!")).toBeInTheDocument();
    // 정답 1 / 오답 0
    expect(screen.getByText("정답").nextElementSibling).toHaveTextContent("1");
    expect(screen.getByText("오답").nextElementSibling).toHaveTextContent("0");
    expect(
      screen.getByRole("link", { name: /새 퀴즈 시작/ })
    ).toBeInTheDocument();
  });

  it("어려웠던 종이 있으면 먼저 짝짓기 복습 화면을 보인다", () => {
    render(<SessionComplete session={oneQuestion("revealed")} />);
    expect(
      screen.getByRole("region", { name: "세션 완료 · 짝짓기 복습" })
    ).toBeInTheDocument();
    expect(screen.getByText("짝짓기 복습")).toBeInTheDocument();
    // 아직 결과 화면은 아니다
    expect(screen.queryByText("퀴즈 완료!")).toBeNull();
  });
});
