#!/usr/bin/env node
/* ============================================================
   Sinh ảnh minh họa AI cho toàn bộ thẻ (resumable — chạy lại thoải mái)
   - Bước 1: nhờ LLM (MiniMax-M2.7) viết chủ đề ảnh cho từng thẻ → img/prompts.json
   - Bước 2: mmx image generate từng thẻ (bỏ qua thẻ đã có ảnh) → img/<id>_001.jpg
   - Bước 3: ghi img/override.js (window.IMG_OVERRIDE) — app tự dùng
   Dùng: node tools/gen-images.mjs [--limit 30] [--sleep 10] [--cat vanuong]
   Nhịp an toàn: tuần tự + sleep; Ctrl-C bất cứ lúc nào rồi chạy lại tiếp.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMG = path.join(ROOT, "img");
fs.mkdirSync(IMG, { recursive: true });

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const LIMIT = parseInt(opt("limit", "30"), 10);
const SLEEP = parseInt(opt("sleep", "10"), 10) * 1000;
const CAT = opt("cat", null);

/* ---- nạp data.js ---- */
const dataSrc = fs.readFileSync(path.join(ROOT, "data.js"), "utf8")
  .replace(/"use strict";?/, "").replace(/\bconst /g, "var ");
const { PHRASES, WORDS } = new Function(dataSrc + ";return {PHRASES, WORDS};")();
const items = [...PHRASES, ...WORDS].filter((i) => !CAT || i.cat === CAT);
console.log(`[info] ${items.length} thẻ${CAT ? " (chủ đề " + CAT + ")" : ""}, limit ${LIMIT}, sleep ${SLEEP / 1000}s`);

/* ----Style chung ---- */
const STYLE = "kawaii flat vector sticker illustration, thick rounded outlines, soft pastel sakura pink and cream color palette, minimalist japanese stationery style, centered composition, plain cream background, no text, no watermark";
const fileOf = (id) => path.join(IMG, `${id}_001.jpg`);
const has = (id) => fs.existsSync(fileOf(id));

/* ---- Bước 1: prompt map (LLM, cache img/prompts.json) ---- */
const PROMPTS_FILE = path.join(IMG, "prompts.json");
let prompts = {};
if (fs.existsSync(PROMPTS_FILE)) { prompts = JSON.parse(fs.readFileSync(PROMPTS_FILE, "utf8")); console.log(`[info] prompts.json có sẵn: ${Object.keys(prompts).length} mục`); }

async function genPrompts(chunk) {
  const sys = "You write concise English image-subject prompts for cute flashcard illustrations of a Japanese travel phrasebook app. Reply with STRICT JSON only: a single object mapping each given id to an English subject of at most 14 words. For single words: one concrete, culturally Japanese, instantly recognizable visual (e.g. 水 -> 'a clear glass of cold water'). For full sentences: describe ONE tiny scene with a japanese traveler doing the action, no speech bubbles. Never include style words (colors, outlines, background) — style is appended separately. No extra commentary.";
  const usr = "Write image subjects for these cards:\n" + JSON.stringify(chunk.map(({ id, jp, vi, en, kind }) => ({ id, jp, vi, en, kind })));
  const out = execFileSync("mmx", ["text", "chat", "--system", sys, "--message", "user:" + usr,
    "--output", "json", "--quiet", "--non-interactive", "--max-tokens", "8000"], { encoding: "utf8", timeout: 120000 });
  let txt = out;
  try { const j = JSON.parse(out); txt = j.content ?? j.choices?.[0]?.message?.content ?? out; } catch {}
  txt = txt.replace(/```json|```/g, "").trim();
  const start = txt.indexOf("{"), end = txt.lastIndexOf("}");
  const map = JSON.parse(txt.slice(start, end + 1));
  Object.assign(prompts, map);
}

if (LIMIT === 0 || items.some((i) => !prompts[i.id] && !has(i.id))) {
  const need = items.filter((i) => !prompts[i.id]);
  console.log(`[info] sinh chủ đề ảnh cho ${need.length} thẻ (chat LLM, 50 thẻ/lượt)...`);
  for (let i = 0; i < need.length; i += 50) {
    const chunk = need.slice(i, i + 50);
    let ok = false;
    for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
      try { await genPrompts(chunk); ok = true; }
      catch (e) { console.log(`[warn] prompt chunk ${i / 50} lần ${attempt} lỗi: ${e.message.slice(0, 120)}`); await new Promise(r => setTimeout(r, 3000)); }
    }
    if (!ok) chunk.forEach((c) => { if (!prompts[c.id]) prompts[c.id] = c.en || c.vi; }); // dự phòng
    fs.writeFileSync(PROMPTS_FILE, JSON.stringify(prompts, null, 1));
    console.log(`  đã có chủ đề cho ${Math.min(i + 50, need.length)}/${need.length}`);
    await new Promise(r => setTimeout(r, 2000));
  }
}

/* ---- Bước 2: sinh ảnh ---- */
const queue = items.filter((i) => !has(i.id));
console.log(`[info] cần sinh ${Math.min(queue.length, LIMIT)} ảnh (${queue.length} còn thiếu tổng cộng)`);
let made = 0, fail = 0;
for (const it of queue) {
  if (made >= LIMIT) { console.log(`[info] đạt limit ${LIMIT} — chạy lại lệnh này để tiếp tục`); break; }
  const subject = prompts[it.id] || it.en || it.vi;
  const prompt = `${subject}, ${STYLE}`;
  process.stdout.write(`[gen] ${it.id} (${made + 1}/${LIMIT}) ${subject} ... `);
  let ok = false;
  for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
    try {
      execFileSync("mmx", ["image", "generate", "--prompt", prompt, "--aspect-ratio", "1:1",
        "--out-dir", IMG, "--out-prefix", it.id, "--quiet", "--non-interactive"], { encoding: "utf8", timeout: 180000 });
      ok = has(it.id);
    } catch (e) { console.log(`lỗi: ${String(e.message).slice(0, 100)}`); await new Promise(r => setTimeout(r, 5000)); }
  }
  if (ok) { made++; console.log("ok"); }
  else { fail++; console.log("THẤT BẠI (ghi img/failed.log)"); fs.appendFileSync(path.join(IMG, "failed.log"), it.id + "\n"); }
  await new Promise(r => setTimeout(r, SLEEP));
}

/* ---- Bước 3: override.js ---- */
const map = {};
for (const id of items.map((i) => i.id)) if (has(id)) map[id] = `img/${id}_001.jpg`;
fs.writeFileSync(path.join(IMG, "override.js"), "window.IMG_OVERRIDE = " + JSON.stringify(map, null, 1) + ";\n");
console.log(`[done] mới sinh ${made}, thất bại ${fail} · override.js có ${Object.keys(map).length}/${items.length} ảnh · tổng thiếu còn ${queue.length - made}`);
