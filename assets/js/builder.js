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

  const GROUP_ICONS = {
    "Giao tiếp": "💬",
    "Ăn uống & mua sắm": "🍜",
    "Đi lại & khách sạn": "🚕",
    "Sức khỏe & sự cố": "🚑",
  };

  function renderHome() {
    state.intent = null;
    state.picks = [];
    state.stepId = null;
    const intents = QJ.intents.intents;
    const groups = [];
    for (const i of intents) {
      const g = i.group || "Khác";
      if (!groups.includes(g)) groups.push(g);
    }
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

  function tokenRowHtml(t) {
    return `<div class="brk-row role-${U.esc(t.role || "expression")}${t.isParticle ? " particle-row" : ""}">
      <div class="brk-jp">${U.esc(t.jp)}${t.kana && t.kana !== t.jp ? `<small>${U.esc(t.kana)}</small>` : ""}</div>
      <div class="brk-body">
        <span class="brk-pron">${U.esc(t.viPron || "")}</span>
        <span class="brk-roma">${U.esc(t.roma || "")}</span>
        <span class="brk-vi">${U.esc(t.vi || "—")}${t.note ? ` · <em>${U.esc(t.note)}</em>` : ""}</span>
      </div>
      ${t.grammar ? `<button class="brk-g" data-grammar="${t.grammar}" title="Mở giải thích ngữ pháp">📝</button>` : ""}
    </div>`;
  }

  function particleRowHtml(p) {
    return `<div class="brk-row role-particle particle-row">
      <div class="brk-jp">${U.esc(p.jp)}</div>
      <div class="brk-body">
        <span class="brk-pron">${U.esc(p.viPron || "")}</span>
        <span class="brk-roma">${U.esc(p.roma || "")}</span>
        <span class="brk-vi">${U.esc(p.vi)}${p.note ? ` · <em>${U.esc(p.note)}</em>` : ""}</span>
      </div>
      ${p.grammar ? `<button class="brk-g" data-grammar="${p.grammar}" title="Mở giải thích ngữ pháp">📝</button>` : ""}
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
      ${o.grammarHint ? `<button class="brk-g" data-grammar="${o.grammarHint}" title="Mở giải thích ngữ pháp">📝</button>` : ""}
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
        return `<div class="brk-row"><div class="brk-jp">?</div>
          <div class="brk-body"><span class="brk-vi" style="color:var(--muted)">Chưa chọn</span></div></div>`;
      }
      if (part.kind === "text") return textRowHtml(part.text);
      const o = part.opt;
      // Option cố định đã được tách mảnh ở build: hiện từng mảnh (như thẻ cụm từ)
      let html = Array.isArray(o.parts) && o.parts.length
        ? o.parts.map(tokenRowHtml).join("")
        : optionRowHtml({ ...o, _note: optionNote(part) });
      if (part.particle) html += particleRowHtml(part.particle);
      return html;
    }).join("");
    const hasContent = parts.some(p => p.kind !== "blank");
    if (!hasContent) return "";
    return `<div class="brk b-brk"><div class="brk-title">🧩 Cấu trúc câu</div>${rows}</div>`;
  }

  /* Dữ liệu bóc tách để lưu kèm câu vào sổ tay */
  function tokenData(t) {
    return {
      jp: t.jp, kana: t.kana, roma: t.roma, viPron: t.viPron,
      vi: t.vi, note: t.note || "", grammar: t.grammar || null,
      role: t.role || "expression", isParticle: !!t.isParticle,
    };
  }

  function structureData(parts) {
    const rows = [];
    for (const part of parts) {
      if (part.kind === "blank") continue;
      if (part.kind === "text") {
        const t = part.text;
        rows.push({ jp: t.text, kana: t.kana, roma: t.roma, viPron: t.viPron, vi: t.vi, note: "", grammar: null, role: t.role || "expression" });
        continue;
      }
      const o = part.opt;
      if (Array.isArray(o.parts) && o.parts.length) {
        for (const t of o.parts) rows.push(tokenData(t));
      } else {
        rows.push({
          jp: o.jp, kana: o.kana, roma: o.roma, viPron: o.viPron,
          vi: o.viLabel || o.vi, note: optionNote(part),
          grammar: o.grammarHint || null, role: o.role || "expression",
        });
      }
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

    // Chip ngữ pháp chỉ hiện những điểm thực sự xuất hiện trong câu đang ghép
    const usedGrammar = [];
    for (const part of parts) {
      if (part.kind === "blank" || part.kind === "text") continue;
      const o = part.opt;
      if (Array.isArray(o.parts)) {
        for (const t of o.parts) if (t.grammar) usedGrammar.push(t.grammar);
      } else if (o.grammarHint) {
        usedGrammar.push(o.grammarHint);
      }
      if (part.particle && part.particle.grammar) usedGrammar.push(part.particle.grammar);
    }
    const grammarIds = state.picks.length
      ? [...new Set(usedGrammar)]
      : (intent.grammar || []);
    const grammarBtns = grammarIds
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
