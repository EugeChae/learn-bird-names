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

/**
 * 종 배열을 검증하고 사람이 읽을 오류 메시지 배열을 반환한다(빈 배열 = 통과).
 * 규칙: 각 사진의 license·attribution, 각 트리비아의 trivia_source가 비면 안 된다.
 */
function validateSpecies(speciesList) {
  if (!Array.isArray(speciesList)) {
    return ["최상위 데이터가 배열이 아닙니다."];
  }
  const errors = [];
  speciesList.forEach((species, i) => {
    const label = species && species.id ? species.id : `index ${i}`;
    const media = Array.isArray(species && species.media) ? species.media : [];
    media.forEach((m, mi) => {
      if (isBlank(m && m.license)) {
        errors.push(`[${label}] media[${mi}].license 가 비어 있습니다.`);
      }
      if (isBlank(m && m.attribution)) {
        errors.push(`[${label}] media[${mi}].attribution 이 비어 있습니다.`);
      }
    });
    const trivia = Array.isArray(species && species.trivia)
      ? species.trivia
      : [];
    trivia.forEach((t, ti) => {
      if (isBlank(t && t.trivia_source)) {
        errors.push(`[${label}] trivia[${ti}].trivia_source 가 비어 있습니다.`);
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
