// "새의 하루" 문장 초안 검수 시트 + 반영 (STORY-017 AC11).
//
//   node scripts/moment-sheet.js sheet <drafts.json>   → out/moment-sheet-<batch>.html 생성·열기
//   node scripts/moment-sheet.js apply <drafts.json>   → 승인(approved: true)된 문장을 species.json에 반영
//
// drafts.json 형식:
// { "batch": "1", "items": [
//   { "species": "까치", "moment": "dawn", "content": "지금쯤 …", "trivia_source": "Wikipedia, …, 2026-09 확인",
//     "url": "https://…", "evidence": "원문 근거(영문)", "time_tied": true, "approved": true, "note": "" } ] }
//
// 원칙: 사실·출처는 그대로, 동사 시제만 현재. 시각 근거(time_tied)가 없으면 "지금쯤"으로만 쓴다.
// apply는 같은 (species, moment)가 이미 있으면 내용을 교체하고, 없으면 추가한다.

const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const DATA_PATH = path.join(__dirname, "..", "public", "data", "species.json");
const OUT_DIR = path.join(__dirname, "..", "out");
const MOMENT_KO = { dawn: "새벽", day: "한낮", dusk: "해질녘" };
const MOMENTS = ["dawn", "day", "dusk"];

function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function loadDrafts(file) {
  const drafts = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!drafts || !Array.isArray(drafts.items)) throw new Error("drafts.items 배열이 필요합니다.");
  return drafts;
}

function buildSheet(drafts, species) {
  const byName = Object.fromEntries(species.map((s) => [s.name_korean, s]));
  const names = [...new Set(drafts.items.map((d) => d.species))];
  const blocks = names
    .map((name) => {
      const s = byName[name];
      const photo = s?.media?.[0]?.url ?? "";
      const rows = MOMENTS.map((m) => {
        const d = drafts.items.find((x) => x.species === name && x.moment === m);
        if (!d) return `<tr><td class="m">${MOMENT_KO[m]}</td><td colspan="3" class="g">초안 없음</td></tr>`;
        return `<tr class="${d.approved === false ? "rej" : ""}">
  <td class="m">${MOMENT_KO[m]}${d.time_tied ? "" : '<br><small class="g">시각 근거 없음 → 지금쯤</small>'}</td>
  <td class="ko">${esc(d.content)}${d.note ? `<br><small class="note">메모: ${esc(d.note)}</small>` : ""}</td>
  <td><small>${esc(d.evidence)}</small></td>
  <td><small>${esc(d.trivia_source)}${d.url ? `<br><a href="${esc(d.url)}" target="_blank" rel="noopener">원문</a>` : ""}</small></td>
</tr>`;
      }).join("");
      return `<section>
<h2>${esc(name)} <small class="g">${esc(s?.name_latin ?? "")} · 기존 트리비아 ${s?.trivia?.length ?? 0}개</small></h2>
<div class="row"><img src="${esc(photo)}" loading="lazy" alt="">
<table><thead><tr><th>순간</th><th>문장(한국어, 현재형)</th><th>근거(원문)</th><th>출처</th></tr></thead><tbody>${rows}</tbody></table></div>
</section>`;
    })
    .join("");
  const total = drafts.items.length;
  const tied = drafts.items.filter((d) => d.time_tied).length;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>새의 하루 초안 검수 · 배치 ${esc(drafts.batch)}</title>
<style>
body{font-family:system-ui,sans-serif;margin:16px;background:#fafafa;color:#222;max-width:1200px}
section{margin:18px 0;padding:12px;background:#fff;border:1px solid #ddd;border-radius:10px}
h2{margin:0 0 8px;font-size:20px}.row{display:flex;gap:12px;align-items:flex-start}
img{width:160px;height:120px;object-fit:cover;border-radius:8px;background:#eee;flex:none}
table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #eee;padding:6px 8px;vertical-align:top;text-align:left}
.m{white-space:nowrap;font-weight:600;color:#9a6700}.ko{font-size:16px;line-height:1.5}.g{color:#888;font-weight:400}
.note{color:#b35c00}.rej{opacity:.45;text-decoration:line-through}a{color:#0969da}
.bar{position:sticky;top:0;background:#fafafa;padding:8px 0;border-bottom:2px solid #ccc}
</style></head><body>
<div class="bar"><b>새의 하루 초안 · 배치 ${esc(drafts.batch)}</b> · ${names.length}종 ${total}문장 · 시각 근거 있음 ${tied}/${total}
<br><small class="g">검수 방법: 종 이름 + 순간 + "OK / 수정: …새 문장… / 빼기" 로 알려주면 반영합니다. 사실·출처는 바꾸지 않고 시제만 현재입니다.</small></div>
${blocks}
</body></html>`;
}

function apply(drafts, speciesList) {
  const byName = Object.fromEntries(speciesList.map((s) => [s.name_korean, s]));
  let added = 0, replaced = 0, skipped = 0;
  for (const d of drafts.items) {
    if (d.approved === false) { skipped++; continue; }
    const s = byName[d.species];
    if (!s) throw new Error(`없는 종: ${d.species}`);
    if (!MOMENTS.includes(d.moment)) throw new Error(`${d.species}: moment 무효 ${d.moment}`);
    if (!d.content || !d.trivia_source) throw new Error(`${d.species}/${d.moment}: content·trivia_source 필수`);
    const entry = { content: d.content.trim(), type: "ecology", trivia_source: d.trivia_source.trim(), moment: d.moment };
    const idx = s.trivia.findIndex((t) => t.moment === d.moment);
    if (idx >= 0) { s.trivia[idx] = entry; replaced++; } else { s.trivia.push(entry); added++; }
  }
  return { added, replaced, skipped };
}

function main() {
  const [cmd, file] = process.argv.slice(2);
  if (!cmd || !file) {
    console.error("usage: node scripts/moment-sheet.js <sheet|apply> <drafts.json>");
    process.exit(1);
  }
  const drafts = loadDrafts(file);
  const species = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  if (cmd === "sheet") {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const out = path.join(OUT_DIR, `moment-sheet-${drafts.batch ?? "x"}.html`);
    fs.writeFileSync(out, buildSheet(drafts, species));
    console.log(`검수 시트 생성: ${out}`);
    if (!process.argv.includes("--no-open")) {
      const opener = process.platform === "win32" ? ["cmd", ["/c", "start", "", out]] : process.platform === "darwin" ? ["open", [out]] : ["xdg-open", [out]];
      execFile(opener[0], opener[1], () => {});
    }
  } else if (cmd === "apply") {
    const r = apply(drafts, species);
    fs.writeFileSync(DATA_PATH, JSON.stringify(species, null, 2) + "\n");
    console.log(`반영: 추가 ${r.added} · 교체 ${r.replaced} · 제외 ${r.skipped}. 이어서 npm run validate-data 를 실행하세요.`);
  } else {
    console.error(`알 수 없는 명령: ${cmd}`);
    process.exit(1);
  }
}

if (require.main === module) main();
module.exports = { buildSheet, apply };
