"use strict";
/**
 * kana.js — Chuyển kana sang romaji (Hepburn rút gọn) và phiên âm tiếng Việt.
 *
 * Quy ước phiên âm Việt (xem docs/PRONUNCIATION.md):
 *  - u -> ư, e -> ê, o -> ô
 *  - s -> x (xa, xi, xư...), d -> đ, z -> z, f -> ph, tsu -> tsư
 *  - Trường âm giữ nguyên theo mora: とう -> "tô-u", せい -> "xê-i"
 *  - ん: "m" trước p/b/m, "ng" trước k/g, "n" các trường hợp khác
 *  - っ (sokuon): gấp âm cuối mora trước: がっこう -> "gak-kô-u"
 *  - は/へ/を khi là trợ từ được ghi đè thủ công (oa / ê / ô)
 */

const MORA = {
  // a
  "あ": ["a", "a"], "い": ["i", "i"], "う": ["u", "ư"], "え": ["e", "ê"], "お": ["o", "ô"],
  // k
  "か": ["ka", "ka"], "き": ["ki", "ki"], "く": ["ku", "cư"], "け": ["ke", "kê"], "こ": ["ko", "kô"],
  "きゃ": ["kya", "kia"], "きゅ": ["kyu", "kiu"], "きょ": ["kyo", "kiô"],
  // g
  "が": ["ga", "ga"], "ぎ": ["gi", "gi"], "ぐ": ["gu", "gư"], "げ": ["ge", "gê"], "ご": ["go", "gô"],
  "ぎゃ": ["gya", "gia"], "ぎゅ": ["gyu", "giu"], "ぎょ": ["gyo", "giô"],
  // s
  "さ": ["sa", "xa"], "し": ["shi", "xi"], "す": ["su", "xư"], "せ": ["se", "xê"], "そ": ["so", "xô"],
  "しゃ": ["sha", "xa"], "しゅ": ["shu", "xư"], "しょ": ["sho", "xô"], "しぇ": ["she", "xê"],
  // z
  "ざ": ["za", "za"], "じ": ["ji", "ji"], "ず": ["zu", "zư"], "ぜ": ["ze", "zê"], "ぞ": ["zo", "zô"],
  "じゃ": ["ja", "ja"], "じゅ": ["ju", "ju"], "じょ": ["jo", "jô"], "じぇ": ["je", "jê"],
  // t
  "た": ["ta", "ta"], "ち": ["chi", "chi"], "つ": ["tsu", "tsư"], "て": ["te", "tê"], "と": ["to", "tô"],
  "ちゃ": ["cha", "cha"], "ちゅ": ["chu", "chu"], "ちょ": ["cho", "chô"], "ちぇ": ["che", "chê"],
  "つぁ": ["tsa", "tsa"], "つぃ": ["tsi", "tsi"], "つぇ": ["tse", "tsê"], "つぉ": ["tso", "tsô"],
  // d
  "だ": ["da", "đa"], "ぢ": ["ji", "đi"], "づ": ["zu", "đư"], "で": ["de", "đê"], "ど": ["do", "đô"],
  "でぃ": ["di", "đi"], "どぅ": ["du", "đu"],
  // n
  "な": ["na", "na"], "に": ["ni", "ni"], "ぬ": ["nu", "nư"], "ね": ["ne", "nê"], "の": ["no", "nô"],
  "にゃ": ["nya", "nia"], "にゅ": ["nyu", "niu"], "にょ": ["nyo", "niô"],
  // h
  "は": ["ha", "ha"], "ひ": ["hi", "hi"], "ふ": ["fu", "phư"], "へ": ["he", "hê"], "ほ": ["ho", "hô"],
  "ひゃ": ["hya", "hia"], "ひゅ": ["hyu", "hiu"], "ひょ": ["hyo", "hiô"],
  "ふぁ": ["fa", "pha"], "ふぃ": ["fi", "phi"], "ふぇ": ["fe", "phê"], "ふぉ": ["fo", "phô"], "ふゅ": ["fyu", "phiu"],
  // b
  "ば": ["ba", "ba"], "び": ["bi", "bi"], "ぶ": ["bu", "bư"], "べ": ["be", "bê"], "ぼ": ["bo", "bô"],
  "びゃ": ["bya", "bia"], "びゅ": ["byu", "biu"], "びょ": ["byo", "biô"],
  // p
  "ぱ": ["pa", "pa"], "ぴ": ["pi", "pi"], "ぷ": ["pu", "pư"], "ぺ": ["pe", "pê"], "ぽ": ["po", "pô"],
  "ぴゃ": ["pya", "pia"], "ぴゅ": ["pyu", "piu"], "ぴょ": ["pyo", "piô"],
  // m
  "ま": ["ma", "ma"], "み": ["mi", "mi"], "む": ["mu", "mư"], "め": ["me", "mê"], "も": ["mo", "mô"],
  "みゃ": ["mya", "mia"], "みゅ": ["myu", "miu"], "みょ": ["myo", "miô"],
  // y
  "や": ["ya", "ya"], "ゆ": ["yu", "yu"], "よ": ["yo", "yô"], "いぇ": ["ye", "iê"],
  // r
  "ら": ["ra", "ra"], "り": ["ri", "ri"], "る": ["ru", "rư"], "れ": ["re", "rê"], "ろ": ["ro", "rô"],
  "りゃ": ["rya", "ria"], "りゅ": ["ryu", "riu"], "りょ": ["ryo", "riô"],
  // w
  "わ": ["wa", "oa"], "ゐ": ["i", "i"], "ゑ": ["e", "ê"], "を": ["o", "ô"],
  "うぃ": ["wi", "u-i"], "うぇ": ["we", "u-ê"], "うぉ": ["wo", "u-ô"],
  // v (katakana)
  "ゔ": ["vu", "vu"], "ゔぁ": ["va", "va"], "ゔぃ": ["vi", "vi"], "ゔぇ": ["ve", "vê"], "ゔぉ": ["vo", "vô"],
  // n
  "ん": ["n", "n"],
};

// Thứ tự ưu tiên ghép digraph (2 ký tự) trước 1 ký tự
const DIGRAPHS = new Set(Object.keys(MORA).filter((k) => k.length === 2));

function kataToHira(str) {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

function peek(kana, i) {
  const two = kana.slice(i, i + 2);
  if (two.length === 2 && DIGRAPHS.has(two)) {
    return { kana: two, roma: MORA[two][0], vi: MORA[two][1], len: 2 };
  }
  const one = kana[i];
  if (one === "ん") return { kana: one, roma: "n", vi: "n", len: 1, isN: true };
  if (MORA[one]) return { kana: one, roma: MORA[one][0], vi: MORA[one][1], len: 1 };
  return null;
}

// Phụ âm để gấp âm cho っ: lấy từ chữ cái đầu của romaji mora kế tiếp
function sokuonCons(mora) {
  const r = mora.roma;
  if (r.startsWith("sh")) return { roma: "s", vi: "x" };
  if (r.startsWith("ch")) return { roma: "t", vi: "t" };
  if (r.startsWith("ts")) return { roma: "t", vi: "t" };
  if (r.startsWith("hy")) return { roma: "h", vi: "h" };
  const c = r[0];
  const viMap = { s: "x", f: "ph", d: "đ" };
  return { roma: c, vi: viMap[c] || c };
}

const VOWEL_OF = { a: "a", i: "i", u: "ư", e: "ê", o: "ô" };

/**
 * Chuyển một chuỗi kana thành { roma, viPron }.
 * @param {string} input  chuỗi hiragana/katakana (cho phép lẫn kanji — kanji bị bỏ qua)
 * @param {{roma?:string, vi?:string}} [override]
 * @param {Object<number,{roma:string,vi:string}>} [posOverride] ghi đè theo vị trí ký tự
 *        (dùng để đọc trợ từ は/へ/を đúng trong câu ví dụ)
 */
function translit(input, override, posOverride) {
  const kana = kataToHira(input || "");
  const groups = []; // { roma, vi }
  let pending = null; // âm gấp của っ

  for (let i = 0; i < kana.length; ) {
    const ch = kana[i];

    if (ch === "っ") {
      const nxt = peek(kana, i + 1);
      if (nxt) pending = sokuonCons(nxt);
      i += 1;
      continue;
    }

    if (ch === "ー") {
      if (groups.length) {
        const prev = groups[groups.length - 1];
        const rv = prev.roma.slice(-1);
        const vv = prev.vi.slice(-1);
        prev.roma += rv;
        prev.vi += vv;
      }
      i += 1;
      continue;
    }

    const m = peek(kana, i);
    if (!m) { i += 1; continue; } // kanji/ký tự khác

    if (pending) {
      if (groups.length) {
        groups[groups.length - 1].roma += pending.roma;
        groups[groups.length - 1].vi += pending.vi;
      }
      pending = null;
    }

    const pos = posOverride && posOverride[i];
    if (m.isN) {
      const nxt = peek(kana, i + 1);
      let vi = "n";
      if (nxt) {
        if (/^[pbm]/.test(nxt.roma)) vi = "m";
        else if (/^[kg]/.test(nxt.roma)) vi = "ng";
      }
      if (pos) { vi = pos.vi; }
      if (groups.length) {
        groups[groups.length - 1].roma += pos ? pos.roma : "n";
        groups[groups.length - 1].vi += vi;
      } else {
        groups.push({ roma: pos ? pos.roma : "n", vi });
      }
    } else {
      let vi = pos ? pos.vi : m.vi;
      // う sau một nguyên âm: viết "u" cho dễ đọc và nhất quán (とう -> "tô-u", アウト -> "a-u-tô")
      if (!pos && m.roma === "u" && groups.length) vi = "u";
      groups.push({ roma: pos ? pos.roma : m.roma, vi });
    }
    i += m.len;
  }

  const roma = override && override.roma !== undefined ? override.roma : groups.map((g) => g.roma).join("");
  const vi = override && override.vi !== undefined ? override.vi : groups.map((g) => g.vi).join("-");
  return { roma, vi };
}

const romanize = (kana, override) => translit(kana, override).roma;
const viet = (kana, override) => translit(kana, override).vi;

/* ------------------------------------------------------------------ */
/* Chia động từ (thể từ điển -> các thể cần dùng)                      */
/* ------------------------------------------------------------------ */

function conjOne(jp, kana, map) {
  const last = kana.slice(-1);
  if (!map[last]) throw new Error(`Không chia được "${jp}" (kana: ${kana}) với đuôi ${last}`);
  const jpStem = jp.slice(0, -1);
  const kanaStem = kana.slice(0, -1);
  return {
    jp: jpStem + map[last].jp,
    kana: kanaStem + map[last].kana,
  };
}

const GODAN_MASU = {
  "う": { jp: "います", kana: "います" }, "く": { jp: "きます", kana: "きます" },
  "ぐ": { jp: "ぎます", kana: "ぎます" }, "す": { jp: "します", kana: "します" },
  "つ": { jp: "ちます", kana: "ちます" }, "ぬ": { jp: "にます", kana: "にます" },
  "ぶ": { jp: "びます", kana: "びます" }, "む": { jp: "みます", kana: "みます" },
  "る": { jp: "ります", kana: "ります" },
};
const GODAN_TE = {
  "う": { jp: "って", kana: "って" }, "つ": { jp: "って", kana: "って" },
  "る": { jp: "って", kana: "って" }, "く": { jp: "いて", kana: "いて" },
  "ぐ": { jp: "いで", kana: "いで" }, "す": { jp: "して", kana: "して" },
  "ぬ": { jp: "んで", kana: "んで" }, "ぶ": { jp: "んで", kana: "んで" },
  "む": { jp: "んで", kana: "んで" },
};
const GODAN_POT = {
  "う": { jp: "えます", kana: "えます" }, "く": { jp: "けます", kana: "けます" },
  "ぐ": { jp: "げます", kana: "げます" }, "す": { jp: "せます", kana: "せます" },
  "つ": { jp: "てます", kana: "てます" }, "ぬ": { jp: "ねます", kana: "ねます" },
  "ぶ": { jp: "べます", kana: "べます" }, "む": { jp: "めます", kana: "めます" },
  "る": { jp: "れます", kana: "れます" },
};

function conjAux(forms, kind) {
  // kind: masu | te | tai | pot | masen | mashita
  const stemOf = (f) => ({ jp: f.jp.replace(/ます$/, ""), kana: f.kana.replace(/ます$/, "") });
  const masu = forms.masu;
  const m = stemOf(masu);
  switch (kind) {
    case "masen": return { jp: m.jp + "ません", kana: m.kana + "ません" };
    case "mashita": return { jp: m.jp + "ました", kana: m.kana + "ました" };
    case "tai": return { jp: m.jp + "たい", kana: m.kana + "たい" };
    default: throw new Error("kind?");
  }
}

/** Chia một động từ: dict {jp,kana} + group: godan|ichidan|suru|kuru */
function conjugate(dictJp, dictKana, group) {
  const out = {
    dict: { jp: dictJp, kana: dictKana },
  };
  if (group === "ichidan") {
    const jpStem = dictJp.slice(0, -1);
    const kanaStem = dictKana.slice(0, -1);
    out.masu = { jp: jpStem + "ます", kana: kanaStem + "ます" };
    out.te = { jp: jpStem + "て", kana: kanaStem + "て" };
    out.potential = { jp: jpStem + "られます", kana: kanaStem + "られます" };
  } else if (group === "godan") {
    // 行く là ngoại lệ: te-form là 行って
    if (dictJp === "行く") {
      out.masu = { jp: "行きます", kana: "いきます" };
      out.te = { jp: "行って", kana: "いって" };
      out.potential = { jp: "行けます", kana: "いけます" };
    } else {
      out.masu = conjOne(dictJp, dictKana, GODAN_MASU);
      out.te = conjOne(dictJp, dictKana, GODAN_TE);
      out.potential = conjOne(dictJp, dictKana, GODAN_POT);
    }
  } else if (group === "suru") {
    const jpStem = dictJp.slice(0, -2); // bỏ する
    const kanaStem = dictKana.slice(0, -2);
    out.masu = { jp: jpStem + "します", kana: kanaStem + "します" };
    out.te = { jp: jpStem + "して", kana: kanaStem + "して" };
    out.potential = { jp: jpStem + "できます", kana: kanaStem + "できます" };
  } else if (group === "kuru") {
    out.masu = { jp: "来ます", kana: "きます" };
    out.te = { jp: "来て", kana: "きて" };
    out.potential = { jp: "来られます", kana: "こられます" };
  } else {
    throw new Error(`Nhóm động từ không hợp lệ: ${group} (${dictJp})`);
  }
  out.masen = conjAux(out, "masen");
  out.mashita = conjAux(out, "mashita");
  out.tai = conjAux(out, "tai");
  return out;
}

module.exports = { translit, romanize, viet, conjugate, kataToHira };
