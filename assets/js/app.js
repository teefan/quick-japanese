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

/* ------------------------------ Sổ tay (localStorage) ------------------------------ */

const Fav = {
  KEY: "qj.favs.v1",
  list() {
    try { return JSON.parse(localStorage.getItem(Fav.KEY)) || []; } catch { return []; }
  },
  save(list) {
    try { localStorage.setItem(Fav.KEY, JSON.stringify(list)); } catch { /* riêng tư / hết chỗ */ }
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
      ${p.kana && p.kana !== p.jp ? `<div class="kana-line">${U.esc(p.kana)}${p.roma ? " · " + U.esc(p.roma) : ""}</div>` : ""}
      <div class="pron">${U.esc(p.viPron || "")}</div>
      <div class="meaning">${U.esc(p.vi)}</div>
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

  const input = document.getElementById("phrase-search");
  input.addEventListener("input", e => {
    phraseState.q = e.target.value;
    const pos = e.target.selectionStart;
    renderPhrases();
    const el = document.getElementById("phrase-search");
    el.focus();
    el.setSelectionRange(pos, pos);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------ Từ vựng ------------------------------ */

const vocabState = { tag: "all", q: "" };

const VOCAB_TAGS = [
  { id: "all", label: "Tất cả" },
  { id: "food", label: "🍜 Món ăn" },
  { id: "drink", label: "🍵 Đồ uống" },
  { id: "place", label: "📍 Địa điểm" },
  { id: "shopping", label: "🛍️ Mua sắm" },
  { id: "money", label: "💴 Tiền" },
  { id: "emergency", label: "🚑 Khẩn cấp" },
  { id: "verb", label: "⚡ Động từ" },
  { id: "adj", label: "✨ Tính từ" },
  { id: "question", label: "❓ Từ hỏi" },
  { id: "person", label: "👤 Xưng hô" },
];

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
        <span class="w-kana">${U.esc(v.kana)}</span>
        <span style="margin-left:auto;display:flex;gap:6px">
          <button class="icon-btn" style="width:30px;height:30px;font-size:13px" data-act="speak" data-key="${key}">🔊</button>
        </span>
      </div>
      <div class="pron" style="font-size:13.5px">${U.esc(v.viPron)}</div>
      <div class="w-meaning">${U.esc(v.vi)}</div>
      ${extra ? `<div class="w-extra">${extra}</div>` : ""}
    </div>`;
}

function renderVocab() {
  U.resetReg();
  const q = vocabState.q.trim();
  const items = QJ.vocab.filter(v => vocabFilter(v) && vocabMatches(v, q));

  const counters = (QJ.numbers?.counters || []).map(c => `
    <div class="word counter-card">
      <div class="w-top"><b>${U.esc(c.jp)}</b><span class="w-kana">${U.esc(c.vi)}</span></div>
      <div class="w-extra">${U.esc(c.note || "")}</div>
      <div class="combo-row">
        ${c.combos.map(x => `<div class="combo"><b>${U.esc(x.jp)}</b><span>${U.esc(x.vi)}</span><span class="pron" style="font-size:11.5px">${U.esc(x.viPron)}</span></div>`).join("")}
      </div>
    </div>`).join("");

  const money = (QJ.numbers?.money || []).map(m => `
    <div class="combo"><b>${U.esc(m.jp)}</b><span>${U.esc(m.vi)}</span><span class="pron" style="font-size:11.5px">${U.esc(m.viPron)}</span></div>`).join("");

  view.innerHTML = `
    <input id="vocab-search" class="search" type="search" placeholder="Tìm từ: 'nước', 'mizu', 'đắt'…" value="${U.esc(vocabState.q)}">
    <div class="chip-row">
      ${VOCAB_TAGS.map(t => `<button class="chip ${vocabState.tag === t.id ? "active" : ""}" data-vtag="${t.id}">${t.label}</button>`).join("")}
    </div>

    ${vocabState.tag === "all" && !q ? `
      <div class="section-title"><h2>🔢 Số đếm & lượng từ</h2><span class="desc">Kèm phiên âm từng cách đếm</span></div>
      ${counters}
      <div class="section-title"><h2>💴 Mệnh giá thường gặp</h2></div>
      <div class="combo-row">${money}</div>
    ` : ""}

    <div class="section-title"><h2>📚 ${items.length} từ</h2></div>
    <div class="word-grid">
      ${items.map(v => vocabCard(v)).join("")}
    </div>
    ${items.length ? "" : `<div class="empty">Không có từ nào khớp.</div>`}`;

  const input = document.getElementById("vocab-search");
  input.addEventListener("input", e => {
    vocabState.q = e.target.value;
    const pos = e.target.selectionStart;
    renderVocab();
    const el = document.getElementById("vocab-search");
    el.focus();
    el.setSelectionRange(pos, pos);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------ Sổ tay của tôi ------------------------------ */

function sentenceCard(f) {
  const p = f.payload;
  const key = U.register(p);
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
      <div class="pron">${U.esc(p.viPron || "")}</div>
      <div class="meaning">${U.esc(p.vi)}</div>
    </div>`;
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

function renderGrammar() {
  view.innerHTML = `
    <div class="section-title"><h2>📝 Ngữ pháp tối giản</h2>
      <span class="desc">${QJ.grammar.points.length} điểm — đủ để hiểu mọi câu trong app</span></div>
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
              ${e.viPron ? `<div class="ex-pron">${U.esc(e.viPron)}</div>` : ""}
              <div class="ex-vi">${U.esc(e.vi)}</div>
            </div>`).join("")}
        </div>
      </details>`).join("")}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------ Tìm kiếm toàn cục ------------------------------ */

const searchState = { q: "" };

function renderSearch() {
  U.resetReg();
  setActiveTab(null);
  const q = searchState.q.trim();
  const lq = q.toLowerCase();

  let phrases = [], vocab = [], grammar = [], intents = [];
  if (q) {
    phrases = PHRASE_ALL.filter(p => phraseMatches(p, q)).slice(0, 20);
    vocab = QJ.vocab.filter(v => vocabMatches(v, q)).slice(0, 20);
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

  const input = document.getElementById("gs-input");
  input.focus();
  input.addEventListener("input", e => {
    searchState.q = e.target.value;
    const pos = e.target.selectionStart;
    renderSearch();
    const el = document.getElementById("gs-input");
    if (el) { el.focus(); el.setSelectionRange(pos, pos); }
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

  const close = e.target.closest("[data-close-modal]");
  if (close) { U.closeModal(); return; }

  const closeSearch = e.target.closest('[data-act="close-search"]');
  if (closeSearch) { switchTab(currentTab); return; }

  const cat = e.target.closest("[data-cat]");
  if (cat) { phraseState.cat = cat.dataset.cat; renderPhrases(); return; }

  const vtag = e.target.closest("[data-vtag]");
  if (vtag) { vocabState.tag = vtag.dataset.vtag; renderVocab(); return; }

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
document.addEventListener("keydown", e => { if (e.key === "Escape") U.closeModal(); });

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

/* Khởi động */
switchTab("phrases");
