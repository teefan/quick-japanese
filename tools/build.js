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

const SRC = path.join(__dirname, "..", "data", "source");
const OUT = path.join(__dirname, "..", "data");

const read = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
const has = (f) => fs.existsSync(path.join(SRC, f));

/* ------------------------------ Trợ từ ------------------------------ */

const PARTICLES = {
  "は": { vi: "～ thì / còn ～", grammar: "particle-wa" },
  "が": { vi: "～ (chủ ngữ / thứ được thích, muốn)", grammar: "particle-ga" },
  "を": { vi: "～ (đối tượng của hành động)", grammar: "particle-wo" },
  "に": { vi: "～ (hướng đến / thời điểm)", grammar: "particle-ni" },
  "で": { vi: "～ (nơi xảy ra / phương tiện)", grammar: "particle-de" },
  "へ": { vi: "～ hướng về", grammar: "particle-he" },
  "の": { vi: "～ của", grammar: "particle-no" },
  "も": { vi: "～ cũng", grammar: "particle-mo-to" },
  "と": { vi: "～ và / cùng với", grammar: "particle-mo-to" },
  "まで": { vi: "～ cho đến (điểm đến)", grammar: "particle-ni" },
  "か": { vi: "～? (nghi vấn)", grammar: "question-ka" },
};

function enrichParticle(p) {
  if (!PARTICLES[p]) throw new Error(`Chưa khai báo trợ từ: ${p}`);
  return {
    jp: p,
    kana: p,
    roma: p === "は" ? "wa" : p === "へ" ? "e" : K.romanize(p),
    viPron: p === "は" ? "oa" : p === "へ" ? "ê" : K.viet(p),
    vi: PARTICLES[p].vi,
    grammar: PARTICLES[p].grammar,
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

/* ------------------------------ Từ vựng ------------------------------ */

function buildVocab() {
  const src = read("vocab.json");
  const items = [];
  const seen = new Set();
  for (const it of src.items) {
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
        jp: it.jp,
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
  return { items, byId: Object.fromEntries(items.map((i) => [i.id, i])) };
}

const mapObj = (obj, fn) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

/* ------------------------------ Cụm từ ------------------------------ */

function buildPhrases() {
  const src = read("phrases.json");
  const categories = src.categories.map((cat) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon,
    desc: cat.desc,
    items: cat.items.map((p) => enrichText(p)),
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

function buildIntents(vocabById, grammarIds) {
  const src = read("intents.json");
  const intents = src.intents.map((intent) => {
    const steps = {};
    for (const [sid, step] of Object.entries(intent.steps)) {
      steps[sid] = {
        ...step,
        options: step.options.map((opt) => enrichOption(opt, vocabById)),
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

function enrichOption(opt, vocabById) {
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
    base.roma = opt.pron && opt.pron.roma !== undefined ? opt.pron.roma : K.romanize(src.kana);
    base.viPron = opt.pron && opt.pron.vi !== undefined ? opt.pron.vi : K.viet(src.kana);
    if (base.vi === undefined) base.vi = v.vi;
    if (base.viLabel === undefined) base.viLabel = base.vi;
  } else {
    if (!opt.kana) throw new Error(`Option thiếu kana: ${JSON.stringify(opt)}`);
    base.jp = opt.jp !== undefined ? opt.jp : opt.kana;
    base.roma = opt.pron && opt.pron.roma !== undefined ? opt.pron.roma : K.romanize(opt.kana);
    base.viPron = opt.pron && opt.pron.vi !== undefined ? opt.pron.vi : K.viet(opt.kana);
    if (base.viLabel === undefined) base.viLabel = base.vi;
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
    const e = enrichText({ jp: seg.text, kana: seg.kana, vi: seg.vi || "" });
    return { text: e.jp, kana: e.kana, roma: e.roma, viPron: e.viPron, vi: e.vi };
  }
  throw new Error(`Template segment không hợp lệ: ${JSON.stringify(seg)}`);
}

/* ------------------------------ Xuất file ------------------------------ */

function writeData(name, value) {
  const js = "window.QJ = window.QJ || {};\nwindow.QJ." + name + " = " + JSON.stringify(value, null, 2) + ";\n";
  fs.writeFileSync(path.join(OUT, name + ".js"), js);
  const kb = (Buffer.byteLength(js) / 1024).toFixed(1);
  console.log(`  ✓ data/${name}.js  (${kb} KB)`);
}

function main() {
  console.log("Building quick-japanese data...");
  const vocab = buildVocab();
  const phrases = buildPhrases();
  const grammar = buildGrammar();
  const grammarIds = new Set(grammar.points.map((g) => g.id));
  const numbers = buildNumbers();
  const intents = buildIntents(vocab.byId, grammarIds);

  writeData("vocab", vocab.items);
  writeData("phrases", phrases);
  writeData("grammar", grammar);
  writeData("numbers", numbers);
  writeData("intents", intents);

  const meta = {
    builtAt: new Date().toISOString(),
    counts: {
      vocab: vocab.items.length,
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
  console.log("Done.", meta.counts);
}

main();
