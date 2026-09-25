// 데이터 무결성 검증 (STORY-004 / NFR-004).
// CC 라이선스·attribution·트리비아 출처가 빠진 항목을 CI에서 빌드 실패로 막는다.
// 순수 함수 validateSpecies는 vitest로 테스트하고, CLI(main)는 파일을 읽어
// exit code로 결과를 알린다. next dev/lint/vitest는 이걸 안 잡으니 CI 게이트가 필요.

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "public", "data", "species.json");

/** 문자열이 아니거나 공백뿐이면 true. */
function isBlank(value) {
  return typeof value !== "string" || value.trim() === "";
}

// types/index.ts의 Abundance·Status와 동일해야 한다(JSON 임포트는 리터럴 타입을 못 잡는다 —
// 2026-09 감사에서 "u" 같은 무효 코드 8건이 빌드를 통과한 이유).
const ABUNDANCE_CODES = ["ab", "c", "uc", "sc", "r"];
const STATUS_CODES = ["Res", "SV", "WV", "PM", "Vag", "Probably extinct"];
const DIFFICULTY_TIERS = [1, 2, 3];
const TRIVIA_MOMENTS = ["dawn", "day", "dusk"];

/**
 * 종 배열을 검증하고 사람이 읽을 오류 메시지 배열을 반환한다(빈 배열 = 통과).
 * 규칙: 각 사진의 license·attribution, 각 트리비아의 trivia_source가 비면 안 되고,
 * abundance·status는 허용 코드만 쓴다. difficulty_tier는 종에 필수(1~3)이며,
 * 사진별 difficulty_tier는 선택이되 종 tier 이상이어야 하고 대표 사진(media[0])에는 둘 수 없다
 * (종 tier = 가장 쉬운 형태의 난이도라는 의미를 지키기 위해).
 * confusable_with는 존재하는 다른 종의 id만, 중복 없이, 그리고 반드시 대칭이어야 한다.
 */
function validateSpecies(speciesList) {
  if (!Array.isArray(speciesList)) {
    return ["최상위 데이터가 배열이 아닙니다."];
  }
  const errors = [];
  const ids = new Set(
    speciesList.map((s) => s && s.id).filter((id) => typeof id === "string")
  );
  const byId = new Map(speciesList.filter((s) => s && s.id).map((s) => [s.id, s]));
  speciesList.forEach((species, i) => {
    const label = species && species.id ? species.id : `index ${i}`;
    const media = Array.isArray(species && species.media) ? species.media : [];
    const speciesTier = species && species.difficulty_tier;
    if (!DIFFICULTY_TIERS.includes(speciesTier)) {
      errors.push(`[${label}] difficulty_tier 가 무효합니다: ${JSON.stringify(speciesTier)}`);
    }
    media.forEach((m, mi) => {
      const mediaTier = m && m.difficulty_tier;
      if (mediaTier !== undefined) {
        if (!DIFFICULTY_TIERS.includes(mediaTier)) {
          errors.push(`[${label}] media[${mi}].difficulty_tier 가 무효합니다: ${JSON.stringify(mediaTier)}`);
        } else if (mi === 0) {
          errors.push(`[${label}] media[0](대표 사진)에는 difficulty_tier 를 쓸 수 없습니다 — 종 tier로 옮기세요.`);
        } else if (DIFFICULTY_TIERS.includes(speciesTier) && mediaTier < speciesTier) {
          errors.push(`[${label}] media[${mi}].difficulty_tier(${mediaTier}) 가 종 tier(${speciesTier})보다 낮습니다.`);
        }
      }
      if (isBlank(m && m.license)) {
        errors.push(`[${label}] media[${mi}].license 가 비어 있습니다.`);
      }
      if (isBlank(m && m.attribution)) {
        errors.push(`[${label}] media[${mi}].attribution 이 비어 있습니다.`);
      }
    });
    const confusable = species && species.confusable_with;
    if (confusable !== undefined) {
      if (!Array.isArray(confusable)) {
        errors.push(`[${label}] confusable_with 가 배열이 아닙니다.`);
      } else {
        const seen = new Set();
        confusable.forEach((otherId) => {
          if (otherId === species.id) {
            errors.push(`[${label}] confusable_with 에 자기 자신이 있습니다.`);
          } else if (!ids.has(otherId)) {
            errors.push(`[${label}] confusable_with 에 없는 종 id: ${JSON.stringify(otherId)}`);
          } else {
            const other = byId.get(otherId);
            const back = Array.isArray(other.confusable_with) ? other.confusable_with : [];
            if (!back.includes(species.id)) {
              errors.push(`[${label}] confusable_with 가 대칭이 아닙니다: ${otherId} 쪽에 ${species.id} 가 없습니다.`);
            }
          }
          if (seen.has(otherId)) {
            errors.push(`[${label}] confusable_with 에 중복 id: ${JSON.stringify(otherId)}`);
          }
          seen.add(otherId);
        });
      }
    }
    if (species && !ABUNDANCE_CODES.includes(species.abundance)) {
      errors.push(`[${label}] abundance 코드가 무효합니다: ${JSON.stringify(species.abundance)}`);
    }
    const status = Array.isArray(species && species.status) ? species.status : [];
    status.forEach((code) => {
      if (!STATUS_CODES.includes(code)) {
        errors.push(`[${label}] status 코드가 무효합니다: ${JSON.stringify(code)}`);
      }
    });
    const trivia = Array.isArray(species && species.trivia)
      ? species.trivia
      : [];
    trivia.forEach((t, ti) => {
      if (isBlank(t && t.trivia_source)) {
        errors.push(`[${label}] trivia[${ti}].trivia_source 가 비어 있습니다.`);
      }
      const moment = t && t.moment;
      if (moment !== undefined && !TRIVIA_MOMENTS.includes(moment)) {
        errors.push(`[${label}] trivia[${ti}].moment 가 무효합니다: ${JSON.stringify(moment)}`);
      }
    });
  });
  return errors;
}

function main() {
  let raw;
  try {
    raw = fs.readFileSync(DATA_PATH, "utf8");
  } catch {
    console.error(`species.json을 읽을 수 없습니다: ${DATA_PATH}`);
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`species.json JSON 파싱 실패: ${err.message}`);
    process.exit(1);
  }
  const errors = validateSpecies(data);
  if (errors.length > 0) {
    console.error(`데이터 검증 실패 (${errors.length}건):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(
    `데이터 검증 통과: ${data.length}종, 라이선스·attribution·출처 누락 없음.`
  );
}

if (require.main === module) {
  main();
}

module.exports = { validateSpecies, isBlank };
