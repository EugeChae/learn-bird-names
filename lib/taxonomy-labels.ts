// ─── 한국어 목(目)/과(科) 라벨 (STORY-014 / FR-015) ─────────────────────────────
//
// species.json은 목/과를 학명(Latin)으로만 보관한다. Taxonomy 퀴즈는 초보 학습자에게
// "Corvidae" 대신 "까마귀과"를 보여야 하므로 Latin→한국어 표준명을 여기서 매핑한다.
//
// 출처: 국립생물자원관 국가생물종목록 · Birds Korea 2024 체크리스트의 표준 국명.
// (분류학 명칭은 도감·학술 표준 사실이며 AI 생성 콘텐츠가 아니다 — 트리비아 금지 원칙과 무관.)
// 현재 데이터(50종)에 등장하는 15목·35과를 모두 포함한다. 누락 시 Latin으로 폴백.

const ORDER_KO: Record<string, string> = {
  Accipitriformes: "수리목",
  Anseriformes: "기러기목",
  Bucerotiformes: "코뿔새목",
  Charadriiformes: "도요목",
  Columbiformes: "비둘기목",
  Coraciiformes: "파랑새목",
  Cuculiformes: "두견목",
  Falconiformes: "매목",
  Galliformes: "닭목",
  Gruiformes: "두루미목",
  Passeriformes: "참새목",
  Pelecaniformes: "사다새목",
  Piciformes: "딱따구리목",
  Podicipediformes: "논병아리목",
  Suliformes: "가다랭이잡이목",
};

const FAMILY_KO: Record<string, string> = {
  Accipitridae: "수리과",
  Acrocephalidae: "개개비과",
  Aegithalidae: "오목눈이과",
  Alcedinidae: "물총새과",
  Anatidae: "오리과",
  Ardeidae: "백로과",
  Charadriidae: "물떼새과",
  Columbidae: "비둘기과",
  Coraciidae: "파랑새과",
  Corvidae: "까마귀과",
  Cuculidae: "두견과",
  Emberizidae: "멧새과",
  Falconidae: "매과",
  Gruidae: "두루미과",
  Hirundinidae: "제비과",
  Laniidae: "때까치과",
  Laridae: "갈매기과",
  Motacillidae: "할미새과",
  Muscicapidae: "딱새과",
  Oriolidae: "꾀꼬리과",
  Paradoxornithidae: "붉은머리오목눈이과",
  Paridae: "박새과",
  Passeridae: "참새과",
  Phalacrocoracidae: "가마우지과",
  Phasianidae: "꿩과",
  Picidae: "딱따구리과",
  Podicipedidae: "논병아리과",
  Pycnonotidae: "직박구리과",
  Rallidae: "뜸부기과",
  Regulidae: "상모솔새과",
  Sittidae: "동고비과",
  Sturnidae: "찌르레기과",
  Threskiornithidae: "저어새과",
  Upupidae: "후투티과",
  Zosteropidae: "동박새과",
};

/** 목(目) 학명 → 한국어 표준명. 미등록 시 학명 그대로. */
export function orderKo(latin: string): string {
  return ORDER_KO[latin] ?? latin;
}

/** 과(科) 학명 → 한국어 표준명. 미등록 시 학명 그대로. */
export function familyKo(latin: string): string {
  return FAMILY_KO[latin] ?? latin;
}

/** taxonLevel에 맞는 한국어 라벨(목/과)을 돌려준다. */
export function taxonKo(level: "order" | "family", latin: string): string {
  return level === "order" ? orderKo(latin) : familyKo(latin);
}
