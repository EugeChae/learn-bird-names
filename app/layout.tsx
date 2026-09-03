import type { Metadata } from "next";
import { Gaegu, Gamja_Flower } from "next/font/google";
import "./globals.css";

// 제목: Gaegu(통통한 손글씨, 굵게). 본문: Gamja Flower(부드러운 손글씨).
// 한글 글리프가 포함된 폰트라 subsets는 latin만 지정해도 된다(자동 포함).
const gaegu = Gaegu({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});
const gamja = Gamja_Flower({
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
    <html lang="ko" className={`${gaegu.variable} ${gamja.variable}`}>
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
