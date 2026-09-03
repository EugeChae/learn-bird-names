import type { Metadata } from "next";
import { Jua, Gowun_Dodum } from "next/font/google";
import "./globals.css";

// 제목: Jua(둥글둥글 정돈된 디스플레이). 본문: Gowun Dodum(부드럽고 예쁜 고딕, 가독성↑).
// 한글 글리프가 포함된 폰트라 subsets는 latin만 지정해도 된다(자동 포함).
const heading = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});
const body = Gowun_Dodum({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-body",
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
    <html lang="ko" className={`${heading.variable} ${body.variable}`}>
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
