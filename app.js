/* ============================================================
   Hanasou! — LOGIC (app.js) — dữ liệu nằm ở data.js
   Triết lý: mở app là học ngay · không cần đăng nhập · 1 nút chính
   ============================================================ */
"use strict";

/* ---------------- HẰNG SỐ LOGIC ---------------- */
const STORE_KEY = "hanasou_v1";
const XP = { again: 2, good: 5, easy: 8, quiz: 3, perfectBonus: 10 };
const INTERVALS = [1, 1, 2, 4, 8, 16]; // ngày, theo box 0..5
const BOX_MAX = 5;
const DUE_CAP = 20; // tối đa thẻ ôn mỗi buổi

const ALL_ITEMS = [...PHRASES, ...WORDS]; // 374 thẻ
const itemById = (id) => ALL_ITEMS.find((x) => x.id === id);
const catOf = (item) => (item.kind === "p" ? PHRASE_CATS : VOCAB_CATS).find((c) => c.id === item.cat);

/* ---------------- KẾ HOẠCH 10 NGÀY ----------------
   Cấp 1 → ngày 1-5 · Cấp 2 → ngày 6-8 · Cấp 3 → ngày 9-10.
   Trong mỗi cấp, chia đều theo kiểu "xoay vòng chủ đề" để
   mỗi ngày học đều đủ các chủ đề (câu + từ xen kẽ). */
const CURRICULUM = (() => {
  const cats = [...PHRASE_CATS, ...VOCAB_CATS];
  const byLevel = [1, 2, 3].map((lv) => {
    const items = ALL_ITEMS.filter((i) => i.level === lv);
    const buckets = cats.map((c) => items.filter((i) => i.cat === c.id)).filter((b) => b.length);
    const out = [];
    let adding = true;
    while (adding) {
      adding = false;
      for (const b of buckets) if (b.length) { out.push(b.shift()); adding = true; }
    }
    return out;
  });
  const plan = [[byLevel[0], 5], [byLevel[1], 3], [byLevel[2], 2]];
  const days = [];
  for (const [arr, n] of plan) {
    const per = Math.ceil(arr.length / n);
    for (let d = 0; d < n; d++) days.push(arr.slice(d * per, (d + 1) * per));
  }
  return days;
})();
const ITEM_DAY = {};
CURRICULUM.forEach((day, di) => day.forEach((i) => { ITEM_DAY[i.id] = di; }));
const TOTAL_DAYS = CURRICULUM.length; // 10
const dayLevel = (di) => CURRICULUM[di][0].level;

/* ---------------- TRẠNG THÁI ---------------- */
let store = { users: [], activeUserId: null, unlockAll: false };
let selectedEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
let session = null;
let quiz = null;
let quizScope = "seen";

/* ---------------- TIỆN ÍCH ---------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const yesterStr = () => { const d = new Date(Date.now() - 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) store = { ...store, ...JSON.parse(raw) };
  } catch (e) { /* giữ mặc định */ }
}
function saveStore() { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {} }
function currentUser() { return store.users.find((u) => u.id === store.activeUserId) || null; }
function maskedPhone(p) {
  const d = String(p || "").replace(/\D/g, "");
  if (d.length < 4) return "•••";
  return d.slice(0, 3) + " ••• " + d.slice(-3);
}
function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.add("hidden"), 2800);
}

function speak(text) {
  try {
    if (!("speechSynthesis" in window)) { showToast("Trình duyệt không hỗ trợ đọc 😢"); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = 0.82;
    const v = speechSynthesis.getVoices().find((x) => (x.lang || "").toLowerCase().startsWith("ja"));
    if (v) u.voice = v;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch (e) {}
}

/* ---------------- HỒ SƠ (tự tạo Khách) ---------------- */
function ensureUser() {
  if (!store.users.length) {
    store.users.push({
      id: "guest", name: "Khách", phone: "", emoji: "🍙", guest: true,
      xp: 0, streakCount: 0, lastStudyDay: null, cards: {}, bestQuiz: null,
      joined: new Date().toISOString(),
    });
  }
  if (!store.activeUserId || !currentUser()) store.activeUserId = store.users[0].id;
  saveStore();
}

/* ---------------- SRS & TIẾN ĐỘ ---------------- */
function touchStreak(u) {
  const t = todayStr();
  if (u.lastStudyDay === t) return;
  u.streakCount = u.lastStudyDay === yesterStr() ? (u.streakCount || 0) + 1 : 1;
  u.lastStudyDay = t;
}
function addXp(u, n) { u.xp = (u.xp || 0) + n; }
function xpLevel(u) { return Math.floor((u.xp || 0) / 150) + 1; }
function masteredOf(u, filterFn) { return Object.keys(u.cards || {}).filter((id) => (u.cards[id].box || 0) >= 4 && (!filterFn || filterFn(itemById(id)))).length; }
function masteredCount(u) { return masteredOf(u); }
function seenCount(u) { return Object.keys(u.cards || {}).length; }
function dueDaysAgo(card) {
  if (!card || !card.last) return true;
  const diff = Math.floor((Date.now() - new Date(card.last).getTime()) / 86400000);
  return diff >= INTERVALS[card.box];
}

/* Buổi kế tiếp = ngày đầu tiên còn thẻ chưa từng học */
function currentLesson(u) {
  for (let d = 0; d < TOTAL_DAYS; d++) {
    if (CURRICULUM[d].some((i) => !(i.id in (u.cards || {})))) return d;
  }
  return TOTAL_DAYS; // hoàn thành cả kế hoạch
}
function lessonUnlocked(u, di) { return store.unlockAll || di <= currentLesson(u); }

/* Thẻ của buổi hôm nay: ôn đến hạn →.cards bù ngày bỏ lỡ → thẻ mới của ngày */
function todayCards(u, li) {
  const seen = (id) => id in (u.cards || {});
  const due = ALL_ITEMS.filter((i) => seen(i.id) && dueDaysAgo(u.cards[i.id])).slice(0, DUE_CAP);
  const catchUp = [];
  for (let d = 0; d < li; d++) catchUp.push(...CURRICULUM[d].filter((i) => !seen(i.id)));
  const fresh = li < TOTAL_DAYS ? CURRICULUM[li].filter((i) => !seen(i.id)) : [];
  return [...due, ...catchUp, ...fresh];
}

/* ---------------- ĐIỀU HƯỚNG & MENU ---------------- */
function showView(name) {
  $$(".view").forEach((v) => v.classList.remove("active"));
  const target = $("#view-" + name);
  if (target) target.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  closeMenu();
  const render = { hoc: renderHoc, group: renderGroup, progress: renderProgress, quiz: renderQuizHome, cheat: null }[name];
  if (render) render();
}
function openMenu() { $("#menu-overlay").classList.remove("hidden"); }
function closeMenu() { const m = $("#menu-overlay"); if (m) m.classList.add("hidden"); }

/* ---------------- CẨM NANG ---------------- */
function initCheat() {
  const grid = $("#kana-grid");
  if (grid) grid.innerHTML = HIRAGANA.map(([k, r]) => `<div class="kana-cell"><b>${k}</b><small>${r}</small></div>`).join("");
  const toggle = $("#kana-toggle");
  if (toggle) toggle.addEventListener("click", () => {
    const body = $("#kana-body");
    body.classList.toggle("hidden");
    $("#kana-toggle .chev").classList.toggle("open");
  });
  $$("#view-cheat .speakable").forEach((b) => b.addEventListener("click", () => speak(b.dataset.say)));
  [["#demo-units-1", "こんにちは"], ["#demo-units-2", "ちょっと"], ["#demo-units-3", "東京駅行き"]]
    .forEach(([sel, jp]) => { const el = $(sel); if (el) el.innerHTML = unitMapHTML(jp); });
}

/* ---------------- TỪNG CHỮ → PHÁT ÂM (unit map) ----------------
   Nghiên cứu: cách chuẩn là furigana (<ruby>) — phát âm nằm trên từng chữ;
   với romaji/VN dài thì "flexbox per-character" cho căn chỉnh chính xác nhất.
   Ở đây mỗi đơn vị (kana / cụm kanji / latin) = 1 cột: chữ → ↓ → đọc kiểu Việt + romaji. */
const KANA_ROWS = [
  ["あ","ア","a","a"],["い","イ","i","i"],["う","ウ","u","u"],["え","エ","e","ê"],["お","オ","o","ô"],
  ["か","カ","ka","ca"],["き","キ","ki","ki"],["く","ク","ku","cu"],["け","ケ","ke","kê"],["こ","コ","ko","cô"],
  ["が","ガ","ga","ga"],["ぎ","ギ","gi","ghi"],["ぐ","グ","gu","gu"],["げ","ゲ","ge","ghê"],["ご","ゴ","go","gô"],
  ["さ","サ","sa","sa"],["し","シ","shi","xi"],["す","ス","su","su"],["せ","セ","se","sê"],["そ","ソ","so","sô"],
  ["ざ","ザ","za","za"],["じ","ジ","ji","gi"],["ず","ズ","zu","zu"],["ぜ","ゼ","ze","zê"],["ぞ","ゾ","zo","zô"],
  ["た","タ","ta","ta"],["ち","チ","chi","chi"],["つ","ツ","tsu","tsu"],["て","テ","te","tê"],["と","ト","to","tô"],
  ["だ","ダ","da","đa"],["ぢ","ヂ","ji","gi"],["づ","ヅ","zu","du"],["で","デ","de","đê"],["ど","ド","do","đô"],
  ["な","ナ","na","na"],["に","ニ","ni","ni"],["ぬ","ヌ","nu","nu"],["ね","ネ","ne","nê"],["の","ノ","no","nô"],
  ["は","ハ","ha","ha"],["ひ","ヒ","hi","hi"],["ふ","フ","fu","phu"],["へ","ヘ","he","hê"],["ほ","ホ","ho","hô"],
  ["ば","バ","ba","ba"],["び","ビ","bi","bi"],["ぶ","ブ","bu","bu"],["べ","ベ","be","bê"],["ぼ","ボ","bo","bô"],
  ["ぱ","パ","pa","pa"],["ぴ","ピ","pi","pi"],["ぷ","プ","pu","pu"],["ぺ","ペ","pe","pê"],["ぽ","ポ","po","pô"],
  ["ま","マ","ma","ma"],["み","ミ","mi","mi"],["む","ム","mu","mu"],["め","メ","me","mê"],["も","モ","mo","mô"],
  ["や","ヤ","ya","ya"],["ゆ","ユ","yu","yu"],["よ","ヨ","yo","yô"],
  ["ら","ラ","ra","la"],["り","リ","ri","li"],["る","ル","ru","lu"],["れ","レ","re","lê"],["ろ","ロ","ro","lô"],
  ["わ","ワ","wa","oa"],["を","ヲ","o","ô"],["ん","ン","n","n"],
];
const COMBO_ROWS = [
  ["きゃ","キャ","kya","kia"],["きゅ","キュ","kyu","cyu"],["きょ","キョ","kyo","cyô"],
  ["しゃ","シャ","sha","xa"],["しゅ","シュ","shu","xu"],["しょ","ショ","sho","xô"],
  ["ちゃ","チャ","cha","cha"],["ちゅ","チュ","chu","chu"],["ちょ","チョ","cho","chô"],
  ["にゃ","ニャ","nya","nia"],["にゅ","ニュ","nyu","niu"],["にょ","ニョ","nyo","niô"],
  ["ひゃ","ヒャ","hya","hia"],["ひゅ","ヒュ","hyu","hiu"],["ひょ","ヒョ","hyo","hiô"],
  ["みゃ","ミャ","mya","mia"],["みゅ","ミュ","myu","miu"],["みょ","ミョ","myo","miô"],
  ["りゃ","リャ","rya","lia"],["りゅ","リュ","ryu","liu"],["りょ","リョ","ryo","liô"],
  ["ぎゃ","ギャ","gya","ghia"],["ぎゅ","ギュ","gyu","ghiu"],["ぎょ","ギョ","gyo","ghiô"],
  ["じゃ","ジャ","ja","gia"],["じゅ","ジュ","ju","ju"],["じょ","ジョ","jo","gio"],
  ["びゃ","ビャ","bya","bia"],["びゅ","ビュ","byu","biu"],["びょ","ビョ","byo","biô"],
  ["ぴゃ","ピャ","pya","pia"],["ぴゅ","ピュ","pyu","piu"],["ぴょ","ピョ","pyo","piô"],
  ["ふぁ","ファ","fa","fa"],["ふぃ","フィ","fi","fi"],["ふぇ","フェ","fe","fê"],["ふぉ","フォ","fo","fô"],
  ["てぃ","ティ","ti","ti"],["でぃ","ディ","di","đi"],["うぃ","ウィ","wi","oi"],["うぇ","ウェ","we","oê"],
  ["ちぇ","チェ","che","chê"],["しぇ","シェ","she","xê"],["じぇ","ジェ","je","giê"],
];
const KANA_TBL = {};
KANA_ROWS.forEach(([h, k, ro, vn]) => { KANA_TBL[h] = { ro, vn }; KANA_TBL[k] = { ro, vn }; });
const COMBO_TBL = {};
COMBO_ROWS.forEach(([h, k, ro, vn]) => { COMBO_TBL[h] = { ro, vn }; COMBO_TBL[k] = { ro, vn }; });
const isKanaCh = (ch) => /[\u3041-\u3096\u30a1-\u30fa\u30fc]/.test(ch);
const isKanjiCh = (ch) => /[\u4e00-\u9faf\u3005]/.test(ch);
const SMALLS = "ゃゅょぁぃぅぇぉャュョァィゥェォ";

function charUnits(jp) {
  const chars = [...jp];
  const units = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];
    if (isKanaCh(ch) && ch !== "ー" && ch !== "ッ" && ch !== "っ") {
      if (next && SMALLS.includes(next)) {
        const combo = COMBO_TBL[ch + next];
        units.push({ jp: ch + next, type: "kana", vn: combo ? combo.vn : KANA_TBL[ch].vn, ro: combo ? combo.ro : KANA_TBL[ch].ro });
        i++;
      } else {
        const t = KANA_TBL[ch] || { ro: ch, vn: ch };
        units.push({ jp: ch, type: "kana", vn: t.vn, ro: t.ro });
      }
      continue;
    }
    if (ch === "っ" || ch === "ッ") { units.push({ jp: ch, type: "special", vn: "(gấp đôi)", ro: "dừng nửa nhịp" }); continue; }
    if (ch === "ー") { units.push({ jp: ch, type: "special", vn: "(kéo dài)", ro: "thêm 1 nhịp" }); continue; }
    if (isKanjiCh(ch)) {
      let run = ch;
      while (i + 1 < chars.length && isKanjiCh(chars[i + 1])) run += chars[++i];
      const rd = KANJI_READ[run];
      units.push(rd ? { jp: run, type: "kanji", vn: rd[1], ro: rd[0] } : { jp: run, type: "unknown" });
      continue;
    }
    if (/[A-Za-z0-9]/.test(ch)) {
      let run = ch;
      while (i + 1 < chars.length && /[A-Za-z0-9\-'.]/.test(chars[i + 1])) run += chars[++i];
      units.push({ jp: run, type: "latin", vn: "", ro: "" });
      continue;
    }
    units.push({ jp: ch, type: "sep" });
  }
  return units;
}

function unitMapHTML(jp) {
  const units = charUnits(jp);
  if (!units.length || units.some((u) => u.type === "unknown")) {
    return `<div class="unit u-fallback"><span class="u-jp">${esc(jp)}</span><span class="u-arrow">↓</span><span class="u-vn">đọc cả cụm bên trên 🔊</span></div>`;
  }
  return units.map((u) => {
    if (u.type === "sep") return `<span class="unit u-sep">${esc(u.jp)}</span>`;
    return `<span class="unit u-${u.type}" title="${esc(u.jp)}">
      <span class="u-jp">${esc(u.jp)}</span>
      <span class="u-arrow">↓</span>
      <span class="u-vn">${esc(u.vn || u.jp)}</span>
      ${u.ro ? `<span class="u-ro">${esc(u.ro)}</span>` : ""}
    </span>`;
  }).join("");
}

/* ---------------- MÀN HỌC CHÍNH ---------------- */
function renderHoc() {
  if (session && session.finished) session = null; // quay lại sau khi xong buổi
  const u = currentUser();
  const inSession = session && !session.finished;
  $("#learn-session").classList.toggle("hidden", !inSession);
  $("#learn-done").classList.add("hidden");
  $("#hoc-main").classList.toggle("hidden", inSession);
  $("#picker-toggle").classList.toggle("hidden", !!inSession);
  if (inSession) return;

  const li = currentLesson(u);
  const finishedPlan = li >= TOTAL_DAYS;
  const dayNo = Math.min(li + 1, TOTAL_DAYS);
  const lv = LEVELS[dayLevel(Math.min(li, TOTAL_DAYS - 1)) - 1];
  const cards = finishedPlan ? [] : todayCards(u, li);
  const dueN = u ? ALL_ITEMS.filter((i) => (i.id in u.cards) && dueDaysAgo(u.cards[i.id])).length : 0;
  const newN = cards.length - Math.min(dueN, DUE_CAP);

  const seen = seenCount(u);
  const pct = Math.round((seen / ALL_ITEMS.length) * 100);
  const greeting = u.guest
    ? `Học luôn không cần đăng ký — tiến trình vẫn được lưu trên máy này 😉`
    : `Chào ${esc(u.name)}! 👋`;

  let planHtml;
  if (finishedPlan) {
    planHtml = `
      <h2 class="plan-title">Hoàn thành kế hoạch 10 ngày! 🎉<br>おめでとう！</h2>
      <p class="muted">Bạn đã học hết ${ALL_ITEMS.length} thẻ. Ôn lại bằng trắc nghiệm hoặc luyện chủ đề bên dưới để giữ phản xạ trước chuyến đi nhé!</p>
      <button class="btn btn-pink btn-mega" id="start-btn">🚀 Ôn tổng toàn bộ</button>`;
  } else {
    planHtml = `
      <h2 class="plan-title">Hôm nay học gì?</h2>
      <button class="btn btn-pink btn-mega" id="start-btn">▶ Học ngay · ${cards.length} thẻ</button>
      <p class="muted small plan-sub">${dueN > 0 ? `🔁 ${Math.min(dueN, DUE_CAP)} thẻ ôn tập` : ""}${dueN > 0 && newN > 0 ? " + " : ""}${newN > 0 ? `🆕 ${newN} thẻ mới` : ""}${cards.length === 0 ? "Hôm nay tạm hết thẻ — quay lại ngày mai hoặc bấm học sớm ngày sau nhé!" : " · khoảng 10 phút"}</p>
      ${cards.length === 0 ? `<button class="btn btn-matcha" id="next-day-btn" style="margin-top:10px">🚀 Học sớm Ngày ${dayNo + 1}</button>` : ""}`;
  }

  $("#hoc-main").innerHTML = `
    <div class="hoc-top">
      <div>
        <div class="day-line">Ngày ${finishedPlan ? TOTAL_DAYS : dayNo}/10 <span class="lv-badge">${lv.emoji} ${(lv.name.split("·")[1] || lv.name).trim()}</span></div>
        <p class="hoc-greeting">${greeting}</p>
      </div>
      <div class="mascot" id="mascot-hoc"></div>
    </div>
    <div class="card plan-card">
      ${planHtml}
      <div class="progress-line"><div class="fill" style="width:${pct}%"></div></div>
      <div class="mini-stats">
        <span>🎴 ${seen}/${ALL_ITEMS.length} thẻ</span>
        <span>🔥 Chuỗi ${u.streakCount || 0} ngày</span>
        <span>⭐ ${u.xp || 0} XP</span>
      </div>
    </div>`;

  drawMascots();
  const startBtn = $("#start-btn");
  if (startBtn) startBtn.addEventListener("click", () => {
    if (finishedPlan) startSession(ALL_ITEMS.filter((i) => u.cards[i.id] && dueDaysAgo(u.cards[i.id])).slice(0, 30), "Ôn tổng");
    else startSession(cards, `Ngày ${dayNo}`);
  });
  const nextBtn = $("#next-day-btn");
  if (nextBtn) nextBtn.addEventListener("click", () => {
    startSession(CURRICULUM[li + 1] || [], `Ngày ${Math.min(li + 2, 10)} (học sớm)`);
  });
  renderUserChip();
}

/* ---------------- PHIÊN HỌC ---------------- */
function startSession(cards, label) {
  const u = currentUser();
  if (!cards.length) { showToast("Chưa có thẻ nào để học ở đây!"); return; }
  // ưu tiên: ôn đến hạn → chưa từng học → phần còn lại
  const due = cards.filter((p) => (u.cards[p.id] || {}).box > 0 && dueDaysAgo(u.cards[p.id]));
  const fresh = cards.filter((p) => !(p.id in (u.cards || {})));
  const rest = cards.filter((p) => !due.includes(p) && !fresh.includes(p));
  session = { cards: [...due, ...fresh, ...rest], label, idx: 0, xp: 0, againCount: 0, finished: false, lastLessonIdx: currentLesson(u) };
  $("#hoc-main").classList.add("hidden");
  $("#topic-picker").classList.add("hidden");
  $("#picker-toggle").classList.add("hidden");
  $("#learn-done").classList.add("hidden");
  $("#learn-session").classList.remove("hidden");
  showCard();
}

function showCard() {
  const p = session.cards[session.idx];
  const cat = catOf(p);
  $("#fc-cat").textContent = `${cat.emoji} ${cat.name} · ${session.label}`;
  $("#fc-front-main").textContent = p.vi;
  $("#fc-front-en").textContent = p.en ? "🇬🇧 " + p.en : "";
  $("#fc-jp").textContent = p.jp;
  $("#fc-ro").textContent = p.ro;
  $("#fc-vn").textContent = "🇻🇳 Đọc kiểu Việt: " + p.vn;
  $("#fc-vi").textContent = p.vi;
  $("#fc-tip").textContent = p.tip ? "💡 " + p.tip : "";
  if (p.ex) {
    $("#fc-example").classList.remove("hidden");
    $("#fc-ex-jp").textContent = p.ex.jp;
    $("#fc-ex-vn").textContent = "🇻🇳 " + p.ex.vn;
    $("#fc-ex-vi").textContent = p.ex.vi;
  } else {
    $("#fc-example").classList.add("hidden");
  }
  $("#fc-units").innerHTML = unitMapHTML(p.jp) +
    '<div class="unit-note">💡 Trợ từ đọc khác chữ: は → "oa" · を → "ô" · へ → "ê" · す/し cuối câu đọc nhẹ "s"</div>';
  $("#fc-units").classList.add("hidden");
  $("#units-toggle").textContent = "🔬 Từng chữ → phát âm ▾";
  $("#flashcard").classList.remove("flipped");
  $$(".btn-rate").forEach((b) => (b.disabled = true));
  $("#rate-hint").textContent = "Lật thẻ để xem tiếng Nhật + cách đọc kiểu Việt nhé!";
  $("#session-count").textContent = `${session.idx + 1} / ${session.cards.length}`;
  $("#session-fill").style.width = `${(session.idx / session.cards.length) * 100}%`;
}

function flipCard() {
  const card = $("#flashcard");
  card.classList.toggle("flipped");
  if (card.classList.contains("flipped")) {
    $$(".btn-rate").forEach((b) => (b.disabled = false));
    $("#rate-hint").textContent = "Đọc theo dòng 🇻🇳 rồi chấm điểm nhé!";
    speak(session.cards[session.idx].jp);
  }
}

function rateCard(q) {
  const u = currentUser();
  const p = session.cards[session.idx];
  const rec = u.cards[p.id] || { box: 0 };
  if (q === 0) { rec.box = 0; session.againCount++; addXp(u, XP.again); session.xp += XP.again; }
  if (q === 1) { rec.box = Math.min(rec.box + 1, BOX_MAX); addXp(u, XP.good); session.xp += XP.good; }
  if (q === 2) { rec.box = Math.min(rec.box + 2, BOX_MAX); addXp(u, XP.easy); session.xp += XP.easy; }
  rec.last = new Date().toISOString();
  u.cards[p.id] = rec;
  touchStreak(u);
  saveStore();

  bounceMascot(q > 0);
  session.idx++;
  if (session.idx >= session.cards.length && session.againCount > 0 && !session.replayed) {
    const forgotten = session.cards.filter((c) => (u.cards[c.id] || {}).box === 0);
    if (forgotten.length) {
      forgotten.forEach((c) => { u.cards[c.id].box = 1; });
      session.cards = session.cards.concat(forgotten);
      session.replayed = true;
    }
  }
  if (session.idx >= session.cards.length) endSession();
  else showCard();
}

function endSession() {
  session.finished = true;
  const u = currentUser();
  const dayDone = currentLesson(u) > session.lastLessonIdx;
  $("#learn-session").classList.add("hidden");
  $("#learn-done").classList.remove("hidden");
  $("#done-title").textContent = dayDone
    ? `Xong Ngày ${Math.min(session.lastLessonIdx + 1, 10)}! Otsukaresama! 🎉`
    : "Tuyệt! Otsukaresama! 🎉";
  $("#learn-done-stats").innerHTML =
    `Bạn vừa luyện <b>${session.cards.length} thẻ</b> · nhận <b>+${session.xp} XP</b> ⭐<br>` +
    `Chuỗi học <b>${u.streakCount || 0} ngày</b> 🔥 · Đã học <b>${seenCount(u)}/${ALL_ITEMS.length}</b> thẻ`;
  renderUserChip();
}

/* ---------------- TỰ CHỌN CHỦ ĐỀ ---------------- */
function renderTopicPicker() {
  const u = currentUser();
  const grid = $("#cat-grid");
  const cats = [...PHRASE_CATS, ...VOCAB_CATS];
  grid.innerHTML = cats.map((c) => {
    const list = ALL_ITEMS.filter((i) => i.cat === c.id && lessonUnlocked(u, ITEM_DAY[i.id]));
    if (!list.length) return "";
    const mastered = list.filter((p) => (u.cards[p.id] || {}).box >= 4).length;
    const pct = Math.round((mastered / list.length) * 100);
    return `
      <div class="cat-card" data-cat="${c.id}">
        <div class="cat-emoji">${c.emoji}</div>
        <h3>${c.name}</h3>
        <div class="jp-sub">${c.jp}</div>
        <div class="progress-line"><div class="fill" style="width:${pct}%"></div></div>
        <div class="cat-count"><span>${list.length} thẻ</span><span>${mastered} thuộc lòng</span></div>
      </div>`;
  }).join("");
  $$("#cat-grid .cat-card").forEach((el) =>
    el.addEventListener("click", () => {
      const catId = el.dataset.cat;
      const list = ALL_ITEMS.filter((i) => i.cat === catId && lessonUnlocked(u, ITEM_DAY[i.id]));
      startSession(list, catOf(list[0]).name);
    })
  );
}

/* ---------------- TRẮC NGHIỆM ---------------- */
function renderQuizHome() {
  if (quiz && !quiz.finished) return;
  $("#quiz-home").classList.remove("hidden");
  $("#quiz-play").classList.add("hidden");
  $("#quiz-done").classList.add("hidden");
  const u = currentUser();
  const seenN = seenCount(u);
  const openN = ALL_ITEMS.filter((i) => lessonUnlocked(u, ITEM_DAY[i.id])).length;
  const chips = [
    { id: "seen", label: `📚 Bài đã học (${seenN})`, ok: seenN >= 4 },
    { id: "all", label: `🌏 Tất cả đã mở (${openN})`, ok: openN >= 4 },
  ];
  if (!chips.find((c) => c.id === quizScope).ok) quizScope = chips.find((c) => c.ok) ? chips.find((c) => c.ok).id : "seen";
  $("#quiz-scope").innerHTML = chips.map((c) =>
    `<button class="chip ${quizScope === c.id ? "sel" : ""} ${c.ok ? "" : "chip-locked"}" data-scope="${c.id}" ${c.ok ? "" : "disabled"}>${c.label}</button>`
  ).join("");
  $$("#quiz-scope .chip:not(.chip-locked)").forEach((b) =>
    b.addEventListener("click", () => { quizScope = b.dataset.scope; renderQuizHome(); })
  );
  $("#quiz-best").innerHTML = u.guest
    ? `💡 Bạn đang học với tư cách <b>Khách</b> — đặt tên ở menu <b>Nhóm</b> để XP được lên bảng vàng thi đấu với bạn bè!`
    : `<b>Kỷ lục của ${esc(u.name)}:</b> ${u.bestQuiz != null ? u.bestQuiz + "/10 điểm 🏅" : "chưa làm lần nào — thử ngay!"}`;
}

function quizPool() {
  const u = currentUser();
  if (quizScope === "seen") return ALL_ITEMS.filter((i) => u.cards[i.id]);
  return ALL_ITEMS.filter((i) => lessonUnlocked(u, ITEM_DAY[i.id]));
}

function startQuiz() {
  const pool = quizPool();
  if (pool.length < 4) { showToast("Học thêm vài thẻ đã rồi trắc nghiệm nhé! 😉"); return; }
  const types = ["jp2vi", "vi2jp", "listen"];
  const qs = [...pool].sort(() => Math.random() - 0.5).slice(0, 10).map((p) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const distract = [...pool.filter((x) => x.id !== p.id)].sort(() => Math.random() - 0.5).slice(0, 3);
    return { p, type, opts: distract.concat(p).sort(() => Math.random() - 0.5) };
  });
  quiz = { qs, idx: 0, score: 0, finished: false, answered: false };
  $("#quiz-home").classList.add("hidden");
  $("#quiz-done").classList.add("hidden");
  $("#quiz-play").classList.remove("hidden");
  showQuestion();
}

function showQuestion() {
  const q = quiz.qs[quiz.idx];
  quiz.answered = false;
  $("#quiz-fill").style.width = `${(quiz.idx / quiz.qs.length) * 100}%`;
  $("#quiz-count").textContent = `Câu ${quiz.idx + 1}/${quiz.qs.length}`;
  const typeInfo = {
    jp2vi: { label: "🇯🇵 → 🇻🇳 Đọc chữ Nhật, chọn nghĩa", prompt: q.p.jp },
    vi2jp: { label: "🇻🇳 → 🇯🇵 Dịch sang tiếng Nhật", prompt: q.p.vi },
    listen: { label: "🔊 Nghe và chọn nghĩa", prompt: "🎵 Bạn nghe được gì?" },
  }[q.type];
  $("#q-type").textContent = typeInfo.label;
  $("#q-prompt").textContent = typeInfo.prompt;
  $("#q-speak").classList.toggle("hidden", q.type !== "listen");
  if (q.type === "listen") speak(q.p.jp);
  $("#q-feedback").classList.add("hidden");
  $("#q-next").classList.add("hidden");
  $("#q-options").innerHTML = q.opts.map((o, i) => {
    const text = q.type === "vi2jp" ? `${o.jp} <span class="muted small">(${esc(o.vn)})</span>` : esc(o.vi);
    return `<button class="q-opt" data-i="${i}">${text}</button>`;
  }).join("");
  $$(".q-opt").forEach((b) => b.addEventListener("click", () => answerQuiz(+b.dataset.i)));
}

function answerQuiz(i) {
  if (quiz.answered) return;
  quiz.answered = true;
  const q = quiz.qs[quiz.idx];
  const correct = q.opts[i].id === q.p.id;
  $$(".q-opt").forEach((b, bi) => {
    b.disabled = true;
    if (q.opts[bi].id === q.p.id) b.classList.add("correct");
    else if (bi === i) b.classList.add("wrong");
  });
  const fb = $("#q-feedback");
  fb.classList.remove("hidden", "ok", "no");
  const u = currentUser();
  if (correct) {
    quiz.score++;
    addXp(u, XP.quiz);
    fb.textContent = "Chính xác! +3 XP ⭐";
    fb.classList.add("ok");
    bounceMascot(true);
  } else {
    fb.innerHTML = `Gần rồi! Đáp án là <b>${esc(q.p.jp)}</b> (${esc(q.p.ro)}) — đọc kiểu Việt: <b>${esc(q.p.vn)}</b>`;
    fb.classList.add("no");
    bounceMascot(false);
  }
  saveStore();
  $("#quiz-score").textContent = quiz.score;
  $("#q-next").classList.remove("hidden");
  if (correct) $("#q-next").focus();
}

function nextQuestion() {
  const u = currentUser();
  quiz.idx++;
  if (quiz.idx >= quiz.qs.length) {
    touchStreak(u);
    let bonus = 0;
    if (quiz.score === quiz.qs.length) { bonus = XP.perfectBonus; addXp(u, bonus); }
    u.bestQuiz = Math.max(u.bestQuiz ?? -1, quiz.score);
    saveStore();
    $("#quiz-play").classList.add("hidden");
    $("#quiz-done").classList.remove("hidden");
    const s = quiz.score;
    $("#quiz-result-title").textContent =
      s === 10 ? "Hoàn hảo! スゴイ! 🏆" : s >= 7 ? "Tuyệt vời! よくできました! 🎉" : s >= 4 ? "Khá ổn! がんばって! 💪" : "Lần sau sẽ tốt hơn! 😊";
    $("#quiz-result-detail").innerHTML =
      `Bạn đúng <b>${s}/${quiz.qs.length}</b> câu · nhận <b>+${s * XP.quiz + bonus} XP</b> ⭐` +
      (bonus ? ` (gồm +10 XP hoàn hảo 🌟)` : "") +
      `<br>Kỷ lục: <b>${u.bestQuiz}/10</b> · Chuỗi học <b>${u.streakCount || 0} ngày</b> 🔥`;
    renderUserChip();
  } else {
    showQuestion();
  }
}

/* ---------------- NHÓM & BẢNG VÀNG ---------------- */
function renderGroup() {
  const u = currentUser();
  $("#guest-banner").innerHTML = u.guest
    ? `<div class="card guest-banner">🙋‍♂️ Bạn đang học với tư cách <b>Khách</b> (${seenCount(u)} thẻ đã học, ${u.xp || 0} XP). Điền form bên dưới — <b>toàn bộ tiến trình sẽ được mang theo</b> lên bảng vàng!</div>`
    : "";
  renderEmojiPicker();
  renderLeaderboard();
}

function renderEmojiPicker() {
  const grid = $("#emoji-grid");
  if (!grid.dataset.built) {
    grid.innerHTML = EMOJIS.map((e) => `<button type="button" class="emoji-opt ${e === selectedEmoji ? "sel" : ""}" data-e="${e}">${e}</button>`).join("");
    $$(".emoji-opt").forEach((b) =>
      b.addEventListener("click", () => {
        selectedEmoji = b.dataset.e;
        $$(".emoji-opt").forEach((x) => x.classList.toggle("sel", x === b));
      })
    );
    grid.dataset.built = "1";
  }
}

function renderLeaderboard() {
  const board = $("#leaderboard");
  const u = currentUser();
  const realUsers = store.users.filter((x) => !x.guest);
  if (!realUsers.length) {
    board.innerHTML = `<p class="muted center">Chưa ai lên bảng cả! Người đầu tiên sẽ được 🥇 luôn nè.<br><small>Học khách vẫn được — tiến trình mang theo được mà!</small></p>`;
    return;
  }
  const sorted = [...realUsers].sort((a, b) => (b.xp || 0) - (a.xp || 0) || masteredCount(b) - masteredCount(a));
  board.innerHTML = sorted.map((x, i) => {
    const medals = ["🥇", "🥈", "🥉"];
    const rank = medals[i] || `<span class="muted">#${i + 1}</span>`;
    const color = AVA_COLORS[x.id.charCodeAt(x.id.length - 1) % AVA_COLORS.length];
    return `
      <div class="lb-row ${i === 0 ? "top1" : ""} ${u && x.id === u.id ? "me" : ""}" data-uid="${x.id}" title="Bấm để đổi sang người này">
        <div class="lb-rank">${rank}</div>
        <div class="lb-ava" style="background:${color}">${x.emoji}</div>
        <div class="lb-info">
          <div class="lb-name">${esc(x.name)}${u && x.id === u.id ? '<span class="lb-tag">ĐANG HỌC</span>' : ""}</div>
          <div class="lb-sub">🎴 ${masteredCount(x)} thẻ · 🔥 ${x.streakCount || 0} ngày · 📝 ${x.bestQuiz != null ? x.bestQuiz + "/10" : "—"}</div>
        </div>
        <div class="lb-xp">${x.xp || 0} XP</div>
      </div>`;
  }).join("");
  $$(".lb-row").forEach((r) =>
    r.addEventListener("click", () => {
      store.activeUserId = r.dataset.uid;
      saveStore();
      renderUserChip();
      renderLeaderboard();
      showToast(`Đã đổi sang hồ sơ của ${store.users.find((x) => x.id === r.dataset.uid).name} 👋`);
    })
  );
}

function joinGroup(ev) {
  ev.preventDefault();
  const cu = currentUser();
  const isGuest = !!(cu && cu.guest);
  const name = $("#join-name").value.trim();
  const phone = $("#join-phone").value.trim();
  if (!name) { showToast("Cho mình xin tên của bạn nhé!"); return; }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) { showToast("Số điện thoại cần ít nhất 8 chữ số nhé!"); return; }

  const carry = isGuest ? {
    cards: cu.cards, xp: cu.xp, streakCount: cu.streakCount,
    lastStudyDay: cu.lastStudyDay, bestQuiz: cu.bestQuiz,
  } : null;

  // SĐT đã tồn tại → coi như đăng nhập lại, chuyển tiến trình khách (nếu có) sang
  const existing = store.users.find((x) => !x.guest && x.phone.replace(/\D/g, "") === digits);
  if (existing) {
    if (carry) {
      Object.assign(existing, carry);
      store.users = store.users.filter((x) => !x.guest);
    }
    store.activeUserId = existing.id;
    saveStore();
    renderUserChip();
    renderLeaderboard();
    showToast(carry ? `Mang tiến trình của bạn vào hồ sơ ${existing.name} rồi! 🎒` : `Chào mừng quay lại, ${existing.name}! 👋`);
    $("#join-form").reset();
    return;
  }

  const user = {
    id: "u" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    name, phone, emoji: selectedEmoji,
    xp: 0, streakCount: 0, lastStudyDay: null,
    cards: {}, bestQuiz: null, joined: new Date().toISOString(),
  };
  if (carry) {
    Object.assign(user, carry);
    store.users = store.users.filter((x) => !x.guest);
    showToast(`Chào ${name}! Tiến trình đã được mang theo lên bảng vàng 🎒🏆`);
  } else {
    showToast(`Chào ${name}! Bạn đã vào bảng vàng 🏆`);
  }
  store.users.push(user);
  store.activeUserId = user.id;
  saveStore();
  renderUserChip();
  renderGroup();
  $("#join-form").reset();
}

/* ---------------- TIẾN TRÌNH ---------------- */
function renderProgress() {
  const body = $("#progress-body");
  const u = currentUser();
  const li = currentLesson(u);
  const mastered = masteredCount(u);
  const seen = seenCount(u);

  const lessonRows = CURRICULUM.map((day, di) => {
    const lv = LEVELS[dayLevel(di) - 1];
    const total = day.length;
    const doneN = day.filter((i) => i.id in (u.cards || {})).length;
    const state = doneN === 0 ? (di === li ? "now" : "todo") : doneN === total ? "done" : "doing";
    const icon = state === "done" ? "✅" : state === "now" ? "▶️" : state === "doing" ? "🔶" : "⚪";
    const label = state === "done" ? "Xong" : state === "now" ? "Đang học" : doneN > 0 ? `${doneN}/${total}` : "Chưa tới";
    return `<div class="lesson-row ${state}">
      <span class="lr-icon">${icon}</span>
      <span class="lr-day">Ngày ${di + 1}</span>
      <span class="lr-lv">${lv.emoji}</span>
      <span class="lr-count">${total} thẻ</span>
      <span class="lr-state">${label}</span>
    </div>`;
  }).join("");

  const badges = [
    { icon: "🌱", name: "Bắt đầu học", won: seen > 0 },
    { icon: "🎴", name: "20 thẻ thuộc lòng", won: mastered >= 20 },
    { icon: "🏯", name: "80 thẻ thuộc lòng", won: mastered >= 80 },
    { icon: "🗻", name: "374 thẻ — cả kế hoạch!", won: seen >= ALL_ITEMS.length },
    { icon: "⚡", name: "200 XP", won: (u.xp || 0) >= 200 },
    { icon: "🔥", name: "Chuỗi 3 ngày", won: (u.streakCount || 0) >= 3 },
    { icon: "⛩️", name: "Chuỗi 7 ngày", won: (u.streakCount || 0) >= 7 },
    { icon: "🧠", name: "Trắc nghiệm 10/10", won: u.bestQuiz === 10 },
  ];

  body.innerHTML = `
    <div class="card">
      <div class="lb-row me" style="cursor:default">
        <div class="lb-ava" style="width:54px;height:54px;font-size:28px;background:${AVA_COLORS[u.id.charCodeAt(u.id.length - 1) % AVA_COLORS.length]}">${u.emoji}</div>
        <div class="lb-info">
          <div class="lb-name" style="font-size:18px">${u.guest ? "Khách (chưa đặt tên)" : esc(u.name)} · Hạng XP ${xpLevel(u)}</div>
          <div class="lb-sub">${u.guest ? "Tiến trình lưu trên máy này — đặt tên ở menu Nhóm để lên bảng vàng" : "SĐT: " + maskedPhone(u.phone) + " 🔒"}</div>
        </div>
      </div>
      <div class="stat-tiles">
        <div class="stat-tile"><div class="num">${seen}/${ALL_ITEMS.length}</div><div class="lbl">Thẻ đã học 🎴</div></div>
        <div class="stat-tile"><div class="num">${mastered}</div><div class="lbl">Thuộc lòng 💪</div></div>
        <div class="stat-tile"><div class="num">${u.streakCount || 0}</div><div class="lbl">Chuỗi ngày 🔥</div></div>
        <div class="stat-tile"><div class="num">${u.xp || 0}</div><div class="lbl">Tổng XP ⭐</div></div>
        <div class="stat-tile"><div class="num">${u.bestQuiz != null ? u.bestQuiz + "/10" : "—"}</div><div class="lbl">Trắc nghiệm 📝</div></div>
      </div>
      <h3>🗓️ Lộ trình 10 ngày</h3>
      <p class="muted small">Ngày 1-5: 🌱 Cấp 1 · Ngày 6-8: 🌸 Cấp 2 · Ngày 9-10: 🌺 Cấp 3. Học xong ngày nào mở ngày đó — có thể học sớm hơn kế hoạch!</p>
      <div class="lesson-list">${lessonRows}</div>
      <h3 style="margin-top:18px">Thành tích</h3>
      <div class="badge-row">${badges.map((b) => `<span class="badge ${b.won ? "won" : ""}">${b.icon} ${b.name}</span>`).join("")}</div>
    </div>
    <p class="center small muted">
      <a id="teacher-unlock" style="cursor:pointer;color:var(--pink-deep)">👩‍🏫 Dạy nhóm học? Mở khóa toàn bộ 10 ngày</a>
       · <a id="reset-progress" style="cursor:pointer;color:var(--ink-soft)">Đặt lại tiến trình</a>
    </p>`;
  $("#teacher-unlock").addEventListener("click", () => {
    if (store.unlockAll) { store.unlockAll = false; saveStore(); showToast("Đã khóa lại theo kế hoạch 🔒"); }
    else { store.unlockAll = true; saveStore(); showToast("Đã mở khóa toàn bộ 10 ngày! 🌸🌺"); }
    renderProgress();
  });
  const resetBtn = $("#reset-progress");
  let armed = false;
  resetBtn.addEventListener("click", () => {
    if (!armed) { armed = true; resetBtn.textContent = "Bấm lần nữa để XÁC NHẬN xóa tiến trình"; return; }
    const u2 = currentUser();
    u2.cards = {}; u2.xp = 0; u2.streakCount = 0; u2.lastStudyDay = null; u2.bestQuiz = null;
    saveStore();
    showToast("Đã đặt lại tiến trình — bắt đầu lại Ngày 1 🌱");
    renderProgress();
  });
}

/* ---------------- MASCOT & CHIP ---------------- */
function drawMascots() {
  const html = `<div class="onigiri-body"></div><div class="onigiri-nori"></div><div class="face"><div class="eyes"></div><div class="mouth"></div><div class="cheeks"></div></div>`;
  $$(".mascot").forEach((m) => { if (!m.dataset.built) { m.innerHTML = html; m.dataset.built = "1"; } });
}
function bounceMascot(good) {
  const m = $(".mascot.cheer");
  if (!m) return;
  m.classList.toggle("cheer", good);
  m.animate(
    [{ transform: "translateY(0)" }, { transform: "translateY(-14px) scale(1.06)" }, { transform: "translateY(0)" }],
    { duration: 420, easing: "ease-out" }
  );
}
function renderUserChip() {
  const u = currentUser();
  const chip = $("#user-chip");
  if (!u) { chip.classList.remove("show"); return; }
  chip.classList.add("show");
  const color = AVA_COLORS[u.id.charCodeAt(u.id.length - 1) % AVA_COLORS.length];
  chip.innerHTML = `<span class="uc-emoji" style="background:${color}">${u.emoji}</span> ${u.guest ? "Khách" : esc(u.name)}`;
}

/* ---------------- HOA ANH ĐÀO RƠI ---------------- */
function sprinklePetals() {
  const layer = $("#sakura-layer");
  for (let i = 0; i < 14; i++) {
    const p = document.createElement("div");
    p.className = "petal";
    const size = 8 + Math.random() * 12;
    p.style.cssText = `left:${Math.random() * 100}vw;width:${size}px;height:${size * 0.85}px;
      animation-duration:${9 + Math.random() * 10}s;animation-delay:-${Math.random() * 15}s;`;
    layer.appendChild(p);
  }
}

/* ---------------- KHỞI ĐỘNG ---------------- */
function init() {
  loadStore();
  ensureUser();
  drawMascots();
  sprinklePetals();
  initCheat();
  renderUserChip();

  // menu ☰
  $("#menu-btn").addEventListener("click", () => {
    const m = $("#menu-overlay");
    m.classList.contains("hidden") ? openMenu() : closeMenu();
  });
  $("#menu-overlay").addEventListener("click", (ev) => { if (ev.target.id === "menu-overlay") closeMenu(); });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") closeMenu(); });

  // chuyển view qua data-view (menu, brand, nút bấm)
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-view]");
    if (!btn) return;
    ev.preventDefault();
    showView(btn.dataset.view);
  });

  // thẻ ghi nhớ
  $("#flashcard").addEventListener("click", (ev) => {
    if (ev.target.closest("#fc-speak") || ev.target.closest("#fc-ex-speak") || ev.target.closest("#units-toggle") || ev.target.closest("#fc-units")) return;
    if (session && !session.finished) flipCard();
  });
  $("#units-toggle").addEventListener("click", () => {
    const el = $("#fc-units");
    el.classList.toggle("hidden");
    $("#units-toggle").textContent = el.classList.contains("hidden") ? "🔬 Từng chữ → phát âm ▾" : "🔬 Thu gọn ▴";
  });
  $("#fc-speak").addEventListener("click", (ev) => { ev.stopPropagation(); if (session) speak(session.cards[session.idx].jp); });
  $("#fc-ex-speak").addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (session) { const p = session.cards[session.idx]; if (p.ex) speak(p.ex.jp); }
  });
  $$(".btn-rate").forEach((b) => b.addEventListener("click", (ev) => { ev.stopPropagation(); rateCard(+b.dataset.rate); }));
  $("#session-back").addEventListener("click", () => {
    session = null;
    showView("hoc");
    showToast("Đã lưu phần bạn vừa học — quay lại học tiếp bất cứ lúc nào!");
  });

  // tự chọn chủ đề
  $("#picker-toggle").addEventListener("click", () => {
    const p = $("#topic-picker");
    p.classList.toggle("hidden");
    if (!p.classList.contains("hidden")) { renderTopicPicker(); p.scrollIntoView({ behavior: "smooth", block: "start" }); }
  });

  // trắc nghiệm
  $("#quiz-start").addEventListener("click", startQuiz);
  $("#quiz-replay").addEventListener("click", () => { quiz = null; renderQuizHome(); });
  $("#quiz-quit").addEventListener("click", () => { quiz = null; renderQuizHome(); });
  $("#q-next").addEventListener("click", nextQuestion);
  $("#q-speak").addEventListener("click", () => { if (quiz) speak(quiz.qs[quiz.idx].p.jp); });

  // nhóm
  $("#join-form").addEventListener("submit", joinGroup);
  $("#user-chip").addEventListener("click", () => showView("group"));

  if ("speechSynthesis" in window) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); }

  // ⭐ mở app là thấy ngay màn học
  showView("hoc");
}

document.addEventListener("DOMContentLoaded", init);
