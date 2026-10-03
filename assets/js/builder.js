"use strict";
/* builder.js — Ghép câu thu hẹp dần: mỗi lựa chọn chỉ mở ra những bước hợp lệ tiếp theo.
   Không phải bài kiểm tra: người dùng chọn nghĩa tiếng Việt, app dựng câu tiếng Nhật,
   phiên âm và giải thích trợ từ theo thời gian thực. */

(function () {
  const QJ = window.QJ;
  const U = window.U;
  const view = document.getElementById("view");

  const state = {
    intent: null,
    picks: [],   // { stepId, option }
    stepId: null,
  };

  /* ------------------------------ Điều hướng ------------------------------ */

  function renderHome() {
    state.intent = null;
    state.picks = [];
    state.stepId = null;
    view.innerHTML = `
      <div class="section-title">
        <h2>🧩 Ghép câu</h2>
        <span class="desc">Chọn từng bước — app chỉ hiện những gì có thể nối tiếp</span>
      </div>
      <div class="intent-grid">
        ${QJ.intents.intents.map(i => `
          <button class="intent-card" data-intent="${i.id}">
            <span class="emoji">${i.emoji}</span>
            <b>${U.esc(i.label)}</b>
            <span>${U.esc(i.desc)}</span>
          </button>`).join("")}
      </div>
      <p style="font-size:13px;color:var(--muted);margin-top:14px">
        Mẹo: chọn “Tôi” → “muốn” → món ăn… App sẽ tự đặt trợ từ đúng
        (は, が, を, に…), hiện phiên âm và giải thích vì sao.
      </p>`;
    view.querySelectorAll("[data-intent]").forEach(btn =>
      btn.addEventListener("click", () =>
        startIntent(QJ.intents.intents.find(i => i.id === btn.dataset.intent))
      )
    );
    window.scrollTo({ top: 0 });
  }

  function startIntent(intent) {
    state.intent = intent;
    state.picks = [];
    state.stepId = intent.start;
    renderBuilder();
  }

  const currentStep = () => state.intent.steps[state.stepId];

  function pick(option) {
    state.picks.push({ stepId: state.stepId, option });
    state.stepId = option.next;   // null = hoàn thành
    renderBuilder();
    document.querySelector(".b-sentence")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function back() {
    const last = state.picks.pop();
    state.stepId = last ? last.stepId : state.intent.start;
    renderBuilder();
  }

  function reset() {
    state.picks = [];
    state.stepId = state.intent.start;
    renderBuilder();
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
  }

  /* ------------------------------ Dựng câu ------------------------------ */

  function lastOverride(field) {
    for (let i = state.picks.length - 1; i >= 0; i--) {
      const o = state.picks[i].option;
      if (o[field]) return o[field];
    }
    return null;
  }

  function assemble() {
    const intent = state.intent;
    const template = lastOverride("templateOverride") || intent.template;
    const viTemplate = lastOverride("viTemplateOverride") || intent.viTemplate;

    const slotPick = {};
    for (const p of state.picks) {
      const slot = intent.steps[p.stepId].slot;
      if (slot) slotPick[slot] = p.option;
    }

    const parts = [];
    if (template) {
      for (const seg of template) {
        if (seg.slot !== undefined) {
          const opt = slotPick[seg.slot];
          if (!opt) { parts.push({ kind: "blank" }); continue; }
          if (opt.silent || !opt.jp) continue;
          parts.push({ kind: "word", opt, particle: opt.particleObj || seg.particle });
        } else {
          parts.push({ kind: "text", text: seg });
        }
      }
    } else {
      for (const p of state.picks) {
        const o = p.option;
        if (o.silent || !o.jp) continue;
        parts.push({ kind: "word", opt: o, particle: o.particleObj });
      }
    }

    let vi = "";
    if (viTemplate) {
      vi = viTemplate.replace(/\{(\w+)\}/g, (m, slot) => {
        const opt = slotPick[slot];
        return opt ? (opt.vi || "") : "…";
      });
      vi = vi.replace(/\s*\(\s*\)/g, "").replace(/,\s*$/g, "").replace(/\s+/g, " ").trim();
    } else {
      vi = state.picks
        .filter(p => !p.option.silent)
        .map(p => p.option.viLabel || p.option.vi || "")
        .filter(Boolean)
        .join(" · ");
    }
    return { parts, vi: U.capitalize(vi) };
  }

  function sentenceHtml(parts) {
    return parts.map(part => {
      if (part.kind === "blank") return `<span class="blank">?</span>`;
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
        html += `<span class="particle" data-grammar="${part.particle.grammar}" title="${U.esc(part.particle.vi)}">${U.esc(part.particle.jp)}</span>`;
      }
      return html;
    }).join("");
  }

  function pronLine(parts) {
    return parts
      .filter(p => p.kind !== "blank")
      .map(p => {
        if (p.kind === "text") return p.text.viPron || "";
        const bits = [p.opt.viPron];
        if (p.particle) bits.push(p.particle.viPron);
        return bits.filter(Boolean).join(" ");
      })
      .filter(Boolean)
      .join(" ");
  }

  function romaLine(parts) {
    return parts
      .filter(p => p.kind !== "blank")
      .map(p => {
        if (p.kind === "text") return p.text.roma || "";
        const bits = [p.opt.roma];
        if (p.particle) bits.push(p.particle.roma);
        return bits.filter(Boolean).join(" ");
      })
      .filter(Boolean)
      .join(" ");
  }

  function jpText(parts) {
    return parts.map(p => {
      if (p.kind === "blank") return "＿";
      if (p.kind === "text") return p.text.text || "";
      return p.opt.jp + (p.particle ? p.particle.jp : "");
    }).join("");
  }

  function kanaText(parts) {
    return parts.map(p => {
      if (p.kind === "blank") return "＿";
      if (p.kind === "text") return p.text.kana || "";
      return (p.opt.kana || p.opt.jp || "") + (p.particle ? p.particle.kana : "");
    }).join("");
  }

  /* Bảng bóc tách câu: từng mảnh + loại từ/thể + trợ từ kèm giải thích */
  function optionNote(part) {
    const o = part.opt;
    if (o.posVi && o.formNote) return `${o.posVi}, ${o.formNote}`;
    return o.posVi || o.formNote || o.note || "";
  }

  /* Dữ liệu bóc tách để lưu kèm câu vào sổ tay */
  function structureData(parts) {
    const rows = [];
    for (const part of parts) {
      if (part.kind === "blank") continue;
      if (part.kind === "text") {
        rows.push({ jp: part.text.text, kana: part.text.kana, roma: part.text.roma, viPron: part.text.viPron, vi: part.text.vi, note: "", grammar: null, role: part.text.role || "expression" });
        continue;
      }
      const o = part.opt;
      rows.push({
        jp: o.jp, kana: o.kana, roma: o.roma, viPron: o.viPron,
        vi: o.viLabel || o.vi, note: optionNote(part),
        grammar: o.grammarHint || null, role: o.role || "expression",
      });
      if (part.particle) {
        rows.push({
          jp: part.particle.jp, kana: part.particle.kana, roma: part.particle.roma, viPron: part.particle.viPron,
          vi: part.particle.vi, note: part.particle.note || "",
          grammar: part.particle.grammar || null, role: "particle", isParticle: true,
        });
      }
    }
    return rows;
  }

  function structureHtml(parts) {
    const rows = parts.map(part => {
      if (part.kind === "blank") {
        return `<div class="brk-row"><div class="brk-jp">?</div>
          <div class="brk-body"><span class="brk-vi" style="color:var(--muted)">Chưa chọn</span></div></div>`;
      }
      if (part.kind === "text") {
        const t = part.text;
        return `<div class="brk-row role-${U.esc(t.role || "expression")}">
          <div class="brk-jp">${U.esc(t.text)}${t.kana && t.kana !== t.text ? `<small>${U.esc(t.kana)}</small>` : ""}</div>
          <div class="brk-body">
            <span class="brk-pron">${U.esc(t.viPron || "")}</span>
            <span class="brk-roma">${U.esc(t.roma || "")}</span>
            <span class="brk-vi">${U.esc(t.vi || "—")}</span>
          </div></div>`;
      }
      const o = part.opt;
      const note = optionNote(part);
      let html = `<div class="brk-row role-${U.esc(o.role || "expression")}">
        <div class="brk-jp">${U.esc(o.jp)}${o.kana && o.kana !== o.jp ? `<small>${U.esc(o.kana)}</small>` : ""}</div>
        <div class="brk-body">
          <span class="brk-pron">${U.esc(o.viPron || "")}</span>
          <span class="brk-roma">${U.esc(o.roma || "")}</span>
          <span class="brk-vi">${U.esc(o.viLabel || o.vi || "")}${note ? ` · <em>${U.esc(note)}</em>` : ""}</span>
        </div>
        ${o.grammarHint ? `<button class="brk-g" data-grammar="${o.grammarHint}" title="Mở giải thích ngữ pháp">📝</button>` : ""}
      </div>`;
      if (part.particle) {
        html += `<div class="brk-row role-particle particle-row">
          <div class="brk-jp">${U.esc(part.particle.jp)}</div>
          <div class="brk-body">
            <span class="brk-pron">${U.esc(part.particle.viPron || "")}</span>
            <span class="brk-roma">${U.esc(part.particle.roma || "")}</span>
            <span class="brk-vi">${U.esc(part.particle.vi)}${part.particle.note ? ` · <em>${U.esc(part.particle.note)}</em>` : ""}</span>
          </div>
          ${part.particle.grammar ? `<button class="brk-g" data-grammar="${part.particle.grammar}" title="Mở giải thích ngữ pháp">📝</button>` : ""}
        </div>`;
      }
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
    const { parts, vi } = assemble();
    const done = !state.stepId;

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

    const notes = [...new Set(state.picks.map(p => p.option.note).filter(Boolean))];
    const jpNow = jpText(parts);
    const savedNow = done && window.Fav &&
      Fav.list().some(f => f.type === "sentence" && f.payload && f.payload.jp === jpNow);

    const grammarBtns = (intent.grammar || [])
      .map(id => {
        const g = QJ.grammar.points.find(x => x.id === id);
        return g ? `<button data-grammar="${id}">${U.esc(g.title.split("—")[0].split("(")[0].trim())}</button>` : "";
      })
      .join("");

    const actions = done
      ? `<div class="b-actions">
          <button class="primary" data-b="speak">🔊 Nghe</button>
          <button data-b="show">📺 Đưa máy</button>
          <button data-b="copy">📋 Copy</button>
          <button data-b="fav">${savedNow ? "★ Đã lưu" : "☆ Lưu câu"}</button>
          <button data-b="random">🎲 Câu khác</button>
        </div>`
      : "";

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
        <div class="b-jp">${sentenceHtml(parts)}</div>
        <div class="b-pron">${U.esc(pronLine(parts))}</div>
        <div class="b-roma">${U.esc(romaLine(parts))}</div>
        <div class="b-vi">${U.esc(vi)}</div>
        ${actions}
        ${done && intent.tip ? `<div class="note" style="margin-top:10px">${U.esc(intent.tip)}</div>` : ""}
        ${structureHtml(parts)}
        <div class="b-grammar">${grammarBtns}</div>
      </div>

      <div class="b-prompt">${step ? U.esc(step.prompt) : "Nói câu này hoặc đưa máy cho người đối diện nhé."}</div>
      <div class="opt-grid">${chips}</div>
      ${notes.length ? `<div class="b-notes">${notes.map(n => `<div class="b-note">ℹ️ ${U.esc(n)}</div>`).join("")}</div>` : ""}
    `;

    view.querySelectorAll("[data-opt]").forEach(btn =>
      btn.addEventListener("click", () => pick(currentStep().options[Number(btn.dataset.opt)]))
    );

    view.querySelectorAll("[data-b]").forEach(btn =>
      btn.addEventListener("click", () => {
        const b = btn.dataset.b;
        if (b === "home") renderHome();
        else if (b === "back") back();
        else if (b === "reset") reset();
        else if (b === "random") randomPath();
        else if (b === "speak") U.speak(jpText(parts));
        else if (b === "copy") U.copy(`${jpText(parts)}\n${pronLine(parts)}\n${vi}`, jpText(parts));
        else if (b === "fav" && window.Fav) {
          const jp = jpText(parts);
          const existing = Fav.list().find(f => f.type === "sentence" && f.payload && f.payload.jp === jp);
          if (existing) {
            Fav.remove("sentence", existing.id);
            btn.textContent = "☆ Lưu câu";
            U.toast("Đã bỏ khỏi sổ tay");
          } else {
            Fav.toggle({
              type: "sentence",
              id: "s" + Date.now(),
              payload: { jp, kana: kanaText(parts), viPron: pronLine(parts), roma: romaLine(parts), vi, structure: structureData(parts) },
              savedAt: Date.now(),
            });
            btn.textContent = "★ Đã lưu";
            U.toast("Đã lưu vào sổ tay");
          }
        }
        else if (b === "show") {
          U.showToLocal({ jp: jpText(parts), kana: kanaText(parts), viPron: pronLine(parts), vi }, intent.label);
        }
      })
    );

    // Ghi chú: bấm trợ từ / nút ngữ pháp được xử lý ở app.js qua [data-grammar]
  }

  window.Builder = {
    open: () => (state.intent ? renderBuilder() : renderHome()),
    startWith: (id) => {
      const intent = QJ.intents.intents.find(i => i.id === id);
      if (intent) startIntent(intent);
    },
  };
})();
