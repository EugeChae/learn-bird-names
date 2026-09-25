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

/** status → 한 줄 초대 문구(STORY-017, Sophia). 계절과 맞는 status를 넘겨야 한다. */
const STATUS_INVITE: Record<string, string> = {
  Res: "늘 여기 있어요",
  SV: "겨울이면 떠나요",
  WV: "이제 막 왔어요",
  PM: "지나가는 길이에요",
  Vag: "길을 잃고 들렀어요",
};

export function statusInvite(code: string | undefined): string | undefined {
  return code ? STATUS_INVITE[code] : undefined;
}

/** 서식 구분 라벨 목록(예: ["텃새"], ["여름철새","나그네새"]). */
export function statusKo(codes: readonly string[]): string[] {
  return codes.map((c) => STATUS_KO[c]).filter(Boolean) as string[];
}
