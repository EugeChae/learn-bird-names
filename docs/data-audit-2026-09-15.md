# 종 데이터 정합성 점검 (2026-09-15, 130종, 사진 제외)

## 대조 기준
- **한국조류학회 『한국조류목록 개정판 v2.1』(2025-06)** — 국명·학명·과의 국내 표준(KOS 2025).
- **Birds Korea Checklist 2024** — IOC World Bird List 14.1 기준 국명·영명(BK 2024).
- **IOC World Bird List 갱신 이력(diary/species updates, 최신 15.2, 2025-11)** — 학명·영명 변경 시점 확인.
- 보조: GBIF 백본(학명 유효성), Wikidata(국명/영명 라벨), NIBR 한반도의 생물다양성(국명 표기).
- 방법: species.json 130종 × (국명↔학명↔영명, 목/과) 자동 대조 스크립트 + 개별 확인.

## 결과 요약
- 목(order) 18개·과(family) 48개: **전부 KOS 2025와 일치**(오류 0).
- 국명↔학명 **불일치 1건(오류)**: 큰기러기.
- 학명이 IOC 최신판/KOS 2025보다 **한 세대 뒤진 것 7건**.
- 영명이 IOC 최신판과 **다른 것 4건**(그중 2건은 학명 갱신에 따라 자동 변경).
- 국명 **공식 표기와 다른 것 6건**(딱따구리→딱다구리 5, 멋쟁이→멋쟁이새 1).
- 데이터 코드 오류: `abundance: "u"` 8건(타입 정의에 없는 값).
- 상태(Res/SV/WV/PM) 재검토 권고 2건.

## A. 오류 — 반드시 수정
| # | 종 | 현재 | 공식(KOS 2025 = BK 2024 = IOC) | 비고 |
|---|---|---|---|---|
| 1 | 큰기러기 | `Anser fabalis` / Taiga Bean Goose | **`Anser serrirostris` / Tundra Bean Goose** | 한국에서 큰기러기 = 툰드라형(serrirostris). `A. fabalis`의 국명은 **큰부리큰기러기**. 사진도 iNat `Anser fabalis` 관측이라 **사진 재검수 필요**(사진 점검 단계에서). 트리비아도 재작성 대상. |

## B. 학명 갱신 — IOC 14.2~15.1 및 KOS 2025 반영 권고
| # | 종 | 현재 | 최신(KOS 2025 · IOC) | 근거 |
|---|---|---|---|---|
| 2 | 황로 | `Bubulcus coromandus` | **`Ardea coromanda`** | IOC 14.2: Bubulcus를 Ardea에 병합(Hruska et al. 2023). KOS 2025 동일. 영명 Eastern Cattle Egret 유지. |
| 3 | 참매 | `Accipiter gentilis` / Northern Goshawk | **`Astur gentilis` / Eurasian Goshawk** | IOC 14.2: Astur 속 부활. 영명은 IOC 14.1부터 Eurasian Goshawk(북미종 분리). KOS 2025 동일. |
| 4 | 재두루미 | `Grus vipio` | **`Antigone vipio`** | IOC(2016~)·KOS 2025·BK 2024 모두 Antigone. |
| 5 | 갈까마귀 | `Corvus dauuricus` | **`Coloeus dauuricus`** | IOC·KOS 2025·BK 2024 모두 Coloeus. (Clements만 Corvus 유지) |
| 6 | 붉은머리오목눈이 | `Sinosuthora webbiana` | **`Suthora webbiana`** | IOC 13.2: Sinosuthora→Suthora. KOS 2025·BK 2024 동일. |
| 7 | 검은댕기해오라기 | `Butorides striata` / Striated Heron | **`Butorides atricapilla` / Little Heron** | IOC 15.1(2025-01): 구대륙 개체군을 Little Heron으로 분리. KOS 2025 동일(BK 2024는 14.1 기준이라 아직 striata). 트리비아 "남미·카리브 번식" 문장은 striata(신대륙종) 설명이므로 함께 수정. |
| 8 | 박새 | `Parus minor` / Japanese Tit | **`Parus cinereus` / Cinereous Tit** (판단 필요) | IOC 14.2: Japanese Tit을 Cinereous Tit에 병합. KOS 2025·한국어 위키 동일. 단 Clements/eBird·iNaturalist는 여전히 `Parus minor`(Japanese Tit). **국내 표준(KOS)을 따르려면 변경, iNat 연동 편의를 우선하면 유지.** 권고: 변경(국내 표준 우선). |

## C. 영명 — IOC 최신판과 다름
| # | 종 | 현재 | IOC / KOS | 비고 |
|---|---|---|---|---|
| 9 | 방울새 | Oriental Greenfinch | **Grey-capped Greenfinch** | IOC·BK 2024. (KOS 2025는 Oriental Greenfinch 병기) → IOC 권고. |
| 10 | 귀제비 | Red-rumped Swallow | **Eastern Red-rumped Swallow** | IOC 14.2에서 유럽종(`C. rufula`) 분리 후 동아시아종 영명. KOS 2025 동일. |
| 11 | 중백로 | Medium Egret | Medium Egret(IOC 13.2~) / Eastern Intermediate Egret(BK 2024 자체 표기) | **현행 유지.** |
| 12 | 검은머리물떼새 | Eurasian Oystercatcher `H. ostralegus` | 동일(IOC 15.2·KOS 2025) | BK 2024만 `H. osculans` Far Eastern Oystercatcher를 자체 예외(*)로 표기. **현행 유지**, 향후 IOC 분리 시 갱신. |

## D. 국명 — 공식 표기와 다름
| # | 현재 | KOS 2025 · BK 2024 · NIBR | 비고 |
|---|---|---|---|
| 13 | 오색딱따구리·쇠딱따구리·청딱따구리·큰오색딱따구리·까막딱따구리 (+라벨 딱따구리목/과) | **딱다구리** (오색딱다구리…, 딱다구리목, 딱다구리과) | 조류학계·NIBR·탐조인 표준은 "딱다구리". 국어사전 표제어는 "딱따구리". **권고: 공식 표기 딱다구리로 변경**(퀴즈 정답 표기 일관성). 검색·별칭이 필요하면 추후 alias 필드. |
| 14 | 멋쟁이 | **멋쟁이새**(KOS 2025·NIBR) / 멋쟁이(BK 2024, 구 도감) | 두 표기 병존. **권고: 멋쟁이새**(NIBR·KOS). |
| 15 | 넓적부리 | 넓적부리(KOS 2025·NIBR) / 넓적부리오리(BK 2024) | **현행 유지.** |

## E. 데이터 코드·상태
| # | 항목 | 문제 | 권고 |
|---|---|---|---|
| 16 | `abundance: "u"` 8건 — 상모솔새·큰유리새·저어새·두루미·호랑지빠귀·소쩍새·솔부엉이·참매 | `Abundance` 타입(`ab/c/uc/sc/r`)에 없는 값. 라벨맵에 "u: 적음"이 있어 화면엔 보이지만 타입·필터와 불일치. | 상모솔새 c · 큰유리새 c · 소쩍새 c · 솔부엉이 c · 저어새 uc · 두루미 uc · 호랑지빠귀 uc · 참매 uc. 아울러 `validate-data`에 코드 검증 추가. |
| 17 | 황로 abundance `uc` | 흔한 여름철새(NIBR "흔한 여름철새") | `c` |
| 18 | 중대백로 status `SV` | 아종 modesta(중대백로)는 여름철새, alba(대백로)는 겨울철새 — 종 단위로는 연중 관찰 | `["SV","WV"]` |
| 19 | 촉새 status `SV,PM` | 국내에선 주로 나그네새·남부 월동, 번식은 드묾 | `["PM","WV"]` |

## F. 라벨맵(lib/taxonomy-labels.ts) 국명
| 학명 | 현재 | KOS 2025 | 판단 |
|---|---|---|---|
| Picidae / Piciformes | 딱따구리과/목 | **딱다구리과/목** | D-13과 함께 변경 권고 |
| Muscicapidae | 딱새과 | **솔딱새과** | KOS 2025 표기. 친숙도로 딱새과를 택했던 결정(2026-09) — 재검토 권고(솔딱새과가 현행 표준). |
| Cuculidae / Cuculiformes | 뻐꾸기과/목 | 두견이과/목 | 친숙도 우선으로 의도한 선택. 유지 가능. |

## G. 이상 없음(확인 완료)
- 나머지 106종의 국명·학명·영명·목·과 모두 KOS 2025·BK 2024와 일치.
- 흰목물떼새 `Charadrius placidus`: IOC 14.1~15.2·KOS 2025 모두 Charadrius 유지(Clements/iNat만 Thinornis) → 현행 유지.
- 검은딱새 `Saxicola stejnegeri` Amur Stonechat, 재갈매기 `Larus vegae`, 갈매기 `Larus canus`, 큰고니·비오리 등 이번 확장분 전부 일치.

## 스크립트
스크래치 `birds/compare.py`(KOS·BK PDF 텍스트 파싱 → 130종 대조), `birds/taxa.py`(목·과·라벨 대조), `birds/audit.mjs`(GBIF·Wikidata). 재실행 시 두 PDF(`bk2024.pdf`, `kos2025.pdf`)는 위 출처에서 다시 받는다.
