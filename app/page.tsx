import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold text-center">한국 새 이름 배우기</h1>
      <p className="text-gray-600 text-center">
        사진 퀴즈로 한국 새 이름을 자연스럽게 외워보세요
      </p>
      <Link
        href="/quiz"
        className="rounded-lg bg-green-600 px-6 py-3 text-lg font-semibold text-white hover:bg-green-700"
      >
        퀴즈 시작
      </Link>
    </main>
  );
}
