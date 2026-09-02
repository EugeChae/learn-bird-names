import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaxonomyCard from "@/components/TaxonomyCard";
import type { Species, TaxonomyQuestion, TaxonomySession } from "@/types";

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

function session(
  q: TaxonomyQuestion,
  over: Partial<TaxonomySession> = {}
): TaxonomySession {
  // submitTaxonomyAnswer는 문제를 in-place로 변이하므로 테스트마다 복제해 격리한다.
  return {
    id: "s",
    questions: [structuredClone(q)],
    currentIndex: 0,
    streak: 0,
    maxStreak: 0,
    ...over,
  };
}

const base = { usedHint: false, attemptCount: 0 } as const;

describe("TaxonomyCard · 유형1 photo-to-taxon", () => {
  const q: TaxonomyQuestion = {
    id: "q1",
    type: "photo-to-taxon",
    promptSpecies: sp("magpie", "까치", "Passeriformes", "Corvidae"),
    taxonLevel: "family",
    choices: [
      { id: "Corvidae", label: "까마귀과" },
      { id: "Anatidae", label: "오리과" },
      { id: "Ardeidae", label: "백로과" },
      { id: "Paridae", label: "박새과" },
    ],
    correctId: "Corvidae",
    ...base,
  };

  it("사진과 목/과 4지선다를 렌더하고 정답을 맞히면 피드백을 준다", async () => {
    const user = userEvent.setup();
    render(<TaxonomyCard session={session(q)} />);
    expect(screen.getByText(/어느 과\(科\)에 속할까요/)).toBeInTheDocument();
    expect(screen.getByAltText("분류를 맞혀야 할 새 사진")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /까마귀과/ }));
    expect(screen.getByText(/정답입니다/)).toBeInTheDocument();
  });

  it("틀리면 재시도 안내를 보인다", async () => {
    const user = userEvent.setup();
    render(<TaxonomyCard session={session(q)} />);
    await user.click(screen.getByRole("button", { name: /오리과/ }));
    expect(screen.getByText(/다시 시도/)).toBeInTheDocument();
  });
});

describe("TaxonomyCard · 유형2 odd-one-out", () => {
  const ducks = [
    sp("d1", "청둥오리", "Anseriformes", "Anatidae"),
    sp("d2", "쇠오리", "Anseriformes", "Anatidae"),
    sp("d3", "원앙", "Anseriformes", "Anatidae"),
  ];
  const crow = sp("c1", "까치", "Passeriformes", "Corvidae");
  const q: TaxonomyQuestion = {
    id: "q2",
    type: "odd-one-out",
    choices: [...ducks, crow].map((s) => ({
      id: s.id,
      label: s.name_korean,
      species: s,
    })),
    correctId: crow.id,
    ...base,
  };

  it("이상한 종을 고르면 정답, 공개 시 과 이름이 보인다", async () => {
    const user = userEvent.setup();
    render(<TaxonomyCard session={session(q)} />);
    expect(screen.getByText(/무리\(科\)가 다른 새/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /까치/ }));
    expect(screen.getByText(/정답입니다/)).toBeInTheDocument();
    // 공개 후 과 이름 표시 (오리 3마리 → 오리과 3개, 까치 → 까마귀과)
    expect(screen.getAllByText("오리과").length).toBe(3);
    expect(screen.getByText("까마귀과")).toBeInTheDocument();
  });
});

describe("TaxonomyCard · 유형3 family-membership", () => {
  const q: TaxonomyQuestion = {
    id: "q3",
    type: "family-membership",
    familyLabel: "오리과",
    askBelongs: true,
    choices: [
      sp("d1", "청둥오리", "Anseriformes", "Anatidae"),
      sp("c1", "까치", "Passeriformes", "Corvidae"),
      sp("h1", "왜가리", "Pelecaniformes", "Ardeidae"),
      sp("p1", "박새", "Passeriformes", "Paridae"),
    ].map((s) => ({ id: s.id, label: s.name_korean, species: s })),
    correctId: "d1",
    ...base,
  };

  it("과 이름을 제시하고, 공개 시 모든 보기의 과 이름을 보인다 (AC3)", async () => {
    const user = userEvent.setup();
    render(<TaxonomyCard session={session(q)} />);
    expect(screen.getByText(/'오리과'에 속하는 새는/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /청둥오리/ }));
    expect(screen.getByText(/정답입니다/)).toBeInTheDocument();
    // 공개 시 각 보기의 과 이름
    expect(screen.getByText("까마귀과")).toBeInTheDocument();
    expect(screen.getByText("백로과")).toBeInTheDocument();
    expect(screen.getByText("박새과")).toBeInTheDocument();
  });
});

describe("TaxonomyCard · 결과 화면", () => {
  it("세션이 끝나면 정답/오답/최고 스트릭을 보인다", () => {
    const q: TaxonomyQuestion = {
      id: "q",
      type: "photo-to-taxon",
      taxonLevel: "family",
      choices: [{ id: "Corvidae", label: "까마귀과" }],
      correctId: "Corvidae",
      resolvedCorrect: true,
      usedHint: false,
      attemptCount: 1,
    };
    render(
      <TaxonomyCard
        session={session(q, { currentIndex: 1, maxStreak: 1 })}
      />
    );
    expect(screen.getByText("분류 퀴즈 완료!")).toBeInTheDocument();
    expect(screen.getByText("정답").nextElementSibling).toHaveTextContent("1");
  });
});
