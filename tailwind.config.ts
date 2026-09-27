import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        // 가로로 누운 창(폰 가로, 낮은 데스크톱 창): 폭이 lg 미만이어도 사진 옆에 답을 놓는다.
        wide: { raw: "(orientation: landscape) and (min-width: 640px)" },
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // 레퍼런스 팔레트(Olga Davydova) — 귀여운 보태니컬 톤. soft=칩·배지 배경용 연한 틴트.
        // 값은 app/globals.css의 CSS 변수(rgb 삼중값)에서 온다 — 팔레트 전환·미리보기 가능.
        leaf: { DEFAULT: "rgb(var(--leaf) / <alpha-value>)", soft: "rgb(var(--leaf-soft) / <alpha-value>)", deep: "rgb(var(--leaf-deep) / <alpha-value>)" },
        pollen: { DEFAULT: "rgb(var(--pollen) / <alpha-value>)", soft: "rgb(var(--pollen-soft) / <alpha-value>)", deep: "rgb(var(--pollen-deep) / <alpha-value>)" },
        sky: { DEFAULT: "rgb(var(--sky) / <alpha-value>)", soft: "rgb(var(--sky-soft) / <alpha-value>)", deep: "rgb(var(--sky-deep) / <alpha-value>)" },
        blush: { DEFAULT: "rgb(var(--blush) / <alpha-value>)", soft: "rgb(var(--blush-soft) / <alpha-value>)", deep: "rgb(var(--blush-deep) / <alpha-value>)" },
        petal: { DEFAULT: "rgb(var(--petal) / <alpha-value>)" },
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
        // 사진 자리표시자(BirdPhoto): 사진이 오는 중이라는 신호. 눈에 띄되 산만하지 않게.
        "photo-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        // 마일스톤 배너 등장(STORY-012): 살짝 커졌다 제자리 — 텍스트 우선, 과하지 않게.
        "milestone-pop": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "60%": { opacity: "1", transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "photo-pulse": "photo-pulse 1.4s ease-in-out infinite",
        "milestone-pop": "milestone-pop 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
