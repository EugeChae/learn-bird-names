import type { QuizSession } from "@/types";
import { getMatchingRound } from "@/services/quiz.service";

/**
 * 세션 종료 → 짝짓기 복습 화면(전환). 두 퀴즈 모드가 공유한다.
 * 인터랙티브 짝짓기 게임 자체는 STORY-013.
 */
export default function SessionComplete({ session }: { session: QuizSession }) {
  const pairs = getMatchingRound(session);
  const total = session.questions.length;
  const cleanCount = pairs.filter((p) => p.wasEasy).length;

  return (
    <section
      className="mx-auto flex w-full max-w-md flex-col gap-4 p-4"
      aria-label="세션 완료 · 짝짓기 복습"
    >
      <h2 className="text-2xl font-bold">퀴즈 완료!</h2>
      <p className="text-gray-700">
        최고 연속 정답 <strong>{session.maxStreak}</strong> · 1번에 맞힌 새{" "}
        <strong>
          {cleanCount} / {total}
        </strong>
      </p>

      <h3 className="mt-2 text-lg font-semibold">짝짓기 복습</h3>
      <p className="text-sm text-gray-500">
        이번 세션에서 만난 새들이에요. 흐린 항목은 1번에 맞힌 새입니다. (짝짓기
        게임은 준비 중 — STORY-013)
      </p>
      <ul className="flex flex-col gap-2">
        {pairs.map((p) => (
          <li
            key={p.species.id}
            className={`rounded-md border border-gray-200 px-3 py-2 ${
              p.wasEasy ? "opacity-40" : ""
            }`}
          >
            {p.species.name_korean}
          </li>
        ))}
      </ul>
    </section>
  );
}
