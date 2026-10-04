"use strict";
/* app.js — khung ứng dụng bốn tab: Cẩm nang (guide), Ghép câu (builder), Từ vựng, Ngữ pháp.
   Gồm: cẩm nang phong tục, builder, từ vựng (curated + N5 tải nền), ngữ pháp tối giản, TTS, PWA. */

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
};
window.U = U;

/* ------------------------------ Sáng / tối ------------------------------ */
/* Mặc định LUÔN là nền sáng (không theo cài đặt hệ điều hành). Người dùng đổi
   bằng nút 🌙/☀️ ở header; lựa chọn được nhớ trong localStorage. */

function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    const label = dark ? "Chuyển sang nền sáng" : "Chuyển sang nền tối";
    btn.textContent = dark ? "☀️" : "🌙";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#17151d" : "#fdf6f3");
}

document.getElementById("theme-toggle")?.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem("qj-theme", next); } catch { /* chế độ riêng tư */ }
  applyTheme(next);
});

applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");

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

/* Nạp N5 rồi vẽ lại tab Từ vựng nếu đang mở */
function loadN5() {
  const pending = N5.load();
  if (!N5._refreshAttached) {
    N5._refreshAttached = true;
    pending.then(ok => {
      if (!ok) { N5._refreshAttached = false; return; }
      const vocabInput = document.getElementById("vocab-search");
      if (vocabInput) rerenderKeepingFocus(vocabInput, () => renderVocab({ keepScroll: true }));
    });
  }
  return pending;
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

/* Trọng âm (pitch accent): chia kana thành mora — kana nhỏ dính vào mora trước */
function moraSplit(kana) {
  const small = "ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ";
  const out = [];
  for (const ch of kana || "") {
    if (out.length && small.includes(ch)) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

/* Vẽ trọng âm: mora cao có gạch trên, ↓ = xuống giọng sau mora đó, kèm số [n] */
function pitchHtml(kana, accent) {
  if (accent === undefined || accent === null) return "";
  const morae = moraSplit(kana);
  if (!morae.length) return "";
  const n = morae.length;
  const hi = (i) => (accent === 1 ? i === 1 : i >= 2 && (accent === 0 || i <= accent));
  let pattern = "";
  morae.forEach((m, idx) => {
    const i = idx + 1;
    pattern += `<span class="pm${hi(i) ? " hi" : ""}">${U.esc(m)}</span>`;
    if (accent > 0 && i === Math.min(accent, n)) pattern += `<span class="pdrop">↓</span>`;
  });
  const tip = accent === 0 ? "không xuống giọng (heiban)" : `xuống giọng sau mora ${accent}`;
  return `<div class="pitch" title="Trọng âm [${accent}] — ${tip}">${pattern}<span class="pitch-num">[${accent}]</span></div>`;
}

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

/* Chip liên kết sang builder: từ này được dùng trong mục ghép câu nào */
function builderChips(v) {
  const ids = (QJ.builderIndex || {})[v.id];
  if (!ids || !ids.length) return "";
  const intents = (QJ.intents && QJ.intents.intents) || [];
  const chips = ids.map(id => {
    const it = intents.find(x => x.id === id);
    if (!it) return "";
    return `<button class="chip w-build-chip" data-act="build-with" data-intent="${U.esc(id)}" title="Mở mục ghép câu này">${U.esc(it.emoji || "🧩")} ${U.esc(it.label)}</button>`;
  }).join("");
  return `<div class="w-build"><span class="w-build-label">🧩 Ghép câu:</span>${chips}</div>`;
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
      ${pitchHtml(v.kana, v.accent)}
      <div class="w-meaning">${U.esc(v.vi)}</div>
      ${extra ? `<div class="w-extra">${extra}</div>` : ""}
      ${exampleHtml(firstExample(v))}
      ${builderChips(v)}
    </div>`;
}

/* Nguồn dữ liệu & giấy phép — hiện cuối danh sách từ vựng */
function sourceNoteHtml() {
  return `
    <div class="card src-note">
      <b>📜 Nguồn dữ liệu</b>
      <p>
        Từ vựng JLPT N5: <a href="https://github.com/evanclan/OpenJLPT" target="_blank" rel="noopener">OpenJLPT</a> (CC BY-SA 4.0).
        Câu ví dụ: <a href="https://tatoeba.org" target="_blank" rel="noopener">Tatoeba</a> (CC BY 2.0 FR) qua OpenJLPT.
        Trọng âm: <a href="https://github.com/mifunetoshiro/kanjium" target="_blank" rel="noopener">Kanjium</a> (CC BY-SA 4.0).
        Nghĩa tiếng Việt, phiên âm và nội dung còn lại do dự án biên tập.
      </p>
      <p>Mã nguồn <a href="https://github.com/teefan/quick-japanese" target="_blank" rel="noopener">teefan/quick-japanese</a> (MIT).</p>
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
      : `<div class="empty">Không có từ nào khớp.</div>`)}
    ${vocabState.tag === "all" && !q ? sourceNoteHtml() : ""}`;

  bindLiveSearch("vocab-search", v => {
    vocabState.q = v;
    vocabState.limit = VOCAB_PAGE;
    renderVocab();
  });
  if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------ Ngữ pháp ------------------------------ */

const GRAMMAR_LEVELS = [["basic", "Cần ngay"], ["plus", "Nên biết thêm"]];

function grammarExampleHtml(ex) {
  const key = U.register({ jp: ex.jp, kana: ex.kana, viPron: ex.viPron, vi: ex.vi });
  return `
    <div class="g-ex">
      <button class="icon-btn g-ex-audio" title="Nghe ví dụ" data-act="speak" data-key="${key}">🔊</button>
      <div class="g-ex-body">
        <div class="g-ex-jp">${U.esc(ex.jp)}</div>
        <div class="g-ex-pron">${U.esc(ex.viPron || "")}${ex.roma ? `<span class="roma"> · ${U.esc(ex.roma)}</span>` : ""}</div>
        <div class="g-ex-vi">${U.esc(ex.vi)}</div>
      </div>
    </div>`;
}

function grammarPointHtml(g) {
  const pat = g.pattern;
  const patKey = pat ? U.register({ jp: pat.kana || pat.jp, kana: pat.kana, viPron: pat.viPron, vi: g.title }) : "";
  return `
    <details class="g">
      <summary>
        <div class="g-head">
          <h3>${U.esc(g.title)}</h3>
          <span class="badge ${g.level === "plus" ? "plus" : ""}">${g.level === "plus" ? "nên biết" : "cơ bản"}</span>
        </div>
        <div class="g-summary">${U.esc(g.summary)}</div>
        ${pat ? `
          <div class="g-pat">
            <span class="g-pat-pron">${U.esc(pat.viPron || "")}${pat.roma ? `<span class="roma"> · ${U.esc(pat.roma)}</span>` : ""}</span>
            <button class="icon-btn g-pat-audio" title="Nghe mẫu câu" data-act="speak" data-key="${patKey}">🔊</button>
          </div>` : ""}
      </summary>
      <div class="g-body">
        <p>${U.esc(g.detail)}</p>
        ${(g.examples || []).map(grammarExampleHtml).join("")}
      </div>
    </details>`;
}

/* Tab Ngữ pháp tối giản: các trợ từ/mẫu câu hay gặp trong tab Ghép câu */
function renderGrammar() {
  U.resetReg();
  const points = (QJ.grammar && QJ.grammar.points) || [];
  const sections = GRAMMAR_LEVELS.map(([level, label]) => {
    const list = points.filter(g => g.level === level);
    if (!list.length) return "";
    return `
      <div class="section-title">
        <h2>${level === "basic" ? "🟢" : "🔵"} ${label}</h2>
        <span class="desc">${list.length} điểm</span>
      </div>
      ${list.map(grammarPointHtml).join("")}`;
  }).join("");

  view.innerHTML = `
    <div class="section-title">
      <h2>📝 Ngữ pháp tối giản</h2>
      <span class="desc">${points.length} điểm — đủ để hiểu mọi câu trong app</span>
    </div>
    <div class="card">
      <b style="font-size:14px">Cách dùng</b>
      <div style="font-size:12.5px;color:var(--muted);margin-top:4px">
        Mở từng điểm để xem giải thích ngắn và ví dụ. Ví dụ lấy từ chính các câu tab 🧩 Ghép câu ráp
        được, kèm phiên âm Việt + romaji — bấm 🔊 để nghe. Học xong quay lại Ghép câu để dùng thật.
      </div>
    </div>
    ${sections}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------ Cẩm nang du lịch ------------------------------ */

function guidePhraseHtml(p) {
  const key = U.register({ jp: p.jp, kana: p.kana, viPron: p.viPron, vi: p.vi });
  return `
    <div class="g-ex">
      <button class="icon-btn g-ex-audio" title="Nghe câu mẫu" data-act="speak" data-key="${key}">🔊</button>
      <div class="g-ex-body">
        <div class="g-ex-jp">${U.esc(p.jp)}</div>
        <div class="g-ex-pron">${U.esc(p.viPron || "")}${p.roma ? `<span class="roma"> · ${U.esc(p.roma)}</span>` : ""}</div>
        <div class="g-ex-vi">${U.esc(p.vi)}</div>
      </div>
    </div>`;
}

/* Chip "🧩 Ghép câu" của cẩm nang — mở thẳng cây ý định liên quan */
function guideChips(item) {
  const ids = item.intents || [];
  if (!ids.length) return "";
  const all = (QJ.intents && QJ.intents.intents) || [];
  const chips = ids.map(id => {
    const it = all.find(x => x.id === id);
    if (!it) return "";
    return `<button class="chip w-build-chip" data-act="build-with" data-intent="${U.esc(id)}" title="Mở mục ghép câu này">${U.esc(it.emoji || "🧩")} ${U.esc(it.label)}</button>`;
  }).join("");
  return `<div class="w-build"><span class="w-build-label">🧩 Ghép câu:</span>${chips}</div>`;
}

function guideItemHtml(it) {
  return `
    <details class="g cs-item">
      <summary>
        <div class="g-head"><h3>${U.esc(it.emoji || "•")} ${U.esc(it.title)}</h3></div>
      </summary>
      <div class="g-body">
        <p>${U.esc(it.text)}</p>
        ${it.do ? `<div class="cs-rule do">${U.esc(it.do)}</div>` : ""}
        ${it.dont ? `<div class="cs-rule dont">${U.esc(it.dont)}</div>` : ""}
        ${(it.phrases || []).map(guidePhraseHtml).join("")}
        ${guideChips(it)}
      </div>
    </details>`;
}

/* Tab Cẩm nang: phong tục, lịch sự & mẹo thực dụng, có câu mẫu + chip sang builder */
function renderGuide() {
  U.resetReg();
  const cs = QJ.cheatsheet || { sections: [], sources: [] };
  const items = cs.sections.reduce((n, s) => n + (s.items || []).length, 0);
  const sections = cs.sections.map(s => `
    <div class="section-title">
      <h2>${U.esc(s.emoji || "•")} ${U.esc(s.title)}</h2>
      <span class="desc">${U.esc(s.desc || "")}</span>
    </div>
    ${(s.items || []).map(guideItemHtml).join("")}`).join("");

  view.innerHTML = `
    <div class="section-title">
      <h2>🧭 Cẩm nang du lịch</h2>
      <span class="desc">${cs.sections.length} nhóm · ${items} mẹo — phong tục, lịch sự &amp; an toàn</span>
    </div>
    <div class="card">
      <b style="font-size:14px">Được tôn trọng từ cái gật đầu</b>
      <div style="font-size:12.5px;color:var(--muted);margin-top:4px">
        Mở từng thẻ để xem mẹo; câu tiếng Nhật kèm phiên âm Việt + romaji, bấm 🔊 để nghe.
        Thẻ nào có chip 🧩 là mở thẳng câu ghép tương ứng.
      </div>
      <div class="cs-actions">
        <button class="quick-chip" data-goto="builder"><span>🧩</span> Ghép câu ngay</button>
        <button class="quick-chip" data-goto="grammar"><span>📝</span> Ngữ pháp tối giản</button>
      </div>
    </div>
    ${sections}
    <div class="card src-note">
      <b>📜 Nguồn tham khảo</b>
      ${cs.sources.map(s => `<p><a href="${U.esc(s.url)}" target="_blank" rel="noopener">${U.esc(s.label)}</a></p>`).join("")}
      <p>Nội dung do dự án biên tập lại cho người Việt; quy định có thể thay đổi theo thời gian — kiểm tra lại trước khi đi.</p>
    </div>`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------ Điều hướng tab ------------------------------ */

let currentTab = "guide";

const TABS = {
  guide: renderGuide,
  builder: () => window.Builder.open(),
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
  (TABS[tab] || TABS.guide)();
}

document.getElementById("tabs").addEventListener("click", e => {
  const btn = e.target.closest("button[data-tab]");
  if (btn) switchTab(btn.dataset.tab);
});

/* ------------------------------ Sự kiện toàn cục ------------------------------ */

document.addEventListener("click", e => {
  const goto = e.target.closest("[data-goto]");
  if (goto && TABS[goto.dataset.goto]) {
    switchTab(goto.dataset.goto);
    return;
  }

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

  const buildWith = e.target.closest('[data-act="build-with"]');
  if (buildWith) {
    switchTab("builder");
    window.Builder.startWith(buildWith.dataset.intent);
    return;
  }

  const act = e.target.closest("[data-act]");
  if (act) {
    const p = U.get(act.dataset.key);
    if (!p) return;
    if (act.dataset.act === "speak") {
      // Nút 🔊 nằm trong <summary> của tab Ngữ pháp: chặn mở/đóng thẻ khi bấm nghe
      e.preventDefault();
      U.speak(p.jp);
    }
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

/* Khởi động — mặc định mở Cẩm nang; chờ DOM xong để builder.js kịp định nghĩa window.Builder */
document.addEventListener("DOMContentLoaded", () => switchTab("guide"), { once: true });
