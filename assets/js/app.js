"use strict";
/* app.js — khung ứng dụng: 5 tab, sổ tay yêu thích, tìm kiếm toàn cục,
   sổ tay cụm từ, từ vựng, ngữ pháp, TTS, chế độ đưa máy, PWA. */

const QJ = window.QJ || {};
const view = document.getElementById("view");

const PHRASE_ALL = QJ.phrases.categories.flatMap(c => c.items);
const PHRASE_MAP = new Map(PHRASE_ALL.map(p => [p.id, p]));

/* ------------------------------ Tiện ích chung (U) ------------------------------ */

const U = {
  esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  capitalize(s) {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  },

  toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(U._toastTimer);
    U._toastTimer = setTimeout(() => t.classList.remove("on"), 1600);
  },

  /* Đăng ký nội dung để nút hành động truy xuất qua data-key */
  _reg: new Map(),
  resetReg() { U._reg.clear(); U._regId = 0; },
  register(payload) {
    const key = "d" + (U._regId = (U._regId || 0) + 1);
    U._reg.set(key, payload);
    return key;
  },
  get(key) { return U._reg.get(key); },

  /* ----- Text to speech (Web Speech API, giọng ja-JP) ----- */
  _voice: null,
  pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    const voices = speechSynthesis.getVoices();
    U._voice = voices.find(v => /^ja(-|_)?/i.test(v.lang)) || voices.find(v => /japan/i.test(v.name)) || null;
    return U._voice;
  },
  speak(text) {
    if (!("speechSynthesis" in window)) { U.toast("Thiết bị không hỗ trợ đọc tiếng Nhật"); return; }
    if (!U._voice) U.pickVoice();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    if (U._voice) u.voice = U._voice;
    u.rate = 0.92;
    speechSynthesis.speak(u);
  },
  stopSpeak() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  },

  async copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      U.toast("Đã copy: " + (label || ""));
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      U.toast("Đã copy");
    }
  },

  /* ----- Modal / chế độ đưa máy ----- */
  openModal(html, opts = {}) {
    const modal = document.getElementById("modal");
    const card = document.getElementById("modal-card");
    modal.classList.toggle("showmode", !!opts.showmode);
    card.innerHTML = html;
    modal.classList.remove("hidden");
  },
  closeModal() {
    document.getElementById("modal").classList.add("hidden");
    document.getElementById("modal-card").innerHTML = "";
  },

  /* Đưa máy cho người Nhật xem: chữ Nhật to, thông tin phụ nhỏ */
  showToLocal(p, title) {
    U.openModal(`
      ${title ? `<p style="margin:0 0 6px;color:var(--muted);font-size:13px">${U.esc(title)}</p>` : ""}
      <div class="sm-jp">${U.esc(p.jp)}</div>
      ${p.kana && p.kana !== p.jp ? `<div class="sm-kana">${U.esc(p.kana)}</div>` : ""}
      ${p.viPron ? `<div class="sm-pron">${U.esc(p.viPron)}</div>` : ""}
      ${p.vi ? `<div class="sm-vi">${U.esc(p.vi)}</div>` : ""}
      <button class="modal-close" data-close-modal>Đóng</button>
    `, { showmode: true });
  },

  openGrammar(id) {
    const g = (QJ.grammar?.points || []).find(x => x.id === id);
    if (!g) return;
    U.openModal(`
      <h3>${U.esc(g.title)}</h3>
      <p>${U.esc(g.summary)}</p>
      <p style="color:var(--muted)">${U.esc(g.detail)}</p>
      ${(g.examples || []).map(e => `
        <div class="ex">
          <div class="ex-jp">${U.esc(e.jp)}</div>
          ${e.viPron ? `<div class="ex-pron">${U.esc(e.viPron)}</div>` : ""}
          <div class="ex-vi">${U.esc(e.vi)}</div>
        </div>`).join("")}
      <button class="modal-close" data-close-modal>Đóng</button>
    `);
  },
};
window.U = U;

/* Ô tìm kiếm "gõ tới đâu vẽ tới đó": gọi apply(value) rồi giữ nguyên vị trí con trỏ */
function bindLiveSearch(inputId, apply) {
  const input = document.getElementById(inputId);
  input.addEventListener("input", (e) => {
    const pos = e.target.selectionStart;
    apply(e.target.value);
    const el = document.getElementById(inputId);
    if (el) { el.focus(); el.setSelectionRange(pos, pos); }
  });
}

/* ------------------------------ Sổ tay (localStorage) ------------------------------ */

const Fav = {
  KEY: "qj.favs.v1",
  list() {
    try { return JSON.parse(localStorage.getItem(Fav.KEY)) || []; } catch { return []; }
  },
  save(list) {
    try { localStorage.setItem(Fav.KEY, JSON.stringify(list)); return true; } catch { return false; /* riêng tư / hết chỗ */ }
  },
  has(type, id) {
    return Fav.list().some(f => f.type === type && f.id === id);
  },
  toggle(entry) {
    const list = Fav.list();
    const i = list.findIndex(f => f.type === entry.type && f.id === entry.id);
    if (i >= 0) { list.splice(i, 1); Fav.save(list); return false; }
    list.unshift(entry);
    Fav.save(list);
    return true;
  },
  remove(type, id) {
    Fav.save(Fav.list().filter(f => !(f.type === type && f.id === id)));
  },
  clear() { Fav.save([]); },
};
window.Fav = Fav;

function paintFav(btn, on) {
  btn.textContent = on ? "★" : "☆";
  btn.classList.toggle("fav-on", on);
  btn.title = on ? "Đã lưu trong sổ tay" : "Lưu vào sổ tay";
}

/* ------------------------------ Sổ tay cụm từ ------------------------------ */

const phraseState = { cat: "all", q: "" };

function phraseMatches(p, q) {
  if (!q) return true;
  const hay = [p.jp, p.kana, p.roma, p.vi, p.viPron, p.note].join(" ").toLowerCase();
  return hay.includes(q.toLowerCase());
}

function compositionHtml(p) {
  const chips = p.parts.map((part, i) => `
    <span class="c role-${U.esc(part.role || "expression")} ${part.unknown ? "u" : ""}"
      data-chip="${i}" data-for="${U.esc(p.id)}"
      title="${U.esc(part.vi || part.note || "Xem giải thích")}">
      ${U.esc(part.jp)}</span>`).join('<i class="sep">·</i>');
  const rows = structureRowsHtml(p.parts, p.id);
  return `
    <div class="compose">${chips}</div>
    <button class="brk-toggle" data-brk="${U.esc(p.id)}">🧩 Giải thích ngữ pháp</button>
    <div class="brk" id="brk-${U.esc(p.id)}" hidden>${rows}</div>`;
}

function structureRowsHtml(parts, pid) {
  return parts.map((part, i) => `
    <div class="brk-row role-${U.esc(part.role || "expression")}${part.isParticle ? " particle-row" : ""}" data-row="${i}">
      <div class="brk-jp">${U.esc(part.jp)}${part.kana && part.kana !== part.jp ? `<small>${U.esc(part.kana)}</small>` : ""}</div>
      <div class="brk-body">
        <span class="brk-pron">${U.esc(part.viPron)}</span>
        <span class="brk-roma">${U.esc(part.roma || "")}</span>
        <span class="brk-vi">${U.esc(part.vi || "—")}${part.note ? ` · <em>${U.esc(part.note)}</em>` : ""}</span>
      </div>
      ${part.grammar ? `<button class="brk-g" data-grammar="${part.grammar}" title="Mở giải thích ngữ pháp">📝</button>` : ""}
    </div>`).join("");
}

function phraseCard(p) {
  const key = U.register(p);
  const on = Fav.has("phrase", p.id);
  return `
    <div class="card">
      <div class="phrase-head">
        <div class="phrase-jp">${U.esc(p.jp)}</div>
        <button class="icon-btn ${on ? "fav-on" : ""}" title="${on ? "Đã lưu trong sổ tay" : "Lưu vào sổ tay"}" data-act="fav" data-kind="phrase" data-id="${U.esc(p.id)}">${on ? "★" : "☆"}</button>
        <button class="icon-btn" title="Nghe" data-act="speak" data-key="${key}">🔊</button>
        <button class="icon-btn" title="Đưa máy" data-act="show" data-key="${key}">📺</button>
        <button class="icon-btn" title="Copy" data-act="copy" data-key="${key}">📋</button>
      </div>
      ${p.kana && p.kana !== p.jp ? `<div class="kana-line">${U.esc(p.kana)}</div>` : ""}
      <div class="pron">${U.esc(p.viPron || "")}<span class="roma"> · ${U.esc(p.roma || "")}</span></div>
      <div class="meaning">${U.esc(p.vi)}</div>
      ${p.parts && p.parts.length ? compositionHtml(p) : ""}
      ${p.note ? `<div class="note">${U.esc(p.note)}</div>` : ""}
    </div>`;
}

function renderPhrases() {
  U.resetReg();
  const q = phraseState.q.trim();
  const cats = QJ.phrases.categories.filter(c => phraseState.cat === "all" || c.id === phraseState.cat);
  const searching = q.length > 0;

  const chips = `
    <div class="chip-row">
      <button class="chip ${phraseState.cat === "all" ? "active" : ""}" data-cat="all">Tất cả</button>
      ${QJ.phrases.categories.map(c => `
        <button class="chip ${phraseState.cat === c.id ? "active" : ""}" data-cat="${c.id}">
          ${c.icon} ${U.esc(c.label)}
        </button>`).join("")}
    </div>`;

  let sections = "";
  let total = 0;
  for (const cat of cats) {
    const items = cat.items.filter(p => phraseMatches(p, q));
    total += items.length;
    if (!items.length) continue;
    sections += `
      <div class="section-title">
        <h2>${cat.icon} ${U.esc(cat.label)}</h2>
        <span class="desc">${U.esc(cat.desc || "")}</span>
      </div>
      ${items.map(p => phraseCard(p)).join("")}`;
  }

  view.innerHTML = `
    <input id="phrase-search" class="search" type="search" placeholder="Tìm câu: 'cảm ơn', 'bao nhiêu', 'sumimasen'…" value="${U.esc(phraseState.q)}">
    ${chips}
    ${searching ? `<p style="font-size:13px;color:var(--muted)">${total} câu khớp "${U.esc(q)}"</p>` : ""}
    ${sections || `<div class="empty">Không tìm thấy câu phù hợp.<br>Thử từ khóa khác hoặc dùng 🔍 tìm toàn bộ nhé.</div>`}`;

  bindLiveSearch("phrase-search", v => {
    phraseState.q = v;
    renderPhrases();
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------ Từ vựng ------------------------------ */

const VOCAB_PAGE = 60;   // số từ hiện mỗi lần (danh sách N5 dài, không dựng hết DOM)
const vocabState = { tag: "all", q: "", limit: VOCAB_PAGE };

const VOCAB_TAGS = [
  { id: "all", label: "Tất cả" },
  { id: "n5", label: "🌱 JLPT N5" },
  { id: "food", label: "🍜 Món ăn" },
  { id: "drink", label: "🍵 Đồ uống" },
  { id: "place", label: "📍 Địa điểm" },
  { id: "shopping", label: "🛍️ Mua sắm" },
  { id: "money", label: "💴 Tiền" },
  { id: "emergency", label: "🚑 Khẩn cấp" },
  { id: "health", label: "🩺 Sức khỏe" },
  { id: "hotel", label: "🏨 Khách sạn" },
  { id: "verb", label: "⚡ Động từ" },
  { id: "adj", label: "✨ Tính từ" },
  { id: "question", label: "❓ Từ hỏi" },
  { id: "person", label: "👤 Xưng hô" },
];

/* Từ vựng N5 (561 từ) nằm ở file riêng, nạp nền để payload ban đầu vẫn nhẹ */
const N5 = {
  state: "idle",       // idle | loading | ready | error
  _promise: null,
  load() {
    if (N5.state === "ready") return Promise.resolve(true);
    if (N5._promise) return N5._promise;
    N5.state = "loading";
    N5._promise = new Promise(resolve => {
      const s = document.createElement("script");
      s.src = "data/vocab-n5.js";
      s.onload = () => { N5.state = "ready"; resolve(true); };
      s.onerror = () => { N5.state = "error"; N5._promise = null; resolve(false); };
      document.head.appendChild(s);
    });
    return N5._promise;
  },
  list() { return QJ.vocabN5 ? QJ.vocab.concat(QJ.vocabN5) : QJ.vocab; },
};

/* Nạp N5 rồi vẽ lại màn đang xem nếu màn đó cần danh sách đầy đủ */
function loadN5() {
  const pending = N5.load();
  if (!N5._refreshAttached) {
    N5._refreshAttached = true;
    pending.then(ok => {
      if (!ok) { N5._refreshAttached = false; return; }
      refreshAfterN5();
    });
  }
  return pending;
}

function refreshAfterN5() {
  const vocabInput = document.getElementById("vocab-search");
  const searchInput = document.getElementById("gs-input");
  if (vocabInput) rerenderKeepingFocus(vocabInput, () => renderVocab({ keepScroll: true }));
  else if (searchInput) rerenderKeepingFocus(searchInput, renderSearch);
  else if (document.querySelector('[data-quiz="start"]') && quizState.pool === "vocab") renderQuiz();
}

function rerenderKeepingFocus(inputEl, render) {
  const focused = document.activeElement === inputEl;
  const caret = focused ? inputEl.selectionStart : 0;
  render();
  if (!focused) return;
  const el = document.getElementById(inputEl.id);
  if (el) { el.focus(); el.setSelectionRange(caret, caret); }
}

function vocabMatches(v, q) {
  if (!q) return true;
  return [v.jp, v.kana, v.roma, v.vi].join(" ").toLowerCase().includes(q.toLowerCase());
}

function vocabFilter(v) {
  const t = vocabState.tag;
  if (t === "all") return true;
  if (t === "verb") return v.pos === "verb";
  if (t === "adj") return v.pos.startsWith("adj");
  return (v.tags || []).includes(t);
}

const firstExample = (item) => (Array.isArray(item.examples) ? item.examples[0] : null);

function exampleHtml(ex) {
  if (!ex) return "";
  const key = U.register({ jp: ex.jp, kana: ex.kana, viPron: ex.viPron, vi: ex.vi });
  return `
    <div class="w-ex">
      <button class="icon-btn w-ex-audio" title="Nghe câu ví dụ" data-act="speak" data-key="${key}">🔊</button>
      <div class="w-ex-body">
        <div class="w-ex-jp">${U.esc(ex.jp)}</div>
        <div class="w-ex-pron">${U.esc(ex.viPron || "")}${ex.roma ? `<span class="roma"> · ${U.esc(ex.roma)}</span>` : ""}</div>
        <div class="w-ex-vi">${U.esc(ex.vi)}</div>
      </div>
    </div>`;
}

function vocabCard(v) {
  const key = U.register({ jp: v.jp, kana: v.kana, viPron: v.viPron, vi: v.vi });
  let extra = "";
  if (v.pos === "verb" && v.forms) {
    extra = `ます: ${U.esc(v.forms.masu.jp)} (${U.esc(v.forms.masu.kana)}) · て: ${U.esc(v.forms.te.jp)}`;
  }
  return `
    <div class="word">
      <div class="w-top">
        <b>${U.esc(v.jp)}</b>
        ${v.kana && v.kana !== v.jp ? `<span class="w-kana">${U.esc(v.kana)}</span>` : ""}
        ${(v.tags || []).includes("n5") ? `<span class="w-lv" title="Từ vựng JLPT N5">N5</span>` : ""}
        <span style="margin-left:auto;display:flex;gap:6px">
          <button class="icon-btn" style="width:30px;height:30px;font-size:13px" data-act="speak" data-key="${key}">🔊</button>
        </span>
      </div>
      <div class="pron" style="font-size:13.5px">${U.esc(v.viPron)}<span class="roma"> · ${U.esc(v.roma || "")}</span></div>
      <div class="w-meaning">${U.esc(v.vi)}</div>
      ${extra ? `<div class="w-extra">${extra}</div>` : ""}
      ${exampleHtml(firstExample(v))}
    </div>`;
}

function renderVocab(opts = {}) {
  U.resetReg();
  if (N5.state === "idle") loadN5();
  const q = vocabState.q.trim();
  const items = N5.list().filter(v => vocabFilter(v) && vocabMatches(v, q));
  const shown = items.slice(0, vocabState.limit);

  const counters = (QJ.numbers?.counters || []).map(c => `
    <div class="word counter-card">
      <div class="w-top"><b>${U.esc(c.jp)}</b><span class="w-kana">${U.esc(c.vi)}</span></div>
      <div class="w-extra">${U.esc(c.note || "")}</div>
      <div class="combo-row">
        ${c.combos.map(x => `<div class="combo"><b>${U.esc(x.jp)}</b><span>${U.esc(x.vi)}</span><span class="pron" style="font-size:11.5px">${U.esc(x.viPron)}</span><span class="roma" style="font-size:11px">${U.esc(x.roma)}</span></div>`).join("")}
      </div>
    </div>`).join("");

  const money = (QJ.numbers?.money || []).map(m => `
    <div class="combo"><b>${U.esc(m.jp)}</b><span>${U.esc(m.vi)}</span><span class="pron" style="font-size:11.5px">${U.esc(m.viPron)}</span><span class="roma" style="font-size:11px">${U.esc(m.roma)}</span></div>`).join("");

  view.innerHTML = `
    <input id="vocab-search" class="search" type="search" placeholder="Tìm từ: 'nước', 'mizu', 'đắt'…" value="${U.esc(vocabState.q)}">
    <div class="chip-row">
      ${VOCAB_TAGS.map(t => `<button class="chip ${vocabState.tag === t.id ? "active" : ""}" data-vtag="${t.id}">${t.label}</button>`).join("")}
    </div>

    ${vocabState.tag === "all" && !q ? `
      <div class="card quiz-banner">
        <div class="qb-text">
          <b>🎧 Nghe & chọn</b>
          <span>Nghe câu tiếng Nhật, chọn nghĩa đúng — ${QUIZ_ROUND} câu một lượt.</span>
        </div>
        <button class="chip" data-act="open-quiz">Luyện ngay</button>
      </div>
      <div class="section-title"><h2>🔢 Số đếm & lượng từ</h2><span class="desc">Kèm phiên âm từng cách đếm</span></div>
      ${counters}
      <div class="section-title"><h2>💴 Mệnh giá thường gặp</h2></div>
      <div class="combo-row">${money}</div>
    ` : ""}

    <div class="section-title">
      <h2>📚 ${items.length} từ</h2>
      ${N5.state === "loading" ? `<span class="desc">đang tải thêm từ N5…</span>` : ""}
    </div>
    ${N5.state === "error" ? `
      <div class="note" style="display:flex;align-items:center;gap:8px;justify-content:space-between">
        <span>Không tải được 561 từ N5.</span>
        <button class="chip" data-act="retry-n5">Thử lại</button>
      </div>` : ""}
    <div class="word-grid">
      ${shown.map(v => vocabCard(v)).join("")}
    </div>
    ${items.length > shown.length ? `
      <div style="text-align:center;margin:14px 0">
        <button class="chip" data-act="vocab-more">Xem thêm ${items.length - shown.length} từ</button>
      </div>` : ""}
    ${items.length ? "" : (N5.state === "loading"
      ? `<div class="empty">Đang tải từ vựng N5…</div>`
      : `<div class="empty">Không có từ nào khớp.</div>`)}`;

  bindLiveSearch("vocab-search", v => {
    vocabState.q = v;
    vocabState.limit = VOCAB_PAGE;
    renderVocab();
  });
  if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------ Sổ tay của tôi ------------------------------ */

function sentenceCard(f) {
  const p = f.payload;
  const key = U.register(p);
  const brkId = "sent-" + f.id;
  const structure = Array.isArray(p.structure) && p.structure.length
    ? `
      <button class="brk-toggle" data-brk="${U.esc(brkId)}">🧩 Giải thích ngữ pháp</button>
      <div class="brk" id="brk-${U.esc(brkId)}" hidden>${structureRowsHtml(p.structure, brkId)}</div>`
    : "";
  return `
    <div class="card">
      <div class="phrase-head">
        <div class="phrase-jp">${U.esc(p.jp)}</div>
        <button class="icon-btn" title="Nghe" data-act="speak" data-key="${key}">🔊</button>
        <button class="icon-btn" title="Đưa máy" data-act="show" data-key="${key}">📺</button>
        <button class="icon-btn" title="Copy" data-act="copy" data-key="${key}">📋</button>
        <button class="icon-btn fav-on" title="Bỏ khỏi sổ tay" data-act="unfav-sentence" data-id="${U.esc(f.id)}">★</button>
      </div>
      ${p.kana && p.kana !== p.jp ? `<div class="kana-line">${U.esc(p.kana)}</div>` : ""}
      <div class="pron">${U.esc(p.viPron || "")}${p.roma ? `<span class="roma"> · ${U.esc(p.roma)}</span>` : ""}</div>
      <div class="meaning">${U.esc(p.vi)}</div>
      ${structure}
    </div>`;
}

/* ------------------------------ Nhập / xuất sổ tay ------------------------------ */

const NOTEBOOK_FORMAT = "quick-japanese/notebook";
const NOTEBOOK_VERSION = 1;
const NOTEBOOK_MAX = 2000;   // số mục tối đa mỗi lần nhập
let pendingImport = null;    // các mục hợp lệ đang chờ chọn gộp / thay thế

function notebookFileName() {
  return `quick-japanese-notebook-${new Date().toISOString().slice(0, 10)}.json`;
}

function exportNotebook() {
  const list = Fav.list();
  if (!list.length) { U.toast("Sổ tay đang trống"); return; }
  const payload = {
    format: NOTEBOOK_FORMAT,
    version: NOTEBOOK_VERSION,
    exportedAt: new Date().toISOString(),
    counts: {
      phrases: list.filter(f => f.type === "phrase").length,
      sentences: list.filter(f => f.type === "sentence").length,
    },
    entries: list,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = notebookFileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  U.toast(`Đã xuất ${list.length} mục ra file JSON`);
}

/* Chấp nhận cả file có vỏ { format, entries } lẫn mảng trần; lọc mục hỏng */
function parseNotebook(text) {
  let data;
  try { data = JSON.parse(text); } catch { return { error: "File không phải JSON hợp lệ." }; }
  const raw = Array.isArray(data) ? data : data && Array.isArray(data.entries) ? data.entries : null;
  if (!raw) return { error: "File không đúng định dạng sổ tay Quick Japanese." };
  if (raw.length > NOTEBOOK_MAX) return { error: `File quá lớn (tối đa ${NOTEBOOK_MAX} mục).` };

  const entries = [];
  let skipped = 0;
  for (const item of raw) {
    if (!item || typeof item !== "object") { skipped++; continue; }
    if (item.type === "phrase" && typeof item.id === "string" && PHRASE_MAP.has(item.id)) {
      entries.push({ type: "phrase", id: item.id });
    } else if (item.type === "sentence" && item.payload && typeof item.payload.jp === "string" && item.payload.jp) {
      entries.push({
        type: "sentence",
        id: typeof item.id === "string" && item.id ? item.id : "s" + Date.now() + Math.random().toString(36).slice(2, 6),
        payload: item.payload,
        savedAt: Number(item.savedAt) || Date.now(),
      });
    } else {
      skipped++;
    }
  }
  return { entries, skipped };
}

function importNotebookFile(file) {
  file.text().then(text => {
    const parsed = parseNotebook(text);
    if (parsed.error) { U.toast(parsed.error); return; }
    if (!parsed.entries.length) { U.toast("Không có mục hợp lệ để nhập"); return; }
    pendingImport = parsed;
    U.openModal(`
      <h3>Nhập sổ tay</h3>
      <p>Tìm thấy <b>${parsed.entries.length}</b> mục hợp lệ.${parsed.skipped ? ` Bỏ qua ${parsed.skipped} mục không hợp lệ.` : ""}</p>
      <p style="color:var(--muted);font-size:13px">
        <b>Gộp vào</b>: giữ sổ tay hiện tại và thêm các mục chưa có.<br>
        <b>Thay thế</b>: xóa sổ tay hiện tại rồi nhập file này.
      </p>
      <div class="b-actions">
        <button class="primary" data-act="import-merge">Gộp vào</button>
        <button data-act="import-replace">Thay thế</button>
        <button data-act="import-cancel">Hủy</button>
      </div>
    `);
  }).catch(() => U.toast("Không đọc được file"));
}

function mergeImport() {
  if (!pendingImport) return;
  const current = Fav.list();
  const phraseIds = new Set(current.filter(f => f.type === "phrase").map(f => f.id));
  const sentenceTexts = new Set(current.filter(f => f.type === "sentence" && f.payload).map(f => f.payload.jp));
  const added = [];
  for (const entry of pendingImport.entries) {
    if (entry.type === "phrase") {
      if (phraseIds.has(entry.id)) continue;
      phraseIds.add(entry.id);
    } else {
      if (sentenceTexts.has(entry.payload.jp)) continue;
      sentenceTexts.add(entry.payload.jp);
    }
    added.push(entry);
  }
  if (!Fav.save(current.concat(added))) { U.toast("Không đủ dung lượng để lưu sổ tay"); return; }
  const dupes = pendingImport.entries.length - added.length;
  finishImport(`Đã thêm ${added.length} mục${dupes ? `, bỏ qua ${dupes} mục đã có` : ""}`);
}

function replaceImport() {
  if (!pendingImport) return;
  const count = pendingImport.entries.length;
  if (!Fav.save(pendingImport.entries)) { U.toast("Không đủ dung lượng để lưu sổ tay"); return; }
  finishImport(`Đã nhập ${count} mục`);
}

function finishImport(msg) {
  pendingImport = null;
  U.closeModal();
  renderNotebook();
  U.toast(msg);
}

function pickNotebookFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (file) importNotebookFile(file);
  });
  input.click();
}

function renderNotebook() {
  U.resetReg();
  const list = Fav.list();
  const phrases = list.filter(f => f.type === "phrase").map(f => PHRASE_MAP.get(f.id)).filter(Boolean);
  const sentences = list.filter(f => f.type === "sentence" && f.payload);
  const total = phrases.length + sentences.length;

  view.innerHTML = `
    <div class="section-title">
      <h2>⭐ Sổ tay của tôi</h2>
      <span class="desc">${total} mục đã lưu trên thiết bị này</span>
    </div>
    <div class="notebook-io">
      ${total ? `<button class="chip" data-act="export-notebook">⬇ Xuất JSON</button>` : ""}
      <button class="chip" data-act="import-notebook">⬆ Nhập JSON</button>
    </div>
    ${sentences.length ? `
      <div class="section-title"><h2>🧩 Câu tự ghép (${sentences.length})</h2></div>
      ${sentences.map(f => sentenceCard(f)).join("")}` : ""}
    ${phrases.length ? `
      <div class="section-title"><h2>📖 Cụm từ (${phrases.length})</h2></div>
      ${phrases.map(p => phraseCard(p)).join("")}` : ""}
    ${total ? `<div style="text-align:center;margin:18px 0">
        <button class="chip" data-act="clear-favs">🗑 Xóa tất cả sổ tay</button>
      </div>` : ""}
    ${total ? "" : `<div class="empty">Chưa có gì trong sổ tay.<br>Bấm ☆ trên cụm từ hoặc câu tự ghép để lưu dùng nhanh khi đi du lịch.</div>`}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------ Ngữ pháp ------------------------------ */

const ROLE_LEGEND = [
  ["pron", "Đại từ / từ hỏi"],
  ["noun", "Danh từ"],
  ["verb", "Động từ"],
  ["adj", "Tính từ"],
  ["adverb", "Trạng từ"],
  ["particle", "Trợ từ"],
  ["copula", "です / でした"],
  ["number", "Số đếm"],
  ["expression", "Cụm cố định / khác"],
];

function renderGrammar() {
  view.innerHTML = `
    <div class="section-title"><h2>📝 Ngữ pháp tối giản</h2>
      <span class="desc">${QJ.grammar.points.length} điểm — đủ để hiểu mọi câu trong app</span></div>
    <div class="card">
      <b style="font-size:14px">🎨 Màu trong phân tích câu</b>
      <div class="legend">
        ${ROLE_LEGEND.map(([role, label]) => `<span class="c role-${role}">${label}</span>`).join("")}
      </div>
      <div style="font-size:12.5px;color:var(--muted);margin-top:8px">
        Mỗi câu được tách thành các mảnh theo vai trò ngữ pháp. Bấm vào một mảnh để xem giải thích,
        hoặc bấm 📝 để mở điểm ngữ pháp tương ứng.
      </div>
    </div>
    ${QJ.grammar.points.map(g => `
      <details class="g">
        <summary>
          <div class="g-head">
            <h3>${U.esc(g.title)}</h3>
            <span class="badge ${g.level === "plus" ? "plus" : ""}">${g.level === "plus" ? "nên biết" : "cơ bản"}</span>
          </div>
          <div class="g-summary">${U.esc(g.summary)}</div>
        </summary>
        <div class="g-body">
          <p>${U.esc(g.detail)}</p>
          ${(g.examples || []).map(e => `
            <div class="ex">
              <div class="ex-jp">${U.esc(e.jp)}</div>
              ${e.viPron ? `<div class="ex-pron">${U.esc(e.viPron)}${e.roma ? `<span class="roma"> · ${U.esc(e.roma)}</span>` : ""}</div>` : ""}
              <div class="ex-vi">${U.esc(e.vi)}</div>
            </div>`).join("")}
        </div>
      </details>`).join("")}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------ Nghe & chọn (luyện tai) ------------------------------ */

const QUIZ_KEY = "qj.quiz.v1";
const QUIZ_ROUND = 10;   // số câu mỗi lượt
const QUIZ_OPTS = 4;     // số lựa chọn mỗi câu
const HAS_TTS = "speechSynthesis" in window;

const quizState = {
  pool: "phrases",   // phrases | vocab
  view: "home",      // home | play | done
  questions: [],
  idx: 0,
  picked: null,      // chỉ số lựa chọn đã bấm của câu hiện tại; null = chưa trả lời
  score: 0,
  wrong: [],
};

const Quiz = {
  store() {
    try { return JSON.parse(localStorage.getItem(QUIZ_KEY)) || {}; } catch { return {}; }
  },
  save(patch) {
    try { localStorage.setItem(QUIZ_KEY, JSON.stringify({ ...Quiz.store(), ...patch })); } catch { /* riêng tư / hết chỗ */ }
  },
  best(pool) { return Number((Quiz.store().best || {})[pool] || 0); },
};

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const quizPool = () => (quizState.pool === "vocab" ? N5.list() : PHRASE_ALL);

/* Mỗi câu: 1 đáp án + 3 phương án nhiễu cùng nguồn, khác nghĩa */
function makeQuestions() {
  const pool = quizPool().filter(x => x.vi);
  const answers = shuffle(pool).slice(0, Math.min(QUIZ_ROUND, pool.length));
  return answers.map(answer => {
    const opts = [answer];
    const seen = new Set([answer.vi]);
    for (const d of shuffle(pool)) {
      if (opts.length >= QUIZ_OPTS) break;
      if (seen.has(d.vi)) continue;
      seen.add(d.vi);
      opts.push(d);
    }
    return { answer, opts: shuffle(opts) };
  });
}

function startQuiz() {
  quizState.questions = makeQuestions();
  quizState.idx = 0;
  quizState.picked = null;
  quizState.score = 0;
  quizState.wrong = [];
  quizState.view = "play";
  renderQuiz();
  speakCurrent();
}

function speakCurrent() {
  const q = quizState.questions[quizState.idx];
  if (q) U.speak(q.answer.jp);
}

function answerQuestion(i) {
  if (quizState.picked !== null) return;
  const q = quizState.questions[quizState.idx];
  if (!q || i < 0 || i >= q.opts.length) return;
  quizState.picked = i;
  if (q.opts[i] === q.answer) quizState.score += 1;
  else quizState.wrong.push(q.answer);
  renderQuiz();
  document.querySelector(".q-result")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function nextQuestion() {
  if (quizState.picked === null) return;
  if (quizState.idx + 1 >= quizState.questions.length) { finishQuiz(); return; }
  quizState.idx += 1;
  quizState.picked = null;
  renderQuiz();
  speakCurrent();
}

function finishQuiz() {
  const st = Quiz.store();
  const best = { ...(st.best || {}) };
  const total = quizState.questions.length;
  if (quizState.score > (best[quizState.pool] || 0)) best[quizState.pool] = quizState.score;
  Quiz.save({
    best,
    rounds: (st.rounds || 0) + 1,
    answered: (st.answered || 0) + total,
    correct: (st.correct || 0) + quizState.score,
  });
  quizState.view = "done";
  renderQuiz();
}

function quizItemCard(item) {
  const key = U.register(item);
  return `
    <div class="card">
      <div class="phrase-head">
        <div class="phrase-jp">${U.esc(item.jp)}</div>
        <button class="icon-btn" title="Nghe" data-act="speak" data-key="${key}">🔊</button>
      </div>
      ${item.kana && item.kana !== item.jp ? `<div class="kana-line">${U.esc(item.kana)}</div>` : ""}
      <div class="pron">${U.esc(item.viPron || "")}${item.roma ? `<span class="roma"> · ${U.esc(item.roma)}</span>` : ""}</div>
      <div class="meaning">${U.esc(item.vi)}</div>
    </div>`;
}

function quizHomeHtml() {
  const st = Quiz.store();
  const best = Quiz.best(quizState.pool);
  const maxScore = Math.min(QUIZ_ROUND, quizPool().length);
  return `
    <div class="b-top">
      <button class="back" data-act="close-quiz">← Quay lại</button>
      <div class="b-title">🎧 Nghe & chọn</div>
    </div>
    <div class="card quiz-hero">
      <p>Nghe câu tiếng Nhật rồi chọn nghĩa đúng. Mỗi lượt ${QUIZ_ROUND} câu, biết đáp án ngay sau khi chọn.</p>
      <div class="chip-row">
        <button class="chip ${quizState.pool === "phrases" ? "active" : ""}" data-quiz="pool" data-pool="phrases">📖 Cụm từ (${PHRASE_ALL.length})</button>
        <button class="chip ${quizState.pool === "vocab" ? "active" : ""}" data-quiz="pool" data-pool="vocab">📚 Từ vựng (${N5.list().length})</button>
      </div>
      <div class="quiz-meta">
        ${best ? `🏆 Điểm cao nhất: <b>${best}/${maxScore}</b>` : "Chưa có điểm — thử một lượt xem sao!"}${st.rounds ? ` · Đã chơi ${st.rounds} lượt` : ""}
      </div>
      ${HAS_TTS ? "" : `<div class="note">Thiết bị này không hỗ trợ đọc tiếng Nhật — app chuyển sang chế độ <b>Đọc & chọn</b>: chữ Nhật hiện thay cho âm thanh.</div>`}
      <button class="q-start" data-quiz="start">▶ Bắt đầu ${QUIZ_ROUND} câu</button>
    </div>
    <p style="font-size:13px;color:var(--muted);margin-top:14px">
      Mẹo: bấm 🔊 nghe lại bao nhiêu lần cũng được. Trên máy tính, bấm phím 1–4 để chọn nhanh.
    </p>`;
}

function quizResultHtml(q) {
  const ok = q.opts[quizState.picked] === q.answer;
  return `
    <div class="card q-result ${ok ? "" : "no"}">
      <div class="q-result-head">${ok ? "✓ Chính xác!" : "✗ Chưa đúng"}</div>
      <div class="q-jp">${U.esc(q.answer.jp)}</div>
      ${q.answer.kana && q.answer.kana !== q.answer.jp ? `<div class="kana-line">${U.esc(q.answer.kana)}</div>` : ""}
      <div class="pron">${U.esc(q.answer.viPron || "")}${q.answer.roma ? `<span class="roma"> · ${U.esc(q.answer.roma)}</span>` : ""}</div>
      <div class="meaning">${U.esc(q.answer.vi)}</div>
      ${q.answer.note ? `<div class="note">${U.esc(q.answer.note)}</div>` : ""}
      ${exampleHtml(firstExample(q.answer))}
      <div class="b-actions">
        <button data-quiz="replay">🔊 Nghe lại</button>
        <button class="primary" data-quiz="next">${quizState.idx + 1 >= quizState.questions.length ? "Xem kết quả →" : "Câu tiếp →"}</button>
      </div>
    </div>`;
}

function quizQuestionHtml() {
  const q = quizState.questions[quizState.idx];
  const answered = quizState.picked !== null;
  const opts = q.opts.map((o, i) => {
    let cls = "";
    if (answered) cls = o === q.answer ? "correct" : i === quizState.picked ? "wrong" : "dim";
    return `<button class="q-opt ${cls}" data-quiz="answer" data-idx="${i}" ${answered ? "disabled" : ""}>
      <b>${U.esc(o.vi)}</b></button>`;
  }).join("");
  return `
    <div class="b-top">
      <button class="back" data-act="close-quiz">← Thoát</button>
      <div class="b-title">🎧 Câu ${quizState.idx + 1}/${quizState.questions.length}</div>
      <div class="b-tools"><span class="q-live-score">✓ ${quizState.score}</span></div>
    </div>
    <div class="q-progress"><i style="width:${Math.round((quizState.idx / quizState.questions.length) * 100)}%"></i></div>
    <div class="card q-card">
      ${HAS_TTS
        ? `<button class="q-audio" data-quiz="replay">🔊 Nghe</button>
           <div class="q-hint">Nghe kỹ rồi chọn nghĩa đúng</div>`
        : `<div class="q-jp-fallback">${U.esc(q.answer.jp)}</div>
           <div class="q-hint">Chọn nghĩa đúng của câu trên</div>`}
      <div class="q-opts">${opts}</div>
    </div>
    ${answered ? quizResultHtml(q) : ""}`;
}

function quizDoneHtml() {
  const total = quizState.questions.length;
  const score = quizState.score;
  const pct = total ? Math.round((score / total) * 100) : 0;
  const msg = score === total ? "Tuyệt vời! Tai bạn rất nhạy 🎉"
    : pct >= 80 ? "Giỏi lắm! Gần như hoàn hảo."
    : pct >= 60 ? "Khá tốt — ôn lại vài câu bên dưới nhé."
    : "Đừng lo, nghe lại vài lần là quen tai ngay.";
  return `
    <div class="b-top">
      <button class="back" data-act="close-quiz">← Quay lại</button>
      <div class="b-title">🎧 Kết quả</div>
    </div>
    <div class="card q-score">
      <div class="q-score-num">${score}/${total}</div>
      <div class="q-score-msg">${msg}</div>
      <div class="q-score-sub">🏆 Điểm cao nhất: ${Quiz.best(quizState.pool)}/${Math.min(QUIZ_ROUND, quizPool().length)}</div>
      <div class="b-actions" style="justify-content:center">
        <button class="primary" data-quiz="again">🔁 Làm lại</button>
        <button data-quiz="home">🎯 Đổi nội dung</button>
      </div>
    </div>
    ${quizState.wrong.length ? `
      <div class="section-title"><h2>📌 Nên ôn lại (${quizState.wrong.length})</h2></div>
      ${quizState.wrong.map(quizItemCard).join("")}` : ""}`;
}

function renderQuiz() {
  U.resetReg();
  if (quizState.pool === "vocab" && N5.state === "idle") loadN5();
  if (quizState.view === "play") view.innerHTML = quizQuestionHtml();
  else if (quizState.view === "done") view.innerHTML = quizDoneHtml();
  else view.innerHTML = quizHomeHtml();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------ Tìm kiếm toàn cục ------------------------------ */

const searchState = { q: "" };

function renderSearch() {
  U.resetReg();
  if (N5.state === "idle") loadN5();
  setActiveTab(null);
  const q = searchState.q.trim();
  const lq = q.toLowerCase();

  let phrases = [], vocab = [], grammar = [], intents = [];
  if (q) {
    phrases = PHRASE_ALL.filter(p => phraseMatches(p, q)).slice(0, 20);
    vocab = N5.list().filter(v => vocabMatches(v, q)).slice(0, 20);
    grammar = QJ.grammar.points.filter(g => {
      const hay = [g.title, g.summary, g.detail, ...(g.examples || []).map(e => e.jp + " " + e.vi)].join(" ").toLowerCase();
      return hay.includes(lq);
    }).slice(0, 8);
    intents = QJ.intents.intents.filter(i => [i.label, i.desc, i.tip || ""].join(" ").toLowerCase().includes(lq)).slice(0, 6);
  }
  const total = phrases.length + vocab.length + grammar.length + intents.length;

  const intentCard = i => `
    <div class="card">
      <div class="phrase-head"><div class="phrase-jp" style="font-size:18px">${i.emoji} ${U.esc(i.label)}</div></div>
      <div class="meaning" style="color:var(--muted);font-size:13.5px">${U.esc(i.desc)}</div>
      <div style="margin-top:10px"><button class="chip" data-act="open-intent" data-id="${i.id}">🧩 Ghép câu này</button></div>
    </div>`;

  const grammarCard = g => `
    <div class="card">
      <div class="phrase-head"><div class="phrase-jp" style="font-size:17px">${U.esc(g.title)}</div></div>
      <div class="meaning" style="color:var(--muted);font-size:13.5px">${U.esc(g.summary)}</div>
      <div style="margin-top:10px"><button class="chip" data-gs-grammar="${g.id}">📝 Mở ngữ pháp</button></div>
    </div>`;

  view.innerHTML = `
    <div class="b-top">
      <button class="back" data-act="close-search">← Quay lại</button>
      <div class="b-title">🔍 Tìm kiếm toàn bộ</div>
    </div>
    <input id="gs-input" class="search" type="search" placeholder="Cụm từ, từ vựng, ngữ pháp, mục ghép câu…" value="${U.esc(searchState.q)}">
    ${q ? `<p style="font-size:13px;color:var(--muted)">${total} kết quả cho "${U.esc(q)}"</p>` : `
      <p style="font-size:13.5px;color:var(--muted);margin-top:12px">
        Gõ tiếng Việt, romaji hoặc tiếng Nhật — ví dụ: <b>cảm ơn</b>, <b>mizu</b>, <b>bao nhiêu</b>, <b>trợ từ</b>.
      </p>`}
    ${intents.length ? `<div class="section-title"><h2>🧩 Mục ghép câu</h2></div>${intents.map(intentCard).join("")}` : ""}
    ${phrases.length ? `<div class="section-title"><h2>📖 Cụm từ (${phrases.length})</h2></div>${phrases.map(phraseCard).join("")}` : ""}
    ${vocab.length ? `<div class="section-title"><h2>📚 Từ vựng (${vocab.length})</h2></div><div class="word-grid">${vocab.map(vocabCard).join("")}</div>` : ""}
    ${grammar.length ? `<div class="section-title"><h2>📝 Ngữ pháp (${grammar.length})</h2></div>${grammar.map(grammarCard).join("")}` : ""}
    ${q && !total ? `<div class="empty">Không tìm thấy gì cho "${U.esc(q)}".</div>` : ""}`;

  document.getElementById("gs-input").focus();
  bindLiveSearch("gs-input", v => {
    searchState.q = v;
    renderSearch();
  });
}

/* ------------------------------ Điều hướng tab ------------------------------ */

let currentTab = "phrases";

const TABS = {
  phrases: renderPhrases,
  builder: () => window.Builder.open(),
  notebook: renderNotebook,
  vocab: renderVocab,
  grammar: renderGrammar,
};

function setActiveTab(tab) {
  document.querySelectorAll("#tabs button").forEach(b =>
    b.classList.toggle("active", !!tab && b.dataset.tab === tab)
  );
}

function switchTab(tab) {
  currentTab = tab;
  setActiveTab(tab);
  (TABS[tab] || renderPhrases)();
}

document.getElementById("tabs").addEventListener("click", e => {
  const btn = e.target.closest("button[data-tab]");
  if (btn) switchTab(btn.dataset.tab);
});

/* ------------------------------ Sự kiện toàn cục ------------------------------ */

document.addEventListener("click", e => {
  if (e.target.closest("#gs-open")) { renderSearch(); return; }

  if (e.target.closest("#quiz-open") || e.target.closest('[data-act="open-quiz"]')) { renderQuiz(); return; }

  const closeQuiz = e.target.closest('[data-act="close-quiz"]');
  if (closeQuiz) { U.stopSpeak(); switchTab(currentTab); return; }

  const quizEl = e.target.closest("[data-quiz]");
  if (quizEl) {
    const action = quizEl.dataset.quiz;
    if (action === "pool" && quizEl.dataset.pool !== quizState.pool) {
      quizState.pool = quizEl.dataset.pool;
      quizState.view = "home";
      renderQuiz();
    }
    else if (action === "start" || action === "again") startQuiz();
    else if (action === "answer") answerQuestion(Number(quizEl.dataset.idx));
    else if (action === "replay") speakCurrent();
    else if (action === "next") nextQuestion();
    else if (action === "home") { quizState.view = "home"; renderQuiz(); }
    return;
  }

  const close = e.target.closest("[data-close-modal]");
  if (close) { U.closeModal(); return; }

  const closeSearch = e.target.closest('[data-act="close-search"]');
  if (closeSearch) { switchTab(currentTab); return; }

  const brk = e.target.closest("[data-brk]");
  if (brk) {
    const panel = document.getElementById("brk-" + brk.dataset.brk);
    if (panel) {
      panel.hidden = !panel.hidden;
      brk.classList.toggle("open", !panel.hidden);
      brk.textContent = panel.hidden ? "🧩 Giải thích ngữ pháp" : "🧩 Thu gọn giải thích";
    }
    return;
  }

  const chip = e.target.closest("[data-chip]");
  if (chip) {
    const pid = chip.dataset.for;
    const panel = document.getElementById("brk-" + pid);
    if (panel) {
      if (panel.hidden) {
        panel.hidden = false;
        const t = document.querySelector(`[data-brk="${pid}"]`);
        if (t) { t.classList.add("open"); t.textContent = "🧩 Thu gọn giải thích"; }
      }
      const row = panel.querySelector(`[data-row="${chip.dataset.chip}"]`);
      if (row) {
        row.classList.remove("hl");
        void row.offsetWidth; // restart animation
        row.classList.add("hl");
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    return;
  }

  const grammarEl = e.target.closest("[data-grammar]");
  if (grammarEl) { U.openGrammar(grammarEl.dataset.grammar); return; }

  const cat = e.target.closest("[data-cat]");
  if (cat) { phraseState.cat = cat.dataset.cat; renderPhrases(); return; }

  const vtag = e.target.closest("[data-vtag]");
  if (vtag) {
    vocabState.tag = vtag.dataset.vtag;
    vocabState.limit = VOCAB_PAGE;
    renderVocab();
    return;
  }

  const vocabMore = e.target.closest('[data-act="vocab-more"]');
  if (vocabMore) {
    vocabState.limit += VOCAB_PAGE;
    renderVocab({ keepScroll: true });
    return;
  }

  const retryN5 = e.target.closest('[data-act="retry-n5"]');
  if (retryN5) { loadN5(); return; }

  const fav = e.target.closest('[data-act="fav"]');
  if (fav) {
    const p = PHRASE_MAP.get(fav.dataset.id);
    if (p) {
      const on = Fav.toggle({ type: "phrase", id: p.id });
      paintFav(fav, on);
      U.toast(on ? "Đã lưu vào sổ tay" : "Đã bỏ khỏi sổ tay");
      if (currentTab === "notebook") renderNotebook();
    }
    return;
  }

  const unfav = e.target.closest('[data-act="unfav-sentence"]');
  if (unfav) {
    Fav.remove("sentence", unfav.dataset.id);
    U.toast("Đã bỏ khỏi sổ tay");
    renderNotebook();
    return;
  }

  const clearFavs = e.target.closest('[data-act="clear-favs"]');
  if (clearFavs) {
    if (confirm("Xóa toàn bộ sổ tay?")) { Fav.clear(); renderNotebook(); U.toast("Đã xóa sổ tay"); }
    return;
  }

  const exportNb = e.target.closest('[data-act="export-notebook"]');
  if (exportNb) { exportNotebook(); return; }

  const importNb = e.target.closest('[data-act="import-notebook"]');
  if (importNb) { pickNotebookFile(); return; }

  const importMerge = e.target.closest('[data-act="import-merge"]');
  if (importMerge) { mergeImport(); return; }

  const importReplace = e.target.closest('[data-act="import-replace"]');
  if (importReplace) { replaceImport(); return; }

  const importCancel = e.target.closest('[data-act="import-cancel"]');
  if (importCancel) { pendingImport = null; U.closeModal(); return; }

  const openIntent = e.target.closest('[data-act="open-intent"]');
  if (openIntent) {
    switchTab("builder");
    window.Builder.startWith(openIntent.dataset.id);
    return;
  }

  const gsGrammar = e.target.closest("[data-gs-grammar]");
  if (gsGrammar) { U.openGrammar(gsGrammar.dataset.gsGrammar); return; }

  const act = e.target.closest("[data-act]");
  if (act) {
    const p = U.get(act.dataset.key);
    if (!p) return;
    if (act.dataset.act === "speak") U.speak(p.jp);
    if (act.dataset.act === "copy") U.copy(`${p.jp}\n${p.viPron || ""}\n${p.vi}`, p.jp);
    if (act.dataset.act === "show") U.showToLocal(p);
  }
});

document.getElementById("modal").addEventListener("click", e => {
  if (e.target.id === "modal") U.closeModal();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") U.closeModal();
  // Trong lúc luyện nghe, phím 1–4 chọn đáp án nhanh (chỉ khi màn hình quiz đang hiện)
  if (quizState.view === "play" && quizState.picked === null && view.querySelector(".q-opts")) {
    const n = Number(e.key);
    if (n >= 1 && n <= QUIZ_OPTS) answerQuestion(n - 1);
  }
});

if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = () => U.pickVoice();
  U.pickVoice();
}

/* PWA: đăng ký service worker (chỉ khi chạy qua http/https) */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => { /* môi trường không hỗ trợ */ });
  });
}

/* Nạp trước từ vựng N5 khi máy rảnh — không chặn màn hình đầu */
if ("requestIdleCallback" in window) requestIdleCallback(() => loadN5());
else setTimeout(() => loadN5(), 1500);

/* Khởi động */
switchTab("phrases");
