"use strict";
/* assemble.js — Logic ráp câu thuần dữ liệu, không đụng DOM.
   Dùng chung cho builder.js (trình duyệt) và tools/audit.js (Node) để hai bên
   không bao giờ lệch nhau. Mọi thay đổi cách ráp câu phải sửa ở file này. */

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.QJAssemble = api;
})(typeof window !== "undefined" ? window : null, function () {
  // Mảnh đã kết câu bằng dấu này thì không chèn thêm "。" nữa.
  const END_PUNCT = /[。．.!！?？、…]$/;

  function capitalize(s) {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function lastOverride(picks, field) {
    for (let i = picks.length - 1; i >= 0; i--) {
      const o = picks[i].option;
      if (o[field]) return o[field];
    }
    return null;
  }

  function partJp(part) {
    if (part.kind === "blank") return "";
    if (part.kind === "text") return part.text.text || "";
    return part.opt.jp + (part.particle ? part.particle.jp : "");
  }

  /* Ráp câu từ (intent, picks). Trả về { parts, vi } với vi CHƯA viết hoa. */
  function assemble(intent, picks) {
    const template = lastOverride(picks, "templateOverride") || intent.template;
    const viTemplate = lastOverride(picks, "viTemplateOverride") || intent.viTemplate;

    const slotPick = {};
    for (const p of picks) {
      const slot = intent.steps[p.stepId].slot;
      if (slot) slotPick[slot] = p.option;
    }

    const parts = [];
    if (template) {
      for (const seg of template) {
        if (seg.slot !== undefined) {
          const opt = slotPick[seg.slot];
          if (!opt) { parts.push({ kind: "blank", slot: seg.slot }); continue; }
          if (opt.silent || !opt.jp) continue;
          parts.push({ kind: "word", opt, particle: opt.particleObj || seg.particle });
        } else {
          parts.push({ kind: "text", text: seg });
        }
      }
    } else {
      // Nhiều mảnh cố định nối tiếp (không template): ngăn bằng "。" khi mảnh
      // trước chưa kết câu — tránh dính chữ kiểu "お元気ですかはい、元気です".
      for (const p of picks) {
        const o = p.option;
        if (o.silent || !o.jp) continue;
        if (parts.length && !END_PUNCT.test(partJp(parts[parts.length - 1]))) {
          parts.push({ kind: "text", text: { text: "。", kana: "。", roma: "", viPron: "", vi: "" } });
        }
        parts.push({ kind: "word", opt: o, particle: o.particleObj });
      }
    }

    let vi = "";
    if (viTemplate) {
      vi = viTemplate.replace(/\{(\w+)\}/g, (m, slot) => {
        const opt = slotPick[slot];
        return opt ? (opt.vi || "") : "…";
      });
      vi = vi.replace(/\s*\(\s*\)/g, "").replace(/,\s*$/, "").replace(/\s+/g, " ").trim();
    } else {
      vi = picks
        .filter(p => !p.option.silent)
        .map(p => p.option.viLabel || p.option.vi || "")
        .filter(Boolean)
        .join(" · ");
    }
    return { parts, vi };
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

  return { assemble, jpText, kanaText, pronLine, romaLine, lastOverride, capitalize, END_PUNCT };
});
