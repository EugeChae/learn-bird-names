// 종 카드의 "도감" 칩에 쓸 한국어 라벨. 데이터 코드(abundance/status)를 사람이 읽는 말로.

const ABUNDANCE_KO: Record<string, string> = {
  ab: "매우 흔함",
  c: "흔함",
  uc: "보통",
  sc: "국지적",
  u: "적음",
  r: "드묾",
};

const STATUS_KO: Record<string, string> = {
  Res: "텃새",
  SV: "여름철새",
  WV: "겨울철새",
  PM: "나그네새",
  Vag: "길잃은새",
};

/** 흔함 정도(예: "흔함"). 모르는 코드면 undefined. */
export function abundanceKo(code: string): string | undefined {
  return ABUNDANCE_KO[code];
}

/** 서식 구분 라벨 목록(예: ["텃새"], ["여름철새","나그네새"]). */
export function statusKo(codes: readonly string[]): string[] {
  return codes.map((c) => STATUS_KO[c]).filter(Boolean) as string[];
}
