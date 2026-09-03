import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        // layout.tsx의 next/font 변수와 연결. display=제목(Gaegu), body=본문(Gamja Flower).
        display: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        // 카드용 부드럽고 은은한 그림자(크림 배경 위에서 카드가 살짝 떠 보이게).
        soft: "0 6px 22px -12px rgba(74, 103, 65, 0.28)",
      },
      keyframes: {
        // 마일스톤 배너 등장(STORY-012): 살짝 커졌다 제자리 — 텍스트 우선, 과하지 않게.
        "milestone-pop": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "60%": { opacity: "1", transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "milestone-pop": "milestone-pop 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
