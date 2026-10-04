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
const { PARTICLES, POS_VI, POS_ROLE, FORM_VI, buildLexicon, tokenize } = require("./segment.js");

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

/* Từ vựng N5 bổ sung: chỉ dùng cho tab Từ vựng, không vào bộ ghép câu.
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

/* ------------------------------ Builder ------------------------------ */

/* Làm giàu một danh sách mảnh đã tách (dùng cho option cố định của builder) */
function enrichParts(rawParts) {
  return rawParts.map((part) => {
    const pp = part.isParticle ? PARTICLE_PRON[part.kana] : null;
    return {
      jp: part.jp,
      kana: part.kana,
      roma: pp ? pp.roma : part.roma !== undefined ? part.roma : K.romanize(part.kana),
      viPron: pp ? pp.viPron : part.viPron !== undefined ? part.viPron : K.viet(part.kana),
      vi: part.vi || "",
      note: part.note || "",
      role: part.role || (part.isParticle ? "particle" : part.unknown ? "unknown" : "expression"),
      isParticle: !!part.isParticle,
      unknown: !!part.unknown,
    };
  });
}

/* Từ/cụm chỉ dùng để tách câu cho mục “Nghe & đáp” và replies — không đụng lexicon
   của builder (nên không đổi cách tách các option đã ổn định). */
const SPOKEN_EXTRA = [
  { pos: "expression", kana: "のみもの", jp: "飲み物", vi: "đồ uống" },
  { pos: "expression", kana: "おしはらい", jp: "お支払い", vi: "thanh toán" },
  { pos: "expression", kana: "ごにゅうよう", jp: "ご入用", vi: "cần dùng" },
  { pos: "expression", kana: "ふくろ", jp: "袋", vi: "túi" },
  { pos: "expression", kana: "さがし", jp: "探し", vi: "tìm" },
  { pos: "expression", kana: "さがして", jp: "探して", vi: "tìm (thể て)" },
  { pos: "expression", kana: "きんえん", jp: "禁煙", vi: "không hút thuốc" },
  { pos: "expression", kana: "きつえん", jp: "喫煙", vi: "hút thuốc" },
  { pos: "expression", kana: "ポイントカード", jp: "ポイントカード", vi: "thẻ tích điểm" },
  { pos: "expression", kana: "おなまえ", jp: "お名前", vi: "tên (lịch sự)" },
  { pos: "expression", kana: "さんがい", jp: "3階", vi: "tầng 3" },
  { pos: "expression", kana: "ごうしつ", jp: "号室", vi: "phòng số" },
  { pos: "expression", kana: "さんまるご", jp: "305", vi: "305" },
  { pos: "expression", kana: "しちじ", jp: "7時", vi: "7 giờ" },
  { pos: "expression", kana: "じゅうじ", jp: "10時", vi: "10 giờ" },
  { pos: "expression", kana: "それとも", jp: "それとも", vi: "hay là" },
  { pos: "expression", kana: "よろしい", jp: "よろしい", vi: "được (lịch sự)" },
  { pos: "expression", kana: "おまたせ", jp: "お待たせ", vi: "để chờ" },
  { pos: "expression", kana: "こちら", jp: "こちら", vi: "phía này" },
  { pos: "expression", kana: "あちら", jp: "あちら", vi: "phía kia" },
  { pos: "expression", kana: "みぎ", jp: "右", vi: "bên phải" },
  { pos: "expression", kana: "にかい", jp: "二階", vi: "tầng hai" },
  { pos: "expression", kana: "あんない", jp: "案内", vi: "hướng dẫn" },
  { pos: "expression", kana: "おもち", jp: "お持ち", vi: "có mang theo (lịch sự)" },
  { pos: "expression", kana: "ごよやく", jp: "ご予約", vi: "đặt trước (lịch sự)" },
  { pos: "expression", kana: "なさいます", jp: "なさいます", vi: "làm (kính ngữ)" },
  { pos: "expression", kana: "ごいっしょ", jp: "ご一緒", vi: "cùng nhau (lịch sự)" },
];

/* Từ/cụm chỉ dùng cho ví dụ ngữ pháp — không đụng lexicon builder hay câu nói */
const GRAMMAR_EXTRA = [
  { pos: "expression", kana: "くれて", jp: "くれて", vi: "đã… cho tôi (thể て của くれる)" },
];

/* Làm giàu một câu nói (replies / nghe–đáp): tách mảnh để đọc đúng は→oa, へ→ê.
   Chỉ ghi đè roma/viPron khi tác giả đã đặt tay. */
function enrichSpoken(line, lex) {
  if (!line.jp || !line.kana || !line.vi) {
    warn(`[câu nói] thiếu jp/kana/vi: ${JSON.stringify(line)}`);
  }
  const out = enrichText({
    jp: line.jp || line.kana,
    kana: line.kana,
    vi: line.vi || "",
    roma: line.roma,
    viPron: line.viPron,
  });
  if (line.roma === undefined || line.viPron === undefined) {
    const t = tokenize(out.kana, lex);
    if (t.parts.length && !t.unknowns.length) {
      const parts = enrichParts(t.parts);
      if (line.roma === undefined) out.roma = parts.map((p) => p.roma).join(" ");
      if (line.viPron === undefined) out.viPron = parts.map((p) => p.viPron).join(" ");
    } else if (t.unknowns.length) {
      debug(`[câu nói] chưa tách được: "${out.jp}" (${t.unknowns.join(", ")})`);
    }
  }
  return out;
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

/* Lượng từ trong cây: option dạng { "counter": "c-hai", "counts": [1, 2, 3] }
   được nở thành option cố định từ data/source/numbers.json — giữ một nguồn dữ liệu
   cho cách đọc (いっぱい, さんばい…) và phiên âm. */
function expandCounterOptions(options, numbers) {
  const counters = new Map((numbers.counters || []).map((c) => [c.id, c]));
  const out = [];
  for (const opt of options) {
    if (!opt.counter) { out.push(opt); continue; }
    if (opt.ref || opt.jp || opt.kana || opt.silent) {
      throw new Error(`Option lượng từ chỉ được có counter/counts/next: ${JSON.stringify(opt)}`);
    }
    const counter = counters.get(opt.counter);
    if (!counter) throw new Error(`Không tìm thấy lượng từ: ${opt.counter}`);
    const counts = opt.counts || counter.combos.map((_, i) => i + 1);
    for (const n of counts) {
      const combo = counter.combos[n - 1];
      if (!combo) throw new Error(`Lượng từ ${opt.counter} không có mục ${n}`);
      out.push({
        jp: combo.jp,
        kana: combo.kana,
        vi: combo.vi,
        roma: combo.roma,
        viPron: combo.viPron,
        next: opt.next || null,
      });
    }
  }
  return out;
}

/* Builder dùng từ biên tập + **chỉ những từ N5 được ref trong intents.json**.
   Nhờ vậy N5 vẫn không ảnh hưởng cách tách câu của nội dung cũ; build audit lại giúp. */
function buildIntents(vocabById, vocabN5, numbers, spokenLex) {
  const n5ById = new Map(vocabN5.map((v) => [v.id, v]));
  const src = read("intents.json");
  const n5Refs = new Set();
  for (const intent of src.intents) {
    for (const step of Object.values(intent.steps)) {
      for (const opt of step.options) {
        if (opt.ref && n5ById.has(opt.ref)) n5Refs.add(opt.ref);
      }
    }
  }
  const allById = { ...vocabById };
  for (const id of n5Refs) allById[id] = n5ById.get(id);
  const lex = buildLexicon(Object.values(vocabById).concat([...n5Refs].map((id) => n5ById.get(id))), numbers);
  auditN5Lexicon(src.intents, vocabById, n5ById, n5Refs, numbers);

  const intents = src.intents.map((intent) => {
    const steps = {};
    for (const [sid, step] of Object.entries(intent.steps)) {
      steps[sid] = {
        ...step,
        options: expandCounterOptions(step.options, numbers).map((opt) => enrichOption(opt, allById, lex)),
      };
    }
    const template = (intent.template || null)?.map(enrichTemplateSeg);
    const replies = (intent.replies || []).map((r) => enrichSpoken(r, spokenLex || lex));
    if (!steps[intent.start]) throw new Error(`Intent ${intent.id}: không thấy bước bắt đầu ${intent.start}`);
    for (const [sid, step] of Object.entries(steps)) {
      for (const opt of step.options) {
        if (opt.next && !steps[opt.next]) throw new Error(`Intent ${intent.id}: bước ${sid} trỏ tới ${opt.next} không tồn tại`);
      }
    }
    return { ...intent, template, steps, replies: replies.length ? replies : undefined };
  });
  return { intents };
}

/* Chỉ mục ngược: từ vựng → các mục ghép câu dùng từ đó (chip ở tab Từ vựng) */
function buildBuilderIndex(intents) {
  const index = {};
  for (const intent of intents) {
    for (const step of Object.values(intent.steps)) {
      for (const opt of step.options) {
        if (!opt.ref) continue;
        if (!index[opt.ref]) index[opt.ref] = [];
        if (!index[opt.ref].includes(intent.id)) index[opt.ref].push(intent.id);
      }
    }
  }
  return index;
}

/* Báo cáo (note) nếu từ N5 thêm vào lexicon làm đổi cách tách câu cố định nào */
function auditN5Lexicon(intents, vocabById, n5ById, n5Refs, numbers) {
  if (!n5Refs.size) return;
  const before = buildLexicon(Object.values(vocabById), numbers);
  const after = buildLexicon(Object.values(vocabById).concat([...n5Refs].map((id) => n5ById.get(id))), numbers);
  const changed = [];
  for (const intent of intents) {
    for (const step of Object.values(intent.steps)) {
      for (const opt of step.options) {
        if (opt.ref || opt.silent || opt.templateOverride || !opt.kana) continue;
        const a = tokenize(opt.kana, before);
        const b = tokenize(opt.kana, after);
        const sa = a.parts.map((p) => p.kana).join("|");
        const sb = b.parts.map((p) => p.kana).join("|");
        if (sa !== sb || a.unknowns.length !== b.unknowns.length) changed.push(opt.jp || opt.kana);
      }
    }
  }
  if (changed.length) {
    note(`N5 refs (${n5Refs.size} từ) đổi cách tách ${changed.length} câu cố định: ${changed.slice(0, 6).join(", ")}${changed.length > 6 ? "…" : ""}`);
  } else {
    note(`N5 refs: ${n5Refs.size} từ N5 được dùng trong builder, không đổi cách tách câu cố định nào`);
  }
}

function enrichOption(opt, vocabById, lex) {
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
    base.role = v.pos === "verb" ? "verb" : POS_ROLE[v.pos] || "expression";
  } else {
    if (!opt.kana) throw new Error(`Option thiếu kana: ${JSON.stringify(opt)}`);
    base.jp = opt.jp !== undefined ? opt.jp : opt.kana;
    base.roma = opt.roma !== undefined ? opt.roma : opt.pron && opt.pron.roma !== undefined ? opt.pron.roma : K.romanize(opt.kana);
    base.viPron = opt.viPron !== undefined ? opt.viPron : opt.pron && opt.pron.vi !== undefined ? opt.pron.vi : K.viet(opt.kana);
    if (base.viLabel === undefined) base.viLabel = base.vi;
    // Tách câu cố định thành các mảnh để bảng cấu trúc chi tiết hơn.
    // Option có templateOverride tự dựng câu từ các mảnh override nên không cần parts.
    if (opt.parts) {
      base.parts = enrichParts(opt.parts);
    } else if (!opt.templateOverride) {
      const t = tokenize(opt.kana, lex);
      if (t.parts.length && !t.unknowns.length) {
        base.parts = enrichParts(t.parts);
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

/* ------------------------------ Nghe & đáp ------------------------------ */

/* Câu nhân viên hay nói trước + gợi ý câu đáp (data/source/exchanges.json). */
function buildExchanges(lex) {
  const src = read("exchanges.json");
  const seen = new Set();
  const scenarios = (src.scenarios || []).map((s) => {
    if (seen.has(s.id)) throw new Error(`Trùng id tình huống: ${s.id}`);
    seen.add(s.id);
    const exchanges = (s.exchanges || []).map((ex, i) => {
      const heard = enrichSpoken(ex.heard || {}, lex);
      const answers = (ex.answers || []).map((a) => enrichSpoken(a, lex));
      if (!answers.length && !ex.note) warn(`[nghe–đáp] ${s.id} #${i}: không có câu đáp lẫn ghi chú`);
      return { note: ex.note || "", heard, answers };
    });
    if (!exchanges.length) warn(`[nghe–đáp] ${s.id}: không có cặp hỏi–đáp nào`);
    return { ...s, exchanges };
  });
  const pairs = scenarios.reduce((n, s) => n + s.exchanges.length, 0);
  note(`Nghe & đáp: ${scenarios.length} tình huống, ${pairs} cặp hỏi–đáp`);
  return { scenarios };
}

/* ------------------------------ Ngữ pháp ------------------------------ */

/* Điểm ngữ pháp tối giản (tab Ngữ pháp). Ví dụ được sinh roma + phiên âm Việt
   bằng lexicon riêng (curated + N5 + cụm nói) nên đọc đúng trợ từ は/へ/を
   mà không đụng cách tách câu của builder. */
function buildGrammar(lex) {
  const src = read("grammar.json");
  const seen = new Set();
  const points = src.points.map((g) => {
    if (!g.id || !g.title || !g.summary || !g.detail) {
      throw new Error(`Điểm ngữ pháp thiếu id/title/summary/detail: ${JSON.stringify(g.id || g)}`);
    }
    if (seen.has(g.id)) throw new Error(`Trùng id ngữ pháp: ${g.id}`);
    seen.add(g.id);
    if (g.level !== "basic" && g.level !== "plus") {
      throw new Error(`Ngữ pháp ${g.id}: level phải là "basic" hoặc "plus"`);
    }
    const examples = (g.examples || []).map((e) => {
      if (!e.jp || !e.kana || !e.vi) throw new Error(`Ngữ pháp ${g.id}: ví dụ thiếu jp/kana/vi`);
      return enrichSpoken(e, lex);
    });
    return { ...g, examples };
  });
  const basic = points.filter((p) => p.level === "basic").length;
  note(`Ngữ pháp: ${points.length} điểm (${basic} cơ bản, ${points.length - basic} nên biết)`);
  return { points };
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
  const numbers = buildNumbers();
  const vocabN5 = buildVocabN5(vocab.items, numbers);
  /* Lexicon riêng cho câu nói (replies + nghe–đáp): curated vocab + cụm bổ sung,
     để phiên âm đúng trợ từ mà không đổi cách tách câu của builder. */
  const spokenLex = buildLexicon(Object.values(vocab.byId).concat(SPOKEN_EXTRA), numbers);
  const built = buildIntents(vocab.byId, vocabN5, numbers, spokenLex);
  const intents = { intents: built.intents };
  const exchanges = buildExchanges(spokenLex);
  /* Lexicon cho ví dụ ngữ pháp: curated + toàn bộ N5 + cụm nói (chỉ để sinh phiên âm). */
  const grammarLex = buildLexicon(
    Object.values(vocab.byId).concat(vocabN5, SPOKEN_EXTRA, GRAMMAR_EXTRA, EXAMPLE_EXTRA_KANA.map((k) => ({ pos: "expression", kana: k, jp: k, vi: "" }))),
    numbers
  );
  const grammar = buildGrammar(grammarLex);

  /* Trọng âm (pitch accent) Kanjium — gắn theo id vào cả từ biên tập lẫn N5 */
  const accentMap = read("accents.json").items;
  const allVocab = vocab.items.concat(vocabN5);
  const vocabIds = new Set(allVocab.map((i) => i.id));
  let accents = 0;
  for (const it of allVocab) {
    if (accentMap[it.id] !== undefined) { it.accent = accentMap[it.id]; accents += 1; }
  }
  for (const id of Object.keys(accentMap)) {
    if (!vocabIds.has(id)) warn(`[trọng âm] id không tồn tại: ${id}`);
  }
  note(`Trọng âm (Kanjium): ${accents}/${Object.keys(accentMap).length} từ được gắn pitch accent`);

  writeData("vocab", vocab.items);
  writeData("vocabN5", vocabN5, "vocab-n5");
  writeData("numbers", numbers);
  writeData("intents", intents);
  writeData("exchanges", exchanges);
  writeData("grammar", grammar);
  const builderIndex = buildBuilderIndex(intents.intents);
  writeData("builderIndex", builderIndex, "builder-index");

  const meta = {
    builtAt: new Date().toISOString(),
    counts: {
      vocab: vocab.items.length,
      vocabN5: vocabN5.length,
      vocabN5Examples: vocabN5.reduce((n, v) => n + (v.examples ? v.examples.length : 0), 0),
      vocabAccents: accents,
      intents: intents.intents.length,
      builderWords: Object.keys(builderIndex).length,
      counters: numbers.counters.length,
      grammar: grammar.points.length,
      scenarios: exchanges.scenarios.length,
      exchanges: exchanges.scenarios.reduce((n, s) => n + s.exchanges.length, 0),
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
