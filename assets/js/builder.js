"use strict";
/* builder.js — Ghép câu thu hẹp dần: mỗi lựa chọn chỉ mở ra những bước hợp lệ tiếp theo.
   Không phải bài kiểm tra: người dùng chọn nghĩa tiếng Việt, app dựng câu tiếng Nhật,
   phiên âm và giải thích trợ từ theo thời gian thực. */

(function () {
  const QJ = window.QJ;
  const U = window.U;
  const A = window.QJAssemble;   // logic ráp câu thuần — assets/js/assemble.js
  const view = document.getElementById("view");

  const state = {
    intent: null,
    scenario: null,   // tình huống “nghe & đáp” (nhân viên nói trước)
    picks: [],   // { stepId, option }
    stepId: null,
  };

  /* ------------------------------ Điều hướng ------------------------------ */

  const GROUP_ICONS = {
    "Giao tiếp cơ bản": "💬",
    "Ăn uống, mua sắm & thanh toán": "🍜",
    "Đi lại & khách sạn": "🚕",
    "Sự cố & sức khỏe": "🚑",
  };
  // Thứ tự nhóm cố định: cơ bản nhất trước
  const GROUP_ORDER = ["Giao tiếp cơ bản", "Ăn uống, mua sắm & thanh toán", "Đi lại & khách sạn", "Sự cố & sức khỏe"];

  // Việc thường cần ngay — chip đầu trang chủ mở thẳng cây tương ứng
  const QUICK_GOALS = [
    { id: "i-please", emoji: "🍜", label: "Gọi món / mua" },
    { id: "i-pay", emoji: "💴", label: "Thanh toán" },
    { id: "i-where", emoji: "🗺️", label: "Hỏi đường" },
    { id: "i-health", emoji: "🚑", label: "Cần giúp gấp" },
    { id: "i-courtesy", emoji: "🙏", label: "Cảm ơn / xin lỗi" },
    { id: "i-greet", emoji: "👋", label: "Chào hỏi" },
  ];

  function renderHome(focusFirst = false) {
    state.intent = null;
    state.picks = [];
    state.stepId = null;
    state.scenario = null;
    const intents = QJ.intents.intents;
    const groups = [];
    for (const i of intents) {
      const g = i.group || "Khác";
      if (!groups.includes(g)) groups.push(g);
    }
    groups.sort((a, b) => {
      const ia = GROUP_ORDER.indexOf(a);
      const ib = GROUP_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    const sections = groups.map(g => `
      <div class="section-title">
        <h2>${GROUP_ICONS[g] || "🧩"} ${U.esc(g)}</h2>
      </div>
      <div class="intent-grid">
        ${intents.filter(i => (i.group || "Khác") === g).map(i => `
          <button class="intent-card" data-intent="${i.id}">
            <span class="emoji">${i.emoji}</span>
            <b>${U.esc(i.label)}</b>
            <span>${U.esc(i.desc)}</span>
          </button>`).join("")}
      </div>`).join("");

    const scenarios = (QJ.exchanges && QJ.exchanges.scenarios) || [];
    const scenarioSection = scenarios.length ? `
      <div class="section-title">
        <h2>🗣️ Người Nhật nói trước</h2>
        <span class="desc">${scenarios.length} tình huống — nghe/đọc câu họ nói và câu mình đáp</span>
      </div>
      <div class="intent-grid">
        ${scenarios.map(s => `
          <button class="intent-card" data-scenario="${s.id}">
            <span class="emoji">${s.emoji}</span>
            <b>${U.esc(s.label)}</b>
            <span>${U.esc(s.desc)}</span>
          </button>`).join("")}
      </div>` : "";

    view.innerHTML = `
      <div class="section-title">
        <h2>🧩 Ghép câu</h2>
        <span class="desc">${intents.length} mục — chọn từng bước, app chỉ hiện những gì nối tiếp được</span>
      </div>
      <div class="section-title">
        <h2>⚡ Chọn nhanh</h2>
        <span class="desc">Việc thường cần ngay</span>
      </div>
      <div class="quick-grid">
        ${QUICK_GOALS.map(g => `
          <button class="quick-chip" data-intent="${g.id}">
            <span>${g.emoji}</span> ${U.esc(g.label)}
          </button>`).join("")}
      </div>
      ${sections}
      ${scenarioSection}
      <p style="font-size:13px;color:var(--muted);margin-top:14px">
        Mẹo: bấm ⚡ Chọn nhanh, hoặc chọn “Không cần chủ ngữ” → “muốn” → món ăn… App sẽ tự đặt trợ từ
        đúng (は, が, を, に…), hiện phiên âm và bóc tách câu theo vai trò ngữ pháp.
      </p>`;
    view.querySelectorAll("[data-intent]").forEach(btn =>
      btn.addEventListener("click", () =>
        startIntent(QJ.intents.intents.find(i => i.id === btn.dataset.intent))
      )
    );
    view.querySelectorAll("[data-scenario]").forEach(btn =>
      btn.addEventListener("click", () => startScenario(btn.dataset.scenario))
    );
    const status = document.getElementById("status");
    if (status) status.textContent = "";
    if (focusFirst) view.querySelector(".quick-chip, .intent-card")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }

  function startIntent(intent) {
    state.intent = intent;
    state.scenario = null;
    state.picks = [];
    state.stepId = intent.start;
    renderBuilder();
    focusPrompt();
  }

  function startScenario(id) {
    const scenario = ((QJ.exchanges && QJ.exchanges.scenarios) || []).find(s => s.id === id);
    if (!scenario) return;
    state.intent = null;
    state.picks = [];
    state.stepId = null;
    state.scenario = scenario;
    renderScenario();
  }

  const currentStep = () => state.intent.steps[state.stepId];

  /* Sau mỗi lần vẽ lại, đưa focus về câu hỏi kế tiếp để người dùng bàn phím
     không phải tab lại từ đầu; câu đã xong thì focus vào nút nghe.
     Nội dung câu được đọc qua vùng #status. */
  function focusPrompt() {
    const prompt = view.querySelector(".b-prompt");
    if (prompt && prompt.textContent.trim()) prompt.focus({ preventScroll: true });
    else view.querySelector(".b-actions .primary")?.focus({ preventScroll: true });
  }

  function pick(option) {
    state.picks.push({ stepId: state.stepId, option });
    state.stepId = option.next;   // null = hoàn thành
    renderBuilder();
    focusPrompt();
    document.querySelector(".b-sentence")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function back() {
    const last = state.picks.pop();
    state.stepId = last ? last.stepId : state.intent.start;
    renderBuilder();
    focusPrompt();
  }

  function reset() {
    state.picks = [];
    state.stepId = state.intent.start;
    renderBuilder();
    focusPrompt();
  }

  function randomPath() {
    state.picks = [];
    state.stepId = state.intent.start;
    let guard = 0;
    while (state.stepId && guard++ < 10) {
      const opts = state.intent.steps[state.stepId].options;
      const meaty = opts.filter(o => !o.silent);
      const pool = meaty.length && Math.random() > 0.3 ? meaty : opts;
      const opt = pool[Math.floor(Math.random() * pool.length)];
      state.picks.push({ stepId: state.stepId, option: opt });
      state.stepId = opt.next;
    }
    renderBuilder();
    focusPrompt();
  }

  /* ------------------------------ Dựng câu ------------------------------ */

  function sentenceHtml(parts) {
    return parts.map(part => {
      if (part.kind === "blank") return `<span class="blank" title="Chưa chọn">…</span>`;
      if (part.kind === "text") {
        const t = part.text;
        if (t.text && t.kana && t.text !== t.kana) {
          return `<ruby lang="ja">${U.esc(t.text)}<rt>${U.esc(t.kana)}</rt></ruby>`;
        }
        return U.esc(t.text);
      }
      const o = part.opt;
      let html = U.esc(o.jp);
      if (o.jp && o.kana && o.jp !== o.kana) {
        html = `<ruby lang="ja">${U.esc(o.jp)}<rt>${U.esc(o.kana)}</rt></ruby>`;
      }
      if (part.particle) {
        html += `<span class="particle" title="${U.esc(part.particle.vi)}">${U.esc(part.particle.jp)}</span>`;
      }
      return html;
    }).join("");
  }

  /* Bảng bóc tách câu: từng mảnh + loại từ/thể + trợ từ kèm giải thích */
  function optionNote(part) {
    const o = part.opt;
    if (o.posVi && o.formNote) return `${o.posVi}, ${o.formNote}`;
    return o.posVi || o.formNote || o.note || "";
  }

  function tokenRowHtml(t) {
    return `<div class="brk-row role-${U.esc(t.role || "expression")}${t.isParticle ? " particle-row" : ""}">
      <div class="brk-jp" lang="ja">${U.esc(t.jp)}${t.kana && t.kana !== t.jp ? `<small>${U.esc(t.kana)}</small>` : ""}</div>
      <div class="brk-body">
        <span class="brk-pron">${U.esc(t.viPron || "")}</span>
        <span class="brk-roma">${U.esc(t.roma || "")}</span>
        <span class="brk-vi">${U.esc(t.vi || "—")}${t.note ? ` · <em>${U.esc(t.note)}</em>` : ""}</span>
      </div>
    </div>`;
  }

  function optionRowHtml(o) {
    const note = o._note || "";
    return `<div class="brk-row role-${U.esc(o.role || "expression")}">
      <div class="brk-jp" lang="ja">${U.esc(o.jp)}${o.kana && o.kana !== o.jp ? `<small>${U.esc(o.kana)}</small>` : ""}</div>
      <div class="brk-body">
        <span class="brk-pron">${U.esc(o.viPron || "")}</span>
        <span class="brk-roma">${U.esc(o.roma || "")}</span>
        <span class="brk-vi">${U.esc(o.viLabel || o.vi || "")}${note ? ` · <em>${U.esc(note)}</em>` : ""}</span>
      </div>
    </div>`;
  }

  function textRowHtml(t) {
    return `<div class="brk-row role-${U.esc(t.role || "expression")}">
      <div class="brk-jp" lang="ja">${U.esc(t.text)}${t.kana && t.kana !== t.text ? `<small>${U.esc(t.kana)}</small>` : ""}</div>
      <div class="brk-body">
        <span class="brk-pron">${U.esc(t.viPron || "")}</span>
        <span class="brk-roma">${U.esc(t.roma || "")}</span>
        <span class="brk-vi">${U.esc(t.vi || "—")}</span>
      </div></div>`;
  }

  function structureHtml(parts) {
    const rows = parts.map(part => {
      if (part.kind === "blank") {
        return `<div class="brk-row"><div class="brk-jp" lang="ja">…</div>
          <div class="brk-body"><span class="brk-vi" style="color:var(--muted)">Chưa chọn</span></div></div>`;
      }
      // Dấu ngăn "。" do engine chèn giữa hai mảnh cố định: không cần thành dòng riêng
      if (part.kind === "text" && !part.text.vi) return "";
      if (part.kind === "text") return textRowHtml(part.text);
      const o = part.opt;
      // Option cố định đã được tách mảnh ở build: hiện từng mảnh (như thẻ cụm từ)
      let html = Array.isArray(o.parts) && o.parts.length
        ? o.parts.map(tokenRowHtml).join("")
        : optionRowHtml({ ...o, _note: optionNote(part) });
      if (part.particle) html += tokenRowHtml(part.particle);
      return html;
    }).join("");
    const hasContent = parts.some(p => p.kind !== "blank");
    if (!hasContent) return "";
    return `<div class="brk b-brk"><div class="brk-title">🧩 Cấu trúc câu</div>${rows}</div>`;
  }

  /* ------------------------------ Nghe & đáp ------------------------------ */

  function rubyHtml(jp, kana) {
    if (jp && kana && jp !== kana) return `<ruby lang="ja">${U.esc(jp)}<rt>${U.esc(kana)}</rt></ruby>`;
    return U.esc(jp);
  }

  function speakBtn(jp) {
    return `<button class="icon-btn" data-speak="${U.esc(jp)}" title="Nghe" aria-label="Nghe">🔊</button>`;
  }

  function answerHtml(line) {
    return `<div class="exc-answer">
      <div class="exc-answer-body">
        <div class="line-jp" lang="ja">${rubyHtml(line.jp, line.kana)}</div>
        <div class="line-pron">${U.esc(line.viPron || "")}<span class="roma"> · ${U.esc(line.roma || "")}</span></div>
        <div class="line-vi">${U.esc(line.vi)}</div>
      </div>
      ${speakBtn(line.jp)}
    </div>`;
  }

  function renderScenario() {
    const s = state.scenario;
    view.innerHTML = `
      <div class="b-top">
        <button class="back" data-b="home">← Đổi mục tiêu</button>
        <div class="b-title">${s.emoji} ${U.esc(s.label)}</div>
      </div>
      <div class="b-prompt" tabindex="-1">${U.esc(s.desc)} — nghe/đọc câu nhân viên rồi chọn câu mình đáp.</div>
      ${s.exchanges.map(ex => `
        <div class="exc">
          <div class="exc-row">
            <div class="exc-body">
              <div class="exc-who">🗣️ Nhân viên</div>
              <div class="line-jp big" lang="ja">${rubyHtml(ex.heard.jp, ex.heard.kana)}</div>
              <div class="line-pron">${U.esc(ex.heard.viPron || "")}<span class="roma"> · ${U.esc(ex.heard.roma || "")}</span></div>
              <div class="line-vi">${U.esc(ex.heard.vi)}</div>
            </div>
            ${speakBtn(ex.heard.jp)}
          </div>
          ${ex.note ? `<div class="note">${U.esc(ex.note)}</div>` : ""}
          ${ex.answers.length ? `
            <div class="exc-answers-title">🗨️ Bạn có thể đáp</div>
            ${ex.answers.map(answerHtml).join("")}` : ""}
        </div>`).join("")}
    `;
    view.querySelectorAll("[data-b]").forEach(btn =>
      btn.addEventListener("click", () => { if (btn.dataset.b === "home") renderHome(true); })
    );
    view.querySelectorAll("[data-speak]").forEach(btn =>
      btn.addEventListener("click", () => U.speak(btn.dataset.speak))
    );
    const status = document.getElementById("status");
    if (status) status.textContent = `${s.label}: ${s.desc}`;
    focusPrompt();
  }

  /* ------------------------------ Giao diện ------------------------------ */

  function renderBuilder() {
    const intent = state.intent;
    const step = state.stepId ? currentStep() : null;
    const { parts, vi: rawVi } = A.assemble(intent, state.picks);
    const vi = U.capitalize(rawVi);
    const done = !state.stepId;
    const started = state.picks.length > 0;

    const crumbs = state.picks.map(p =>
      `<span class="crumb">${U.esc(p.option.label || p.option.viLabel || "…")}</span>`
    ).join("");

    const chips = step
      ? step.options.map((o, idx) => {
          const label = o.label || o.viLabel || o.jp;
          const sub = o.jp
            ? `${o.jp}${o.kana && o.kana !== o.jp ? "　" + o.kana : ""}`
            : "";
          return `<button class="opt" data-opt="${idx}">
            <b>${U.esc(label)}</b>
            ${sub ? `<small>${U.esc(sub)}</small>` : ""}
            ${o.hint ? `<span class="vi">${U.esc(o.hint)}</span>` : ""}
          </button>`;
        }).join("")
      : "";

    // Bước có nhiều lựa chọn (món ăn, địa điểm…): thêm ô lọc nhanh
    const filterable = !!step && step.options.length > 12;
    const filterHtml = filterable
      ? `<input id="opt-filter" class="search opt-filter" type="search" aria-label="Lọc lựa chọn"
           placeholder="Lọc nhanh trong ${step.options.length} lựa chọn…">`
      : "";

    const notes = [...new Set(state.picks.map(p => p.option.note).filter(Boolean))];

    const actions = done
      ? `<div class="b-actions">
          <button class="primary" data-b="speak">🔊 Nghe</button>
        </div>`
      : "";

    // Chưa chọn gì: gợi ý thay vì khung câu rỗng hoặc toàn dấu "…"
    const jpHtml = !started && !done
      ? `<span class="b-empty">👇 Chọn bên dưới để ghép câu</span>`
      : sentenceHtml(parts);

    // Câu xong: gợi ý những gì người Nhật có thể đáp lại
    const replies = intent.replies || [];
    const repliesHtml = done && replies.length ? `
      <div class="reply-card">
        <div class="reply-title">🗣️ Người Nhật có thể nói</div>
        ${replies.map(r => `
          <div class="reply-row">
            <div class="reply-body">
              <div class="line-jp" lang="ja">${rubyHtml(r.jp, r.kana)}</div>
              <div class="line-pron">${U.esc(r.viPron || "")}<span class="roma"> · ${U.esc(r.roma || "")}</span></div>
              <div class="line-vi">${U.esc(r.vi)}</div>
            </div>
            ${speakBtn(r.jp)}
          </div>`).join("")}
      </div>` : "";

    view.innerHTML = `
      <div class="b-top">
        <button class="back" data-b="home">← Đổi mục tiêu</button>
        <div class="b-title">${intent.emoji} ${U.esc(intent.label)}</div>
        <div class="b-tools">
          <button data-b="back" title="Bỏ bước vừa chọn">⌫</button>
          <button data-b="reset" title="Làm lại từ đầu">↺</button>
          <button data-b="random" title="Câu ngẫu nhiên">🎲</button>
        </div>
      </div>

      <div class="b-crumbs">${crumbs}</div>

      <div class="b-sentence">
        ${done ? `<span class="done-badge">✓ Câu đã sẵn sàng</span>` : ""}
        <div class="b-jp" lang="ja">${jpHtml}</div>
        <div class="b-pron">${started || done ? U.esc(A.pronLine(parts)) : ""}</div>
        <div class="b-roma">${started || done ? U.esc(A.romaLine(parts)) : ""}</div>
        <div class="b-vi">${U.esc(vi)}</div>
        ${actions}
        ${done && intent.tip ? `<div class="note" style="margin-top:10px">${U.esc(intent.tip)}</div>` : ""}
        ${structureHtml(parts)}
      </div>

      ${repliesHtml}

      <div class="b-prompt" tabindex="-1">${step ? U.esc(step.prompt) : ""}</div>
      ${filterHtml}
      <div class="opt-grid">${chips}</div>
      ${filterable ? `<div class="empty opt-empty" hidden>Không có lựa chọn khớp.</div>` : ""}
      ${notes.length ? `<div class="b-notes">${notes.map(n => `<div class="b-note">ℹ️ ${U.esc(n)}</div>`).join("")}</div>` : ""}
    `;

    view.querySelectorAll("[data-opt]").forEach(btn =>
      btn.addEventListener("click", () => pick(currentStep().options[Number(btn.dataset.opt)]))
    );

    view.querySelectorAll("[data-speak]").forEach(btn =>
      btn.addEventListener("click", () => U.speak(btn.dataset.speak))
    );

    const filter = view.querySelector("#opt-filter");
    if (filter) {
      const opts = [...view.querySelectorAll(".opt")];
      const empty = view.querySelector(".opt-empty");
      filter.addEventListener("input", () => {
        const q = filter.value.trim().toLowerCase();
        let shown = 0;
        for (const o of opts) {
          const hit = !q || o.textContent.toLowerCase().includes(q);
          o.hidden = !hit;
          if (hit) shown += 1;
        }
        if (empty) empty.hidden = shown > 0;
      });
    }

    view.querySelectorAll("[data-b]").forEach(btn =>
      btn.addEventListener("click", () => {
        const b = btn.dataset.b;
        if (b === "home") renderHome(true);
        else if (b === "back") back();
        else if (b === "reset") reset();
        else if (b === "random") randomPath();
        else if (b === "speak") U.speak(A.jpText(parts));
      })
    );

    // Thông báo ngắn cho trình đọc màn hình (thay aria-live toàn trang)
    const status = document.getElementById("status");
    if (status) {
      const stop = /[.!?…]$/.test(vi) ? "" : ".";
      status.textContent = done
        ? `Câu đã sẵn sàng: ${vi}`
        : started
          ? `Câu hiện tại: ${vi}${stop} ${step ? step.prompt : ""}`
          : (step ? step.prompt : "");
    }
  }

  window.Builder = {
    open: () => (state.intent ? renderBuilder() : state.scenario ? renderScenario() : renderHome()),
    startWith: (id) => {
      const intent = QJ.intents.intents.find(i => i.id === id);
      if (intent) startIntent(intent);
    },
  };
})();
