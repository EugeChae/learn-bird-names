# learn-bird-names

한국 새 이름 배우기 웹앱. Next.js 정적 export + Tailwind + Vitest. 배포는 main push → Vercel.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

핵심 규칙(DESIGN.md 요약):
- 색은 `app/globals.css`의 토큰(leaf·pollen·sky·blush·petal + soft/deep)만 쓴다. Tailwind 기본색(green-600 등) 금지.
- 종이(#fdf8f1)는 칠하지 않는다. 시간대는 장식·강조의 상태로만.
- 사진은 무대: 비율 추종(`BirdPhoto fit="natural"`), 그림자·색 띠·잘림 없음, 사진에서 색을 뽑지 않는다.
- 벌 없음: 스트릭·불꽃·진행바·빨간 X 금지.

## 작업 습관
- cleor가 "의논/불러서"라고 하면 코드보다 대화(BMAD 에이전트)부터. 프로토타입은 물어보고 만든다.
- 파티 세션 기록: `docs/party-mode/HISTORY.md`, memlog `docs/party-mode/memories/installed/.memlog.md`.
- 데이터 검증: `npm run validate-data`. 검수 시트: `npm run data-sheet`, `node scripts/moment-sheet.js`.
