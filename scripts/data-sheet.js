// species.json 검수 시트 생성 (2026-09-25).
// 사진·종명·과·친숙도 tier·혼동 상대·서식지를 한 표로 만들어 브라우저에서 훑어본다.
// 편집은 하지 않는다(편집은 species.json 직접 수정 → npm run validate-data).
//
//   npm run data-sheet            → out/species-sheet.html 생성 후 브라우저로 연다
//   npm run data-sheet -- --no-open  → 생성만

const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const DATA_PATH = path.join(__dirname, "..", "public", "data", "species.json");
const OUT_DIR = path.join(__dirname, "..", "out");
const OUT_PATH = path.join(OUT_DIR, "species-sheet.html");

const TIER_LABEL = { 1: "1 일상", 2: "2 탐조 입문", 3: "3 탐조인만" };

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(species) {
  const byId = Object.fromEntries(species.map((s) => [s.id, s]));
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const s of species) counts[s.difficulty_tier] = (counts[s.difficulty_tier] || 0) + 1;

  const sorted = [...species].sort(
    (a, b) =>
      a.order.localeCompare(b.order) ||
      a.family.localeCompare(b.family) ||
      a.difficulty_tier - b.difficulty_tier ||
      a.name_korean.localeCompare(b.name_korean, "ko")
  );

  const rows = sorted
    .map((s) => {
      const photo = s.media[0];
      const confusables = (s.confusable_with ?? [])
        .map((id) => `<span class="c">${esc(byId[id]?.name_korean ?? id)}</span>`)
        .join(" ");
      const moments = ["dawn", "day", "dusk"]
        .map((m) => (s.trivia.some((t) => t.moment === m) ? "●" : "○"))
        .join("");
      const mediaTiers = s.media
        .slice(1)
        .filter((m) => m.difficulty_tier)
        .map((m) => `${m.sex}/${m.age} → tier ${m.difficulty_tier}`)
        .join(", ");
      return `
<tr data-tier="${s.difficulty_tier}">
  <td>${photo ? `<img src="${esc(photo.url)}" loading="lazy" alt="">` : '<span class="g">사진 없음</span>'}</td>
  <td><b>${esc(s.name_korean)}</b><br><small>${esc(s.name_latin)}</small><br><small class="g">${esc(s.order)} · ${esc(s.family)}</small></td>
  <td class="t${s.difficulty_tier}">${TIER_LABEL[s.difficulty_tier] ?? s.difficulty_tier}${
        mediaTiers ? `<br><small class="g">사진별: ${esc(mediaTiers)}</small>` : ""
      }</td>
  <td>${confusables || '<span class="g">—</span>'}</td>
  <td><small>${esc(s.abundance)} · ${esc(s.status.join("/"))}<br>${esc(s.habitat.join(", "))}<br>사진 ${s.media.length}장 · 하루 ${moments}</small></td>
</tr>`;
    })
    .join("");

  const today = new Date().toISOString().slice(0, 10);
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>species.json 검수 시트</title>
<style>
body{font-family:system-ui,sans-serif;margin:16px;background:#fafafa;color:#222}
table{border-collapse:collapse;width:100%}
td,th{border-bottom:1px solid #ddd;padding:6px 8px;vertical-align:top;text-align:left}
img{width:110px;height:82px;object-fit:cover;border-radius:6px;background:#eee}
.t1{color:#1a7f37;font-weight:600}.t2{color:#9a6700;font-weight:600}.t3{color:#cf222e;font-weight:600}
.c{display:inline-block;background:#eef;border-radius:10px;padding:1px 8px;margin:1px;font-size:13px}
.g{color:#888}
.bar{position:sticky;top:0;background:#fafafa;padding:8px 0;border-bottom:2px solid #ccc;z-index:1}
button{margin-right:6px;padding:4px 10px;cursor:pointer}button.on{background:#222;color:#fff}
input{padding:4px 8px;width:200px}
</style></head><body>
<div class="bar"><b>species.json</b> · ${species.length}종 · ${today}
 &nbsp;<button data-t="0" class="on">전체 ${species.length}</button><button data-t="1">tier 1 · ${counts[1]}</button><button data-t="2">tier 2 · ${counts[2]}</button><button data-t="3">tier 3 · ${counts[3]}</button>
 <input placeholder="이름·과·서식지 검색"> <span id="n"></span>
 <small class="g">· 편집은 public/data/species.json 직접 수정 후 npm run validate-data</small></div>
<table><thead><tr><th>사진</th><th>종 / 목 · 과</th><th>친숙도 tier</th><th>혼동 상대</th><th>abundance · status · 서식지 · 하루(새벽·한낮·해질녘)</th></tr></thead>
<tbody>${rows}</tbody></table>
<script>
let tier = 0, query = "";
const rowsEl = document.querySelectorAll("tbody tr");
function render() {
  let n = 0;
  for (const tr of rowsEl) {
    const ok = (!tier || tr.dataset.tier == tier) && (!query || tr.textContent.includes(query));
    tr.style.display = ok ? "" : "none";
    if (ok) n++;
  }
  document.getElementById("n").textContent = n + "종 표시";
}
for (const b of document.querySelectorAll("button")) b.onclick = () => {
  tier = Number(b.dataset.t);
  document.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
  render();
};
document.querySelector("input").oninput = (e) => { query = e.target.value.trim(); render(); };
render();
</script></body></html>`;
}

function openInBrowser(file) {
  const cmd =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", file]]
      : process.platform === "darwin"
        ? ["open", [file]]
        : ["xdg-open", [file]];
  execFile(cmd[0], cmd[1], () => {});
}

function main() {
  const species = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, buildHtml(species));
  console.log(`검수 시트 생성: ${OUT_PATH} (${species.length}종)`);
  if (!process.argv.includes("--no-open")) openInBrowser(OUT_PATH);
}

if (require.main === module) main();

module.exports = { buildHtml };
