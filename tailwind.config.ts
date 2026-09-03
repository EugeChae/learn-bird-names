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
        // 레퍼런스 팔레트(Olga Davydova) — 귀여운 보태니컬 톤. soft=칩·배지 배경용 연한 틴트.
        leaf: { DEFAULT: "#5d7b3d", soft: "#eaf1e0" },
        pollen: { DEFAULT: "#e0a80f", soft: "#fbf0cf" },
        sky: { DEFAULT: "#5b8fc0", soft: "#e7f0f9" },
        blush: { DEFAULT: "#d76a92", soft: "#fce4ec" },
        petal: { DEFAULT: "#e4568b" },
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
