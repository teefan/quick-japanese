# Quick Japanese — Master Plan

A survival-Japanese tool for Vietnamese travelers: open the page, find or build a Japanese
sentence, read the Vietnamese-approximated pronunciation, and speak (or show the screen to)
a local. Static site, no server, deployable on GitHub Pages.

---

## 1. Product definition

**Persona.** Vietnamese tourist, zero Japanese, phone in hand, limited time and no keyboard
for Japanese. Wants to *produce* a few sentences reliably and understand the most common
replies. Communication is mostly one-way: traveler speaks Japanese → local understands.

**Core jobs-to-be-done**

1. “I need to say X right now.” → find a phrase fast, hear it, show it.
2. “I need a sentence that isn’t in the list.” → build it from a small, valid set of pieces.
3. “I want to understand why the sentence looks like that.” → one-tap grammar, phrased for
   Vietnamese speakers (SOV vs SVO, particles, です/ます).

**Non-goals (v1).** No kana/kanji course, no dictionary search in Japanese, no speech
recognition, no account, no backend, no ads, no tracking.

**Success signals.** Time-to-first-sentence < 15s; a traveler can order food, shop, ask
directions, refuse politely, and ask for help; payload < 300 KB; works offline after first load.

---

## 2. Research summary (what informed the content)

| Source | What we used it for |
|---|---|
| [Wikivoyage — Japanese phrasebook](https://en.wikivoyage.org/wiki/Japanese_phrasebook) (CC BY-SA 4.0) | Category coverage, particle/grammar framing, pronunciation caveats |
| [Wikivoyage VI — Sổ tay tiếng Nhật](https://vi.wikivoyage.org/wiki/S%E1%BB%95_tay_ti%E1%BA%BFng_Nh%E1%BA%ADt) | Vietnamese wording conventions for Japanese sounds (u→ư, e→ê, o→ô) |
| [JAL Survival Phrases](https://jal.japantravel.com/guide/japanese-survival-phrases-tips/21471), [Japan Living Guide](https://www.japanlivingguide.com/lifestyle/shopping/shopping-phrases-japan), [NihongoNana restaurant phrases](https://nihongonana.com/useful-phrases-for-restaurants-in-japan), [LIVE JAPAN](https://livejapan.com/en/article-a0002997) | Real usage per scenario: shopping, restaurants, staff replies, etiquette |
| [OpenJLPT](https://github.com/evanclan/OpenJLPT) (CC BY-SA 4.0) | N5 vocabulary scope (662 words) and example sentence schema for Phase 2 expansion |
| [hingston/japanese](https://github.com/hingston/japanese) (Leeds corpus frequency list) | Frequency ranking to keep “popular vocabulary” actually popular |
| [JMdict-simplified](https://github.com/scriptin/jmdict-simplified) (EDRDG, CC BY-SA 4.0) | Future: kanji/kana/readings validation, parts of speech |
| [Tatoeba](https://tatoeba.org) (CC BY 2.0 FR) | Future: Japanese example sentences with translations |
| [rspeer/wordfreq](https://github.com/rspeer/wordfreq) | Future: frequency filtering across corpora |

**Key content decisions**

- Prioritize **set phrases that work standalone** (すみません, これをください, お願いします)
  over grammatically “teaching” sentences.
- Include a **“Người Nhật có thể nói”** category so travelers can *recognize* common staff
  lines (いらっしゃいませ, 何名様ですか, 〜円です…).
- Teach only **polite forms** (です/ます). Casual forms mentioned in notes, never as defaults.
- Keep **culture notes** next to the phrase (no tipping, slurping ok, no bargaining in stores).
- Curate builder options to avoid unnatural collocations (don’t let “eat” combine with “coffee”).

---

## 3. UX principles

1. **Vietnamese-first UI.** Vietnamese labels, meanings, pronunciation; Japanese is the output.
2. **Pronunciation on every card.** Always show `viPron` (red) — never require romaji literacy.
3. **One-tap speaking.** TTS 🔊 on every phrase and built sentence (Web Speech API, ja-JP).
4. **Show-to-local mode 📺.** Full-screen, huge Japanese for pointing at staff. No Vietnamese
   in the big card (Vietnamese stays small below as a memory aid).
5. **Guided building, not a test.** The builder is a *narrowing assistant*: pick a meaning →
   only valid continuations appear → sentence assembles with correct particles and furigana.
6. **Progressive disclosure.** Grammar is one tap away (particle chips, grammar list), never
   blocking the main flow.
7. **Mobile-first, offline-friendly.** Bottom tab bar, big tap targets, system-font fallback,
   data as plain JS so the site even works from `file://`.

---

## 4. Information architecture

```
Cụm từ 📖     9 categories, 131 phrases
  Chào hỏi · Cảm ơn & lịch sự · Chỉ trỏ · Trả lời & xử lý ·
  Mua sắm · Gọi món & ăn uống · Đi lại · Khẩn cấp · Người Nhật có thể nói

Ghép câu 🧩    9 intent trees (see §6)
  Tôi muốn… · Cho tôi… · Tôi thích… · Cái này thì sao? · Đi đến… ·
  Làm ơn giúp tôi… · Không, cảm ơn… · Cái này được không? · …ở đâu?

Từ vựng 📚     173 curated words + 6 counters + money chips, tag filters, search
Ngữ pháp 📝    22 points, “cơ bản” / “nên biết”, examples with pronunciation
```

---

## 5. Data model

Authoring sources live in `data/source/*.json`; `node tools/build.js` enriches them
(romaji, Vietnamese pronunciation, verb conjugation, intent expansion, validation) and emits
browser-ready `data/*.js` as `window.QJ.<name>` globals.

### 5.1 Vocabulary (`data/source/vocab.json`)

```jsonc
{ "id": "n-mizu", "pos": "noun", "jp": "水", "kana": "みず", "vi": "nước",
  "tags": ["drink"], "note": "…" }

{ "id": "v-nomu", "pos": "verb", "dict": "飲む", "kana": "のむ", "group": "godan",
  "vi": "uống", "tags": ["action"] }
```

Build adds `roma`, `viPron`, and for verbs a full `forms` object:
`dict, masu, masen, mashita, te, tai, potential` (each with `jp`, `kana`, `roma`, `viPron`).
Supported groups: `godan`, `ichidan`, `suru` (incl. compounds like 試着する), `kuru`.

### 5.2 Phrases (`data/source/phrases.json`)

Categories → items. Each item: `id`, `jp`, `kana`, `vi`, optional `note`, and optional
overrides `roma` / `viPron` (used for particle は, e.g. こんにちは → `côn-ni-chi-oa`).

### 5.3 Grammar (`data/source/grammar.json`)

`id`, `level` (`basic`/`plus`), `title`, `summary`, `detail`, `examples[{jp,kana,vi}]`.
IDs are referenced by intents (e.g. `particle-ga`, `tai`), so grammar cards stay in sync
with the builder.

### 5.4 Numbers (`data/source/numbers.json`)

`numbers[]`, `counters[]` (with combos 1–5 including sound changes: 一本 いっぽん, 一杯 いっぱい,
一人 ひとり…), `money[]`.

### 5.5 Intents / builder trees (`data/source/intents.json`)

See §6. Validation at build time: unique IDs, all `ref` exist, all `next` steps exist,
grammar references exist.

---

## 6. Sentence builder — “narrowing” design

The builder is a **guided construction tool**, not a quiz. Each pick narrows the next valid
set, mirroring how a phrasebook conversation actually branches.

### 6.1 Shape of an intent tree

```jsonc
{
  "id": "i-want", "emoji": "🙋", "label": "Tôi muốn…", "start": "s-subject",
  "steps": {
    "s-subject": { "prompt": "Ai muốn?", "slot": "subject", "options": [
      { "ref": "p-watashi", "next": "s-action" },
      { "silent": true, "label": "Không cần chủ ngữ", "vi": "(tôi)", "next": "s-action" }
    ]},
    "s-action": { "prompt": "Muốn làm gì?", "slot": "verb", "options": [
      { "ref": "v-taberu", "form": "tai", "next": "s-obj-food" },
      { "ref": "v-iku", "form": "tai", "next": "s-obj-place" }
    ]},
    "s-obj-place": { "prompt": "Muốn đi đâu?", "slot": "object",
      "options": [ { "ref": "n-eki", "particle": "に", "vi": "đến ga", "next": null } ] }
  },
  "template": [ { "slot": "subject", "particle": "は" },
                { "slot": "object", "particle": "が" },
                { "slot": "verb" },
                { "text": "です", "kana": "です", "vi": "" } ],
  "viTemplate": "{subject} muốn {verb} {object}",
  "grammar": ["tai", "particle-ga", "sov"],
  "tip": "たい = 'muốn làm gì'. Với 行く, đích đến dùng に."
}
```

### 6.2 How assembly works

- Picks are made in **Vietnamese meaning order**; the sentence is assembled in **Japanese
  order** through `template` (this is what makes SOV visible and teachable).
- **Particles are auto-inserted** (`は`, `が`, `を`, `に`, `まで`…), rendered in red and
  tappable → grammar popover. A proven example: picking 駅 in the “want to go” branch flips
  the object particle from が to に via option-level override.
- **`templateOverride`** lets one option restructure the whole sentence:
  *Cái này* + *bao nhiêu tiền?* → `これはいくらですか`; *Cái này* + *được không?* →
  `これでいいですか`; taxi branch → `駅までお願いします`.
- **`viTemplate`** gives a live Vietnamese preview with slot placeholders.
- **`silent` options** model branch choices (e.g. “Nhờ đưa tôi đến…”) and subject omission
  (teaches that Japanese often drops the subject).
- Colors/UX: filled segments appear immediately, unfilled slots show `?`; furigana via
  `<ruby>`; after completion: TTS, copy, show-to-local, random sentence, grammar chips, tip.

### 6.3 Why deterministic, not AI

Curated patterns guarantee correctness (no hallucinated particles), work offline, are fast,
reviewable as JSON diffs, and can *explain* every particle. Scope is intentionally small:
9 intents cover the vast majority of traveler needs. Extension = add one JSON object.

---

## 7. Vietnamese pronunciation convention

Full spec: [`docs/PRONUNCIATION.md`](PRONUNCIATION.md). Highlights:

- Mora-split hyphens: `みず` → `mi-zư`; no tone marks.
- u→**ư**, e→**ê**, o→**ô**, s→**x**, d→**đ**, f→**ph**, つ→**tsư**.
- Particles: `は`→oa, `へ`→ê, `を`→ô; long vowels written mora-wise (`とう`→`tô-u`).
- ん → m/ng/n depending on the following sound; っ doubles the previous consonant.
- Generated by `tools/kana.js`; manual overrides only for exceptions (こんにちは…).

---

## 8. Tech architecture

```
index.html                 static entry; loads data + app scripts
assets/css/style.css       design system, light/dark, mobile-first
assets/js/app.js           tabs, phrasebook, vocab, grammar, TTS, modal, show-mode
assets/js/builder.js       narrowing builder engine (intent trees)
data/source/*.json         authoring data (vocab, phrases, grammar, intents, numbers)
tools/kana.js              kana → romaji / Vietnamese pronunciation / conjugation
tools/build.js             validates + enriches sources → data/*.js
data/*.js                  generated, loaded as window.QJ.* (works over file:// too)
docs/                      this plan + pronunciation spec
```

- **No framework, no bundler, no runtime build.** Vanilla JS + CSS.
- **Data as JS globals** instead of `fetch(json)` so the app works from `file://` and needs
  no server or CORS handling.
- **TTS** = Web Speech API (`ja-JP`), progressive enhancement only.
- **Performance budget**: data ≈ 210 KB + app ≈ 30 KB; fonts optional via Google Fonts with
  system fallbacks; renders 131 cards instantly.
- **GitHub Pages deploy**: push to `main`, Settings → Pages → Deploy from branch `/root`.
  (Optional `.nojekyll` is unnecessary since there are no underscore folders.)
- **Phase 2 offline**: add `manifest.webmanifest` + service worker (cache-first), which turns
  the page into an installable PWA — genuinely useful in Japan with spotty data.

---

## 9. Content quality rules

1. Polite register only; casual variants go in `note`.
2. Every phrase: `jp`, `kana`, `vi`; pronunciation auto-generated; `note` explains *when/who*.
3. Option lists in intents are curated so only natural collocations can be built.
4. No copied phrase lists: content is hand-authored and cross-checked against the sources in §2;
   third-party datasets (if imported later) keep their licenses and attribution (see §11).
5. Vocabulary scope: JLPT N5 + travel essentials; expand with OpenJLPT N5 (662 words) in Phase 2.
6. Vietnamese wording: natural, traveler-oriented, avoiding machine-translation tone.

---

## 10. Roadmap

| Phase | Scope |
|---|---|
| **0 — now (this repo)** | Data pipeline, 131 phrases / 173 words / 22 grammar points / 9 intent trees, working prototype (4 tabs, TTS, show-mode, narrowing builder) |
| **1 — MVP polish** | Favorites + “sổ tay của tôi” (localStorage); PWA offline; full-text search across tabs; hotel/pharmacy/insurance phrase sets; `noindex`/SEO meta; native-speaker review pass |
| **2 — Scale content** | Expand to full N5 from OpenJLPT (+ Vietnamese meanings, reviewed); example sentences from Tatoeba; “Nghe & chọn” audio quiz; counters 1–10; pitch-accent display (Kanjium/OJAD) |
| **3 — Delight** | Offline pre-generated audio pack; URL-shareable built sentences (`#s=…`); saveas-image card for offline sharing; menu-photo OCR via platform APIs (optional); English UI toggle |

---

## 11. Licensing & attribution

- **Code**: MIT recommended.
- **Curated data/content**: recommend CC BY-SA 4.0 (keeps attribution culture, matches the
  likely upstream sources). If kept MIT, document content provenance in the README.
- Planned imports and their licenses: OpenJLPT **CC BY-SA 4.0**, JMdict/JMdict-simplified
  **EDRDG license (CC BY-SA 4.0)**, Tatoeba **CC BY 2.0 FR**, frequency lists per their repos.
- Wikivoyage used as *reference only*; no verbatim copying (CC BY-SA requires attribution if
  text is reused — safer to author original phrasing).

---

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Vietnamese pronunciation inconsistency | Single generator (`tools/kana.js`) + documented spec + overrides list |
| TTS voice missing on some devices | TTS is enhancement; show-mode and copy always work; Phase 3 offline audio |
| Unnatural buildable sentences | Curated per-branch option lists; native review in Phase 1 |
| Copyright issues when scaling | Only import datasets with clear licenses; keep `NOTICE`/attribution |
| Data drift between sources and generated files | One-command rebuild + build-time validation (IDs, refs, steps) |
| Over-engineering the builder | Deterministic tree, JSON-only extension, 9 intents cover MVP needs |
