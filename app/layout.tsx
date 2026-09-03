import type { Metadata } from "next";
import { Jua } from "next/font/google";
import "./globals.css";

// 둥글둥글한 한글 디스플레이 폰트 — 제목에만 써서 귀여운 느낌을 주되 본문 가독성은 유지.
const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-jua",
  display: "swap",
});

export const metadata: Metadata = {
  title: "한국 새 이름 배우기",
  description: "사진 퀴즈로 한국 새 이름을 자연스럽게 외워보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={jua.variable}>
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
