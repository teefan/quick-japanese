"use strict";
/**
 * audit.js — Soát toàn bộ câu có thể ghép từ data/intents.js + tính nhất quán của cây.
 *
 * Chạy tự động sau tools/build.js (`npm run build`) hoặc riêng (`npm run audit`).
 * Dùng đúng logic ráp câu của app qua assets/js/assemble.js. Có lỗi => exit code 1.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { assemble, jpText, lastOverride } = require("../assets/js/assemble.js");

const ROOT = path.join(__dirname, "..");
const SKIP_PUNCT = /[、。！？!?\s〜「」（）()・…]/g;
const END_PUNCT = /[。．.!！?？、…]$/;
const DUP_WORD = /(?<![\p{L}])(\S+)\s+\1(?![\p{L}])/u;

function loadQJ(files) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const f of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), sandbox, { filename: f });
  }
  return sandbox.window.QJ;
}

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const QJ = loadQJ(["data/intents.js", "data/exchanges.js", "data/grammar.js"]);
const intents = QJ.intents.intents;
let paths = 0;
let scenarioPairs = 0;
let replyLines = 0;

for (const intent of intents) {
  const stepSlot = new Map();
  for (const [sid, step] of Object.entries(intent.steps)) {
    if (step.slot) stepSlot.set(sid, step.slot);
    if (step.particle) {
      err(`${intent.id}/${sid}: field "particle" cấp step không còn được engine đọc — xoá hoặc dùng option/template`);
    }

    const labels = step.options.map((o) => o.label || o.viLabel || o.jp);
    const dups = [...new Set(labels.filter((l, i) => labels.indexOf(l) !== i))];
    if (dups.length) err(`${intent.id}/${sid}: nhãn lựa chọn trùng: ${dups.join(", ")}`);

    step.options.forEach((o, i) => {
      const at = `${intent.id}/${sid} opt#${i}`;
      if (!o.silent && !o.ref && !o.jp && !o.kana) err(`${at}: lựa chọn rỗng`);
      if (o.silent && (o.jp || o.kana)) err(`${at}: silent không được có jp/kana`);
      if (o.form && !o.ref) err(`${at}: có form nhưng thiếu ref`);
      if (o.particle && !o.ref) err(`${at}: particle chỉ dùng với option ref`);
      if (o.next && !intent.steps[o.next]) err(`${at}: next "${o.next}" không tồn tại`);
      if (!o.silent && !o.ref && !o.kana) err(`${at}: câu cố định thiếu kana`);

      if (!o.ref && !o.silent && !o.templateOverride && !(Array.isArray(o.parts) && o.parts.length)) {
        warn(`${at}: câu cố định chưa tách được mảnh — bảng cấu trúc sẽ chỉ có 1 dòng`);
      }
      if (Array.isArray(o.parts) && o.parts.length) {
        const want = (o.kana || "").replace(SKIP_PUNCT, "");
        const got = o.parts.map((p) => p.kana).join("").replace(SKIP_PUNCT, "");
        if (want !== got) err(`${at}: mảnh tách không phủ hết kana ("${got}" ≠ "${want}")`);
      }
    });
  }

  if (!intent.steps[intent.start]) {
    err(`${intent.id}: bước bắt đầu "${intent.start}" không tồn tại`);
    continue;
  }

  const slots = new Set(stepSlot.values());
  const checkTpl = (tpl, where) => {
    if (!tpl) return;
    for (const seg of tpl) {
      if (seg.slot !== undefined && !slots.has(seg.slot)) {
        err(`${intent.id} ${where}: slot "${seg.slot}" không có step nào cung cấp`);
      }
    }
  };
  checkTpl(intent.template, "template");
  if (intent.viTemplate) {
    for (const m of intent.viTemplate.matchAll(/\{(\w+)\}/g)) {
      if (!slots.has(m[1])) err(`${intent.id} viTemplate: slot "${m[1]}" không tồn tại`);
    }
  } else if (intent.template) {
    warn(`${intent.id}: có template nhưng thiếu viTemplate`);
  }

  const reach = new Set([intent.start]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const sid of [...reach]) {
      for (const o of intent.steps[sid].options) {
        if (o.next && !reach.has(o.next)) { reach.add(o.next); changed = true; }
      }
    }
  }
  for (const sid of Object.keys(intent.steps)) {
    if (!reach.has(sid)) err(`${intent.id}: bước không tới được: ${sid}`);
  }

  const walk = (sid, picks, depth) => {
    for (const o of intent.steps[sid].options) {
      const np = picks.concat([{ stepId: sid, option: o }]);
      if (o.templateOverride) checkTpl(o.templateOverride, `${sid} templateOverride`);
      if (o.viTemplateOverride) {
        for (const m of o.viTemplateOverride.matchAll(/\{(\w+)\}/g)) {
          if (!slots.has(m[1])) err(`${intent.id} ${sid} viTemplateOverride: slot "${m[1]}" không tồn tại`);
        }
      }
      if (o.next) {
        walk(o.next, np, depth + 1);
        continue;
      }

      // Đường hoàn chỉnh: kiểm tra câu cuối
      paths += 1;
      const where = `${intent.id} [${np.map((p) => p.option.label || p.option.viLabel || p.option.jp || "?").join(" → ")}]`;
      if (depth > 10) err(`${where}: đường quá sâu (${depth})`);
      const { parts, vi } = assemble(intent, np);
      const jp = jpText(parts);
      if (parts.some((p) => p.kind === "blank")) err(`${where}: còn slot chưa chọn khi đã xong: ${jp}`);
      if (!jp) err(`${where}: câu tiếng Nhật rỗng`);
      if (vi.includes("{")) err(`${where}: vi còn placeholder: ${vi}`);

      const vt = lastOverride(np, "viTemplateOverride") || intent.viTemplate;
      if (vt) {
        for (const m of vt.matchAll(/\{(\w+)\}/g)) {
          if (!np.some((p) => intent.steps[p.stepId].slot === m[1])) {
            err(`${where}: viTemplate thiếu slot "${m[1]}" (nối câu sẽ hiện "…")`);
          }
        }
      }

      const dup = vi.match(DUP_WORD);
      if (dup) err(`${where}: vi lặp từ "${dup[1]}": ${vi}`);

      // Nhiều mảnh cố định nối tiếp: phải có dấu ngăn giữa hai mảnh
      const nonSilent = np.filter((p) => !p.option.silent && p.option.jp);
      if (!intent.template && !np.some((p) => p.option.templateOverride) && nonSilent.length > 1) {
        const first = nonSilent[0].option.jp;
        const second = nonSilent[1].option.jp;
        const expected = END_PUNCT.test(first) ? first + second : first + "。" + second;
        if (!jp.includes(expected)) {
          err(`${where}: thiếu dấu ngăn giữa hai mảnh: ${jp}`);
        }
      }
    }
  };
  walk(intent.start, [], 0);

  // Gợi ý câu người Nhật có thể đáp (replies)
  for (const [i, r] of (intent.replies || []).entries()) {
    const at = `${intent.id} reply#${i}`;
    if (!r.jp || !r.kana || !r.vi) err(`${at}: thiếu jp/kana/vi`);
    if (!r.roma || !r.viPron) err(`${at}: thiếu roma/viPron (enrich lỗi)`);
    replyLines += 1;
  }
}

/* Tình huống “nghe & đáp”: nhân viên nói trước + câu đáp */
const scenarios = (QJ.exchanges && QJ.exchanges.scenarios) || [];
if (!scenarios.length) err("data/exchanges.js: chưa có tình huống nào");
const scenarioIds = new Set();
for (const s of scenarios) {
  const at = s.id || "(thiếu id)";
  if (!s.id || !s.label) err(`[nghe–đáp] ${at}: thiếu id/label`);
  if (scenarioIds.has(s.id)) err(`[nghe–đáp] ${at}: trùng id tình huống`);
  scenarioIds.add(s.id);
  if (!(s.exchanges || []).length) err(`[nghe–đáp] ${at}: không có cặp hỏi–đáp`);
  for (const [i, ex] of (s.exchanges || []).entries()) {
    const where = `${at} #${i}`;
    const lines = [["heard", ex.heard], ...(ex.answers || []).map((a, j) => [`answer#${j}`, a])];
    for (const [role, line] of lines) {
      if (!line.jp || !line.kana || !line.vi) err(`[nghe–đáp] ${where} ${role}: thiếu jp/kana/vi`);
      if (!line.roma || !line.viPron) err(`[nghe–đáp] ${where} ${role}: thiếu roma/viPron`);
    }
    if (!(ex.answers || []).length && !ex.note) warn(`[nghe–đáp] ${where}: không có câu đáp lẫn ghi chú`);
    scenarioPairs += 1;
  }
}

/* Ngữ pháp tối giản: đủ dữ liệu + đã enrich phiên âm cho từng ví dụ */
const grammarPoints = (QJ.grammar && QJ.grammar.points) || [];
if (!grammarPoints.length) err("data/grammar.js: chưa có điểm ngữ pháp nào");
const grammarIds = new Set();
for (const g of grammarPoints) {
  const at = g.id || "(thiếu id)";
  if (!g.id || !g.title || !g.summary || !g.detail) err(`[ngữ pháp] ${at}: thiếu id/title/summary/detail`);
  if (grammarIds.has(g.id)) err(`[ngữ pháp] ${at}: trùng id điểm ngữ pháp`);
  grammarIds.add(g.id);
  if (g.level !== "basic" && g.level !== "plus") err(`[ngữ pháp] ${at}: level "${g.level}" không hợp lệ`);
  if (!(g.examples || []).length) warn(`[ngữ pháp] ${at}: không có ví dụ`);
  for (const [i, e] of (g.examples || []).entries()) {
    if (!e.jp || !e.kana || !e.vi) err(`[ngữ pháp] ${at} ex#${i}: thiếu jp/kana/vi`);
    if (!e.roma || !e.viPron) err(`[ngữ pháp] ${at} ex#${i}: thiếu roma/viPron (enrich lỗi)`);
  }
}

console.log(`Audit builder: ${intents.length} cây, ${paths} đường câu, ${replyLines} gợi ý đáp, ${scenarioPairs} cặp nghe–đáp, ${grammarPoints.length} điểm ngữ pháp — ${errors.length} lỗi, ${warnings.length} cảnh báo`);
for (const w of warnings) console.log("  ! " + w);
for (const e of errors) console.log("  ✗ " + e);
if (errors.length) {
  process.exitCode = 1;
} else {
  console.log("  ✓ không slot trống, không lặp từ, slot/template nhất quán, câu nghe–đáp đủ dữ liệu");
}
