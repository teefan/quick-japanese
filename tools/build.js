"use strict";
/**
 * build.js — Đọc data/source/*.json, làm giàu (romaji, phiên âm Việt, chia động từ,
 * mở rộng cây ghép câu) và xuất ra data/*.js dưới dạng biến toàn cục window.QJ.
 *
 * Chạy:  node tools/build.js
 */

const fs = require("fs");
const path = require("path");
const K = require("./kana.js");
const { PARTICLES, POS_VI, POS_ROLE, POS_GRAMMAR, FORM_VI, FORM_GRAMMAR, buildLexicon, tokenize } = require("./segment.js");

const SRC = path.join(__dirname, "..", "data", "source");
const OUT = path.join(__dirname, "..", "data");

const read = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));

/* ------------------------------ Trợ từ ------------------------------ */

function enrichParticle(p) {
  if (!PARTICLES[p]) throw new Error(`Chưa khai báo trợ từ: ${p}`);
  return {
    jp: p,
    kana: p,
    roma: p === "は" ? "wa" : p === "へ" ? "e" : K.romanize(p),
    viPron: p === "は" ? "oa" : p === "へ" ? "ê" : K.viet(p),
    vi: PARTICLES[p].vi,
    note: PARTICLES[p].note,
    grammar: PARTICLES[p].grammar,
    role: "particle",
    isParticle: true,
  };
}

/* ------------------------------ Tiện ích ------------------------------ */

function enrichText(item) {
  // item: {jp, kana, vi, viPron?, roma?, note?, tags?...}
  const out = { ...item };
  if (item.kana) {
    out.roma = item.roma !== undefined ? item.roma : K.romanize(item.kana);
    out.viPron = item.viPron !== undefined ? item.viPron : K.viet(item.kana);
  }
  return out;
}

const warnings = [];
const warn = (msg) => warnings.push(msg);
const debugs = [];
const debug = (msg) => debugs.push(msg);
const notes = [];
const note = (msg) => notes.push(msg);

/* ------------------------------ Từ vựng ------------------------------ */

function buildVocabItems(srcItems) {
  const items = [];
  const seen = new Set();
  for (const it of srcItems) {
    if (seen.has(it.id)) throw new Error(`Trùng id từ vựng: ${it.id}`);
    seen.add(it.id);
    let out;
    if (it.pos === "verb") {
      if (!it.dict || !it.kana || !it.group) throw new Error(`Động từ thiếu dữ liệu: ${it.id}`);
      const forms = K.conjugate(it.dict, it.kana, it.group);
      out = {
        id: it.id,
        pos: "verb",
        jp: it.dict,
        kana: it.kana,
        vi: it.vi,
        group: it.group,
        tags: it.tags || [],
        note: it.note,
        forms: mapObj(forms, (f) => ({
          jp: f.jp,
          kana: f.kana,
          roma: K.romanize(f.kana),
          viPron: K.viet(f.kana),
        })),
      };
      out.roma = out.forms.dict.roma;
      out.viPron = out.forms.dict.viPron;
    } else {
      out = enrichText({
        id: it.id,
        pos: it.pos || "noun",
        jp: it.jp || it.kana,
        kana: it.kana,
        vi: it.vi,
        tags: it.tags || [],
        note: it.note,
        viPron: it.viPron,
        roma: it.roma,
      });
    }
    items.push(out);
  }
  return items;
}

function buildVocab() {
  const src = read("vocab.json");
  const items = buildVocabItems(src.items);
  return { items, byId: Object.fromEntries(items.map((i) => [i.id, i])) };
}

/* Trợ từ đọc đặc biệt — dùng chung cho cụm từ (enrichParts) và câu ví dụ (examplePron) */
const PARTICLE_PRON = { "は": { roma: "wa", viPron: "oa" }, "へ": { roma: "e", viPron: "ê" }, "を": { roma: "o", viPron: "ô" } };

/* Từ vựng N5 bổ sung: chỉ dùng cho tab Từ vựng / tìm kiếm / quiz, không vào bộ ghép câu.
   Kèm câu ví dụ (data/source/vocab-n5-examples.json) — không đưa N5 vào lexicon chung,
   chỉ mở rộng lexicon cục bộ để đọc đúng trợ từ は/へ trong câu ví dụ. */
const EXAMPLE_EXTRA_KANA = ["はっきり", "はかり"]; // từ kana dễ bị tách nhầm thành trợ từ は
function buildVocabN5(vocabItems, numbers) {
  const items = buildVocabItems(read("vocab-n5.json").items);
  const src = read("vocab-n5-examples.json");
  const extra = EXAMPLE_EXTRA_KANA.map((k) => ({ pos: "expression", kana: k, jp: k, vi: "" }));
  const lex = buildLexicon(vocabItems.concat(items).concat(extra), numbers);
  const byId = new Map(items.map((i) => [i.id, i]));
  let count = 0;
  for (const [id, ex] of Object.entries(src.items)) {
    const item = byId.get(id);
    if (!item) { warn(`[ví dụ] id không tồn tại trong vocab-n5: ${id}`); continue; }
    if (!ex.jp || !ex.kana || !ex.vi || !ex.furi) { warn(`[ví dụ] thiếu jp/furi/kana/vi: ${id}`); continue; }
    const furi = parseFuri(ex.furi);
    if (furi.kana !== ex.kana) { warn(`[ví dụ] furi không khớp kana: ${id} "${furi.kana}" ≠ "${ex.kana}"`); continue; }
    const pron = examplePron(furi.kana, furi.literalPos, lex);
    item.examples = [{ jp: ex.jp, kana: ex.kana, roma: pron.roma, viPron: pron.viPron, vi: ex.vi }];
    count += 1;
  }
  note(`Ví dụ N5: ${count}/${items.length} từ có câu ví dụ (Tatoeba, nghĩa Việt biên tập)`);
  return items;
}

/* Đọc furigana Tatoeba: {漢|かん} → cách đọc kanji; ký tự ngoài {} là kana viết thẳng.
   Trả về chuỗi kana và tập vị trí ký tự viết thẳng (chỉ chỗ đó mới có thể là trợ từ). */
function parseFuri(furi) {
  const literalPos = new Set();
  let kana = "";
  let i = 0;
  while (i < furi.length) {
    if (furi[i] === "{") {
      const j = furi.indexOf("}", i);
      if (j < 0) return { kana, literalPos }; // furi hỏng — bước kiểm tra kana bên dưới sẽ báo lệch
      kana += furi.slice(i + 1, j).split("|").slice(1).join("");
      i = j + 1;
    } else {
      literalPos.add(kana.length);
      kana += furi[i];
      i += 1;
    }
  }
  return { kana, literalPos };
}

/* Phiên âm câu ví dụ: chỉ đọc は→oa / へ→ê khi đó là kana viết thẳng (không phải cách đọc
   kanji) và token đúng là trợ từ, có mảnh phía trước (tránh はるばる, はじめまして…). */
function examplePron(kana, literalPos, lex) {
  const t = tokenize(kana, lex);
  const posOverride = {};
  t.parts.forEach((p, i) => {
    const over = p.isParticle ? PARTICLE_PRON[p.kana] : null;
    if (over && i > 0 && literalPos.has(p.start)) {
      posOverride[p.start] = { roma: over.roma, vi: over.viPron };
    }
  });
  const { roma, vi } = K.translit(kana, undefined, posOverride);
  return { roma, viPron: vi };
}

const mapObj = (obj, fn) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

/* ------------------------------ Cụm từ ------------------------------ */

/* Làm giàu một danh sách mảnh đã tách (dùng chung cho cụm từ và option builder) */
function enrichParts(rawParts, grammarIds, tag) {
  return rawParts.map((part) => {
    const pp = part.isParticle ? PARTICLE_PRON[part.kana] : null;
    const e = {
      jp: part.jp,
      kana: part.kana,
      roma: pp ? pp.roma : part.roma !== undefined ? part.roma : K.romanize(part.kana),
      viPron: pp ? pp.viPron : part.viPron !== undefined ? part.viPron : K.viet(part.kana),
      vi: part.vi || "",
      note: part.note || "",
      grammar: part.grammar || null,
      role: part.role || (part.isParticle ? "particle" : part.unknown ? "unknown" : "expression"),
      isParticle: !!part.isParticle,
      unknown: !!part.unknown,
    };
    if (e.grammar && !grammarIds.has(e.grammar)) {
      warn(`[${tag}] "${e.jp}": grammar "${e.grammar}" không tồn tại`);
      e.grammar = null;
    }
    return e;
  });
}

function buildPhrases(vocab, numbers, grammarIds) {
  const lex = buildLexicon(vocab, numbers);
  const src = read("phrases.json");
  const categories = src.categories.map((cat) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon,
    desc: cat.desc,
    items: cat.items.map((p) => {
      const out = enrichText(p);
      let rawParts;
      let unknowns = [];
      if (p.parts) {
        rawParts = p.parts; // viết tay trong source khi tách tự động chưa đạt
      } else {
        const t = tokenize(p.kana, lex);
        rawParts = t.parts;
        unknowns = t.unknowns;
      }
      for (const u of unknowns) warn(`Chưa tách được [${p.id}]: "${u}"`);
      out.parts = enrichParts(rawParts, grammarIds, p.id);
      // Câu chỉ có một mảnh (vd: こんにちは): dùng phiên âm ghi đè của cả câu
      if (out.parts.length === 1 && p.viPron) {
        out.parts[0].viPron = p.viPron;
        if (p.roma) out.parts[0].roma = p.roma;
      }
      // Romaji "chính thức" (Hepburn) ghép theo từng mảnh, có khoảng cách cho dễ đọc
      if (out.parts.length && p.roma === undefined) {
        out.roma = out.parts.map((x) => x.roma).join(" ");
      }
      if (out.parts.length && p.viPron === undefined) {
        out.viPron = out.parts.map((x) => x.viPron).join(" ");
      }
      // Audit: các mảnh phải ghép lại đúng bằng câu gốc (bỏ dấu câu)
      const joinParts = out.parts.map((x) => x.kana).join("");
      const clean = (s) => (s || "").replace(/[、。！？!?\s〜「」（）()・…]/g, "");
      if (clean(joinParts) !== clean(p.kana)) {
        warn(`[${p.id}] mảnh ghép không khớp câu gốc: "${joinParts}" ≠ "${p.kana}"`);
      }
      return out;
    }),
  }));
  return { categories };
}

/* ------------------------------ Ngữ pháp ------------------------------ */

function buildGrammar() {
  const src = read("grammar.json");
  return {
    points: src.points.map((g) => ({
      ...g,
      examples: (g.examples || []).map((e) => enrichText(e)),
    })),
  };
}

/* ------------------------------ Số đếm ------------------------------ */

function buildNumbers() {
  const src = read("numbers.json");
  return {
    numbers: src.numbers.map((n) => enrichText(n)),
    counters: src.counters.map((c) => ({
      ...c,
      combos: c.combos.map((x) => enrichText(x)),
    })),
    money: (src.money || []).map((m) => enrichText(m)),
  };
}

/* ------------------------------ Cây ghép câu ------------------------------ */

function buildIntents(vocabById, numbers, grammarIds) {
  const lex = buildLexicon(Object.values(vocabById), numbers);
  const src = read("intents.json");
  const intents = src.intents.map((intent) => {
    const steps = {};
    for (const [sid, step] of Object.entries(intent.steps)) {
      steps[sid] = {
        ...step,
        options: step.options.map((opt) => enrichOption(opt, vocabById, lex, grammarIds)),
      };
    }
    const template = (intent.template || null)?.map(enrichTemplateSeg);
    if (!steps[intent.start]) throw new Error(`Intent ${intent.id}: không thấy bước bắt đầu ${intent.start}`);
    for (const [sid, step] of Object.entries(steps)) {
      for (const opt of step.options) {
        if (opt.next && !steps[opt.next]) throw new Error(`Intent ${intent.id}: bước ${sid} trỏ tới ${opt.next} không tồn tại`);
      }
    }
    for (const g of intent.grammar || []) {
      if (!grammarIds.has(g)) warn(`Intent ${intent.id}: ngữ pháp "${g}" không tồn tại`);
    }
    return { ...intent, template, steps };
  });
  return { intents };
}

function enrichOption(opt, vocabById, lex, grammarIds) {
  const base = { ...opt };
  if (opt.silent) {
    // Lựa chọn không tạo ra chữ nào trong câu (chỉ chọn nhánh/định dạng câu)
    base.jp = opt.jp || "";
    base.kana = opt.kana || "";
    base.roma = "";
    base.viPron = "";
    if (base.viLabel === undefined) base.viLabel = base.label || base.vi || "";
  } else if (opt.ref) {
    const v = vocabById[opt.ref];
    if (!v) throw new Error(`Không tìm thấy từ vựng: ${opt.ref}`);
    const form = opt.form ? v.forms && v.forms[opt.form] : null;
    if (opt.form && !form) throw new Error(`Từ ${opt.ref} không có thể ${opt.form}`);
    const src = form || { jp: v.jp, kana: v.kana };
    base.jp = src.jp;
    base.kana = src.kana;
    base.roma = opt.roma !== undefined ? opt.roma : opt.pron && opt.pron.roma !== undefined ? opt.pron.roma : K.romanize(src.kana);
    base.viPron = opt.viPron !== undefined ? opt.viPron : opt.pron && opt.pron.vi !== undefined ? opt.pron.vi : K.viet(src.kana);
    if (base.vi === undefined) base.vi = v.vi;
    if (base.viLabel === undefined) base.viLabel = base.vi;
    base.posVi = POS_VI[v.pos] || "";
    if (opt.form) base.formNote = FORM_VI[opt.form] || "";
    base.grammarHint = (opt.form && FORM_GRAMMAR[opt.form]) || POS_GRAMMAR[v.pos] || null;
    base.role = v.pos === "verb" ? "verb" : POS_ROLE[v.pos] || "expression";
  } else {
    if (!opt.kana) throw new Error(`Option thiếu kana: ${JSON.stringify(opt)}`);
    base.jp = opt.jp !== undefined ? opt.jp : opt.kana;
    base.roma = opt.roma !== undefined ? opt.roma : opt.pron && opt.pron.roma !== undefined ? opt.pron.roma : K.romanize(opt.kana);
    base.viPron = opt.viPron !== undefined ? opt.viPron : opt.pron && opt.pron.vi !== undefined ? opt.pron.vi : K.viet(opt.kana);
    if (base.viLabel === undefined) base.viLabel = base.vi;
    // Tách câu cố định thành các mảnh (như thẻ cụm từ) để bảng cấu trúc chi tiết hơn
    if (opt.parts) {
      base.parts = enrichParts(opt.parts, grammarIds, "option");
    } else {
      const t = tokenize(opt.kana, lex);
      if (t.parts.length && !t.unknowns.length) {
        base.parts = enrichParts(t.parts, grammarIds, "option");
        if (opt.roma === undefined) base.roma = base.parts.map((p) => p.roma).join(" ");
        if (opt.viPron === undefined) base.viPron = base.parts.map((p) => p.viPron).join(" ");
      } else if (t.unknowns.length) {
        debug(`Option chưa tách được: "${opt.jp}" (${t.unknowns.join(", ")})`);
      }
    }
    // Câu một mảnh có override phiên âm (vd: こんにちは): đồng bộ mảnh với override
    if (base.parts && base.parts.length === 1) {
      if (opt.viPron !== undefined) base.parts[0].viPron = opt.viPron;
      if (opt.roma !== undefined) base.parts[0].roma = opt.roma;
    }
  }
  if (opt.particle) base.particleObj = enrichParticle(opt.particle);
  if (opt.templateOverride) base.templateOverride = opt.templateOverride.map(enrichTemplateSeg);
  return base;
}

function enrichTemplateSeg(seg) {
  if (seg.slot) {
    return {
      slot: seg.slot,
      particle: seg.particle ? enrichParticle(seg.particle) : null,
    };
  }
  if (seg.text !== undefined) {
    if (!seg.kana) throw new Error(`Template text thiếu kana: ${JSON.stringify(seg)}`);
    const e = enrichText({ jp: seg.text, kana: seg.kana, vi: seg.vi || "", roma: seg.roma, viPron: seg.viPron });
    const isCopula = seg.text === "です" || seg.text === "でした";
    return { text: e.jp, kana: e.kana, roma: e.roma, viPron: e.viPron, vi: e.vi, role: isCopula ? "copula" : "expression" };
  }
  throw new Error(`Template segment không hợp lệ: ${JSON.stringify(seg)}`);
}

/* ------------------------------ Xuất file ------------------------------ */

/* Bỏ field rỗng (app dùng kiểm tra truthy) để giảm dung lượng */
function prune(v) {
  if (Array.isArray(v)) return v.map(prune);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (val === null || val === undefined || val === "") continue;
      out[k] = prune(val);
    }
    return out;
  }
  return v;
}

function writeData(name, value, fileBase = name) {
  const js = "window.QJ = window.QJ || {};\nwindow.QJ." + name + " = " + JSON.stringify(prune(value)) + ";\n";
  fs.writeFileSync(path.join(OUT, fileBase + ".js"), js);
  const kb = (Buffer.byteLength(js) / 1024).toFixed(1);
  console.log(`  ✓ data/${fileBase}.js  (${kb} KB)`);
}

function main() {
  console.log("Building quick-japanese data...");
  const vocab = buildVocab();
  const grammar = buildGrammar();
  const grammarIds = new Set(grammar.points.map((g) => g.id));
  const numbers = buildNumbers();
  const vocabN5 = buildVocabN5(vocab.items, numbers);
  const phrases = buildPhrases(vocab.items, numbers, grammarIds);
  const intents = buildIntents(vocab.byId, numbers, grammarIds);

  writeData("vocab", vocab.items);
  writeData("vocabN5", vocabN5, "vocab-n5");
  writeData("phrases", phrases);
  writeData("grammar", grammar);
  writeData("numbers", numbers);
  writeData("intents", intents);

  const meta = {
    builtAt: new Date().toISOString(),
    counts: {
      vocab: vocab.items.length,
      vocabN5: vocabN5.length,
      vocabN5Examples: vocabN5.reduce((n, v) => n + (v.examples ? v.examples.length : 0), 0),
      phrases: phrases.categories.reduce((n, c) => n + c.items.length, 0),
      phraseCategories: phrases.categories.length,
      grammar: grammar.points.length,
      intents: intents.intents.length,
      counters: numbers.counters.length,
    },
    generator: "tools/build.js",
  };
  writeData("meta", meta);

  if (warnings.length) {
    console.log("\nCảnh báo:");
    for (const w of warnings) console.log("  ! " + w);
  }
  if (debugs.length) {
    console.log(`\nOption cố định chưa tách được thành mảnh (giữ nguyên 1 dòng): ${debugs.length}`);
    for (const d of debugs.slice(0, 12)) console.log("  · " + d);
    if (debugs.length > 12) console.log(`  … và ${debugs.length - 12} mục khác`);
  }
  if (notes.length) {
    console.log("\nGhi chú:");
    for (const n of notes) console.log("  · " + n);
  }
  console.log("Done.", meta.counts);
}

main();
