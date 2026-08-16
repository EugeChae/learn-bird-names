import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ko">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
