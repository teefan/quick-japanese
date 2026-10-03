"use strict";
/* app.js — khung ứng dụng: 4 tab, sổ tay cụm từ, từ vựng, ngữ pháp, TTS, chế độ đưa máy. */

const QJ = window.QJ || {};
const view = document.getElementById("view");

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

/* ------------------------------ Sổ tay cụm từ ------------------------------ */

const phraseState = { cat: "all", q: "" };

function phraseMatches(p, q) {
  if (!q) return true;
  const hay = [p.jp, p.kana, p.roma, p.vi, p.viPron, p.note].join(" ").toLowerCase();
  return hay.includes(q.toLowerCase());
}

function renderPhrases() {
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
    ${sections || `<div class="empty">Không tìm thấy câu phù hợp.<br>Thử từ khóa khác nhé.</div>`}`;

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

function phraseCard(p) {
  const key = U.register(p);
  return `
    <div class="card">
      <div class="phrase-head">
        <div class="phrase-jp">${U.esc(p.jp)}</div>
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
  if (["verb", "adj"].includes(t)) return v.pos === "verb" && t === "verb" || v.pos.startsWith("adj") && t === "adj";
  return (v.tags || []).includes(t);
}

function renderVocab() {
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
      ${items.map(v => {
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
      }).join("")}
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

/* ------------------------------ Điều hướng tab ------------------------------ */

const TABS = {
  phrases: renderPhrases,
  builder: () => window.Builder.open(),
  vocab: renderVocab,
  grammar: renderGrammar,
};

function switchTab(tab) {
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  (TABS[tab] || renderPhrases)();
}

document.getElementById("tabs").addEventListener("click", e => {
  const btn = e.target.closest("button[data-tab]");
  if (btn) switchTab(btn.dataset.tab);
});

/* ------------------------------ Sự kiện toàn cục ------------------------------ */

document.addEventListener("click", e => {
  const close = e.target.closest("[data-close-modal]");
  if (close) { U.closeModal(); return; }

  const cat = e.target.closest("[data-cat]");
  if (cat) { phraseState.cat = cat.dataset.cat; renderPhrases(); return; }

  const vtag = e.target.closest("[data-vtag]");
  if (vtag) { vocabState.tag = vtag.dataset.vtag; renderVocab(); return; }

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

/* Khởi động */
switchTab("phrases");
