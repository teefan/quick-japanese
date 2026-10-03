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
    picks: [],   // { stepId, option }
    stepId: null,
  };

  /* ------------------------------ Điều hướng ------------------------------ */

  const GROUP_ICONS = {
    "Giao tiếp": "💬",
    "Ăn uống & mua sắm": "🍜",
    "Đi lại & khách sạn": "🚕",
    "Sức khỏe & sự cố": "🚑",
  };
  // Thứ tự nhóm cố định: cơ bản nhất trước
  const GROUP_ORDER = ["Giao tiếp", "Ăn uống & mua sắm", "Đi lại & khách sạn", "Sức khỏe & sự cố"];

  function renderHome(focusFirst = false) {
    state.intent = null;
    state.picks = [];
    state.stepId = null;
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

    view.innerHTML = `
      <div class="section-title">
        <h2>🧩 Ghép câu</h2>
        <span class="desc">${intents.length} mục — chọn từng bước, app chỉ hiện những gì nối tiếp được</span>
      </div>
      ${sections}
      <p style="font-size:13px;color:var(--muted);margin-top:14px">
        Mẹo: chọn “Tôi” → “muốn” → món ăn… App sẽ tự đặt trợ từ đúng
        (は, が, を, に…), hiện phiên âm và bóc tách câu theo vai trò ngữ pháp.
      </p>`;
    view.querySelectorAll("[data-intent]").forEach(btn =>
      btn.addEventListener("click", () =>
        startIntent(QJ.intents.intents.find(i => i.id === btn.dataset.intent))
      )
    );
    const status = document.getElementById("status");
    if (status) status.textContent = "";
    if (focusFirst) view.querySelector(".intent-card")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }

  function startIntent(intent) {
    state.intent = intent;
    state.picks = [];
    state.stepId = intent.start;
    renderBuilder();
    focusPrompt();
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
          return `<ruby>${U.esc(t.text)}<rt>${U.esc(t.kana)}</rt></ruby>`;
        }
        return U.esc(t.text);
      }
      const o = part.opt;
      let html = U.esc(o.jp);
      if (o.jp && o.kana && o.jp !== o.kana) {
        html = `<ruby>${U.esc(o.jp)}<rt>${U.esc(o.kana)}</rt></ruby>`;
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
      <div class="brk-jp">${U.esc(t.jp)}${t.kana && t.kana !== t.jp ? `<small>${U.esc(t.kana)}</small>` : ""}</div>
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
      <div class="brk-jp">${U.esc(o.jp)}${o.kana && o.kana !== o.jp ? `<small>${U.esc(o.kana)}</small>` : ""}</div>
      <div class="brk-body">
        <span class="brk-pron">${U.esc(o.viPron || "")}</span>
        <span class="brk-roma">${U.esc(o.roma || "")}</span>
        <span class="brk-vi">${U.esc(o.viLabel || o.vi || "")}${note ? ` · <em>${U.esc(note)}</em>` : ""}</span>
      </div>
    </div>`;
  }

  function textRowHtml(t) {
    return `<div class="brk-row role-${U.esc(t.role || "expression")}">
      <div class="brk-jp">${U.esc(t.text)}${t.kana && t.kana !== t.text ? `<small>${U.esc(t.kana)}</small>` : ""}</div>
      <div class="brk-body">
        <span class="brk-pron">${U.esc(t.viPron || "")}</span>
        <span class="brk-roma">${U.esc(t.roma || "")}</span>
        <span class="brk-vi">${U.esc(t.vi || "—")}</span>
      </div></div>`;
  }

  function structureHtml(parts) {
    const rows = parts.map(part => {
      if (part.kind === "blank") {
        return `<div class="brk-row"><div class="brk-jp">…</div>
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
        <div class="b-jp">${jpHtml}</div>
        <div class="b-pron">${started || done ? U.esc(A.pronLine(parts)) : ""}</div>
        <div class="b-roma">${started || done ? U.esc(A.romaLine(parts)) : ""}</div>
        <div class="b-vi">${U.esc(vi)}</div>
        ${actions}
        ${done && intent.tip ? `<div class="note" style="margin-top:10px">${U.esc(intent.tip)}</div>` : ""}
        ${structureHtml(parts)}
      </div>

      <div class="b-prompt" tabindex="-1">${step ? U.esc(step.prompt) : ""}</div>
      ${filterHtml}
      <div class="opt-grid">${chips}</div>
      ${filterable ? `<div class="empty opt-empty" hidden>Không có lựa chọn khớp.</div>` : ""}
      ${notes.length ? `<div class="b-notes">${notes.map(n => `<div class="b-note">ℹ️ ${U.esc(n)}</div>`).join("")}</div>` : ""}
    `;

    view.querySelectorAll("[data-opt]").forEach(btn =>
      btn.addEventListener("click", () => pick(currentStep().options[Number(btn.dataset.opt)]))
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
    open: () => (state.intent ? renderBuilder() : renderHome()),
    startWith: (id) => {
      const intent = QJ.intents.intents.find(i => i.id === id);
      if (intent) startIntent(intent);
    },
  };
})();
