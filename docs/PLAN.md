# Quick Japanese — Master Plan

A survival-Japanese tool for Vietnamese travelers: open the page, find or build a Japanese
sentence, read the Vietnamese-approximated pronunciation, and speak (or show the screen to)
a local. Static site, no server, deployable on GitHub Pages.

> **Current status (v2.3.0)** — live at <https://teefan.github.io/quick-japanese/>:
> **2 tabs: 🧩 Ghép câu + 📚 Từ vựng.** 15 intent trees (4 groups) · ~1,120 combinable sentences
> (128 curated + 37 N5 words as options) · 744 words (183 curated + 561 N5, lazy-loaded)
> · 460 N5 example sentences (Tatoeba) · 726 pitch accents (Kanjium) · 6 counters (1–10)
> · vocabulary cards link back into the builder (`data/builder-index.js`).
> PWA cache `qj-v2.3.0`. Regression: 15 intents × 3 random paths = 45/45, no JS errors.
> **v2.0.0 narrowed the product**: phrases/cụm từ, notebook/sổ tay, grammar/ngữ pháp, quiz
> “Nghe & chọn” and global search were removed — all still available in git history (v1.6.1).
> **Starting a new session? Read [`DEV-CONTEXT.md`](DEV-CONTEXT.md) first.**

---

## 1. Product definition

**Persona.** Vietnamese tourist, zero Japanese, phone in hand, limited time and no keyboard
for Japanese. Wants to *produce* a few sentences reliably and understand the most common
replies. Communication is mostly one-way: traveler speaks Japanese → local understands.

**Core jobs-to-be-done**

1. “I need to say X right now.” → build a valid sentence fast, hear it, show it.
2. “What does this word mean / how is it read?” → look it up in the vocabulary list with
   example sentence and pitch accent.
3. “I want to understand why the sentence looks like that.” → the builder shows its grammatical
   composition (particles, roles) right under the sentence.

**Non-goals (v2).** No phrasebook tab, no favorites/notebook, no grammar reference tab,
no quiz, no global search, no account, no backend, no ads, no tracking.

**Success signals.** Time-to-first-sentence < 15s; a traveler can order food, shop, ask
directions, refuse politely, and ask for help; initial payload < 500 KB (≈ 435 KB; danh sách
561 từ N5 133 KB tải nền sau khi trang rảnh); works offline after first load.

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
| [Tatoeba](https://tatoeba.org) (CC BY 2.0 FR) | Japanese example sentences (460 selected for N5 words, via OpenJLPT) |
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
8. **Every sentence is dissected.** Phrase cards and built sentences show their grammatical
   composition (word + particle segmentation with type/form notes) and explain each piece;
   the same breakdown is saved with notebook sentences. See §6.4.

---

## 4. Information architecture

```
Ghép câu 🧩    15 intent trees in 4 groups, ordered basic → advanced (see §6)
  Giao tiếp:          Chào hỏi & xã giao · Cảm ơn & xin lỗi · Trả lời & xử lý ·
                      Làm ơn giúp tôi… · Cái này được không?
  Ăn uống & mua sắm:  Cái này thì sao? · Cho tôi… · Tôi muốn… · Tôi thích…
  Đi lại & khách sạn: …ở đâu? · Đi đến… · Khách sạn
  Sức khỏe & sự cố:   Sức khỏe & sự cố

Từ vựng 📚     744 words (183 curated + 561 N5 lazy) + counters 1–10 + money chips,
               tag filters, paginated list, search, example sentences, pitch accents;
               cards link to the builder intents that use the word
```

Removed in v2.0.0 (recoverable from git history): Cụm từ 📖 (phrases), Sổ tay ⭐ (favorites +
export/import), Ngữ pháp 📝 (grammar reference), Nghe & chọn 🎧 (quiz), Tìm kiếm 🔍 (global search).

---

## 5. Data model

Authoring sources live in `data/source/*.json`; `node tools/build.js` enriches them
(romaji, Vietnamese pronunciation, verb conjugation, intent expansion, sentence segmentation,
validation) and emits browser-ready `data/*.js` as `window.QJ.<name>` globals. Generated files
are compact JSON with empty fields pruned (~50 KB curated vocab; +264 KB for the lazy N5 list
with examples + accents) — always rebuild from sources, never edit `data/*.js` by hand.

### 5.1 Vocabulary (`data/source/vocab.json` + `data/source/vocab-n5.json`)

```jsonc
{ "id": "n-mizu", "pos": "noun", "jp": "水", "kana": "みず", "vi": "nước",
  "tags": ["drink"], "note": "…" }

{ "id": "v-nomu", "pos": "verb", "dict": "飲む", "kana": "のむ", "group": "godan",
  "vi": "uống", "tags": ["action"] }
```

Build adds `roma`, `viPron`, and for verbs a full `forms` object:
`dict, masu, masen, mashita, te, tai, potential, potentialNeg` (each with `jp`, `kana`, `roma`, `viPron`).
Supported groups: `godan`, `ichidan`, `suru` (incl. compounds like 試着する), `kuru`.

`vocab-n5.json` holds 561 additional JLPT N5 words imported once from
[OpenJLPT](https://github.com/evanclan/OpenJLPT) v0.3.0 (CC BY-SA 4.0) with Vietnamese glosses
authored by the project. They are enriched like curated words but are **not** fed into the shared
sentence segmenter; the build emits them to `data/vocab-n5.js`, which the app lazy-loads on idle
and paginates in the Từ vựng tab, keeping the initial payload flat. Since v2.1.0 the builder may
reference N5 ids directly (`"ref": "n5-…"`): only the referenced N5 words join the builder lexicon,
and the build audits that no existing fixed sentence changes segmentation.

`vocab-n5-examples.json` adds one example sentence for 460 of those words: Japanese text from
Tatoeba (CC BY 2.0 FR) via OpenJLPT, original furigana markup (`furi`) for exact readings,
and project-authored Vietnamese translations. The build derives kana + `viPron`/`roma` from
the furigana and an N5-extended lexicon (so particles は/へ read `oa`/`ê` correctly, and kanji
readings are never mistaken for particles); examples are attached to `vocab-n5.js` and shown
on vocab cards. Words without a suitable polite/natural example are omitted.

`accents.json` maps vocabulary id → pitch-accent number for 726 of 744 words (curated + N5),
imported once from [Kanjium](https://github.com/mifunetoshiro/kanjium) `accents.txt` (124k words,
CC BY-SA 4.0). Value `n` = pitch drops after mora *n*; `0` = heiban (no drop). Where Kanjium
offers several accents, the first is kept; for kana-only homographs the candidate matching the
word's reading is preferred (e.g. これ [0], not the interjection [1]). The build attaches
`accent` to vocab items; the app renders high morae with an overline + `↓` marker and `[n]`
on every vocab card.

### 5.2 Numbers (`data/source/numbers.json`)

`numbers[]`, `counters[]` (combos 1–10 including sound changes: 一本 いっぽん, 六本 ろっぽん,
一杯 いっぱい, 八杯 はっぱい, 一人 ひとり, 二人 ふたり…), `money[]`.

### 5.3 Intents / builder trees (`data/source/intents.json`)

See §6. Intents carry a `group` (one of the four builder groups); steps hold `options` where an
option can be a vocabulary `ref` (+ `form`) from `vocab.json` or `vocab-n5.json`, a `silent`
branch choice, or a fixed sentence (with optional `roma`/`viPron` overrides and automatic `parts`
segmentation). Validation at build time: unique IDs, all `ref` exist, all `next` steps exist.

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
  "tip": "たい = 'muốn làm gì'. Với 行く, đích đến dùng に."
}
```

### 6.2 How assembly works

- Picks are made in **Vietnamese meaning order**; the sentence is assembled in **Japanese
  order** through `template` (this is what makes SOV visible and teachable).
- **Particles are auto-inserted** (`は`, `が`, `を`, `に`, `まで`…), rendered in red. A proven
  example: picking 駅 in the “want to go” branch flips the object particle from が to に via
  option-level override.
- **`templateOverride`** lets one option restructure the whole sentence:
  *Cái này* + *bao nhiêu tiền?* → `これはいくらですか`; *Cái này* + *được không?* →
  `これでいいですか`; taxi branch → `駅までお願いします`.
- **`viTemplate`** gives a live Vietnamese preview with slot placeholders.
- **`silent` options** model branch choices (e.g. “Nhờ đưa tôi đến…”) and subject omission
  (teaches that Japanese often drops the subject).
- Colors/UX: filled segments appear immediately, unfilled slots show `?`; furigana via
  `<ruby>`; after completion: TTS, copy, show-to-local, random sentence, tip and the
  structure breakdown.

### 6.3 Why deterministic, not AI

Curated patterns guarantee correctness (no hallucinated particles), work offline, are fast,
reviewable as JSON diffs, and can *explain* every particle. Scope is intentionally bounded but
broad: **15 intent trees** cover set phrases (greetings, thanks, apologies), conversation
management (agree/decline/don’t-understand), transactions (order, buy, ask price/place),
travel (train/taxi, hotel), and emergencies/health. Combinatorial branches multiply coverage
from a small data set: e.g. 6 verbs × `〜てくれてありがとう` for thanks, 5 body parts × `〜が痛いです`,
4 items × `〜をなくしました / 〜を盗まれました`, 4 services × `〜を呼んでください`.
The current 15 trees yield **~1,120 distinct sentences** and reference **128 curated + 37 N5 words**
as options. Extension = add one JSON object (plus, if needed, vocabulary for the new slots).

### 6.4 Sentence dissection (grammar composition)

Every built sentence is shown **broken into its grammatical pieces**:

- **Built sentences** (`tools/segment.js` + build step): the structure panel is derived from
  picks; fixed-sentence options are segmented at build time with a weighted dynamic-programming
  tokenizer (word = 1, particle = 2, unknown = 100/char, which prevents greedy mistakes like
  `はいくら` → `は + いくら`). Each token carries `jp`, `kana`, `viPron`, Vietnamese meaning and
  a short note (part of speech, verb form, particle role), e.g. `英語 + で + お願い + します`.
- **UI**: the sentence shows `<ruby>` furigana; below it the structure panel lists each piece
  **colour-coded by grammatical role** (pronoun, noun, verb, adjective, adverb, particle,
  copula です, number, fixed expression) with the Vietnamese approximation, Hepburn romaji,
  meaning and part of speech. Every row keeps its role colour in the generated data.

### 6.5 Builder audit (v1.2.4)

A full audit of the builder produced these fixes:

- **Accuracy** — the hotel “something is broken” branch no longer blindly applies
  `動きません`: it now offers correct fixed sentences (`エアコンが動きません`, `電気がつきません`,
  `お湯が出ません`, `Wi-Fiがつながりません`). The train branch (`この電車は…に行きますか`) now has its
  own destination list (Tokyo, stations, airport, hotels, onsen, markets, shrines) instead of the
  general place list that allowed nonsense like “does this train go to the toilet?”.
- **Consistency** — fixed-sentence options are now segmented at build time with the same
  tokenizer/annotator as the rest of the builder, so the structure panel shows full breakdowns
  (e.g. `英語 + で + お願い + します`).
- **Overrides** — option-level `roma`/`viPron` overrides are now respected
  (こんにちは → `konnichiwa` / `côn-ni-chi-oa`).
- **Validation** — build warns on unknown chunks; every fixed option now segments into pieces
  (`ご迷惑をおかけしました` → ご迷惑 + を + お掛け + しました).
- **Payload** — generated data switched to compact JSON with empty fields pruned:
  611 KB → 349 KB, everything else unchanged.

Regression check: 13 intents × 3 random paths = 39/39 complete sentences with breakdown, no JS
errors.

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
manifest.webmanifest       PWA manifest (installable app)
sw.js                      service worker: network-first HTML, cache-first assets, fonts SWR
assets/icons/              PWA icons (source SVG + 192/512 PNG)
assets/css/style.css       design system, light/dark, mobile-first
assets/js/app.js           tabs, phrasebook, vocab, grammar, notebook, search, Nghe & chọn quiz, TTS, modal
assets/js/builder.js       narrowing builder engine (intent trees)
data/source/*.json         authoring data (vocab, vocab-n5, phrases, grammar, intents, numbers)
tools/kana.js              kana → romaji / Vietnamese pronunciation / conjugation
tools/segment.js           sentence dissection: lexicon + weighted DP tokenizer
tools/build.js             validates + enriches sources → data/*.js
data/*.js                  generated, loaded as window.QJ.* (works over file:// too);
                           vocab-n5.js is injected on idle by app.js (561 từ, lazy);
                           builder-index.js maps vocabulary ids → builder intents
docs/                      this plan + DEV-CONTEXT + pronunciation spec + review checklist
```

- **No framework, no bundler, no runtime build.** Vanilla JS + CSS.
- **Data as JS globals** instead of `fetch(json)` so the app works from `file://` and needs
  no server or CORS handling. The large N5 list is loaded lazily via an injected `<script>`
  so first paint stays under the payload budget; the SW pre-caches it for offline use.
- **TTS** = Web Speech API (`ja-JP`), progressive enhancement only.
- **Offline (Phase 1, done)**: `sw.js` is network-first for page navigations (new versions show
  up immediately when online) and cache-first with background refresh for assets; Google Fonts
  use stale-while-revalidate. Installable via `manifest.webmanifest`.
- **Performance budget**: initial payload ≈ 95 KB of data (vocab + numbers + intents, compact JSON)
  + lazy N5 list ≈ 264 KB with examples and accents; fonts optional via Google Fonts with system
  fallbacks; vocab list paginates at 60 cards.
- **GitHub Pages deploy**: push to `main`, Settings → Pages → Deploy from branch `/root`
  (already live at <https://teefan.github.io/quick-japanese/>).

---

## 9. Content quality rules

1. Polite register only; casual variants go in `note`.
2. Builder options are curated so only natural collocations can be built; fixed sentences carry
   `jp`, `kana`, `vi`, with pronunciation auto-generated.
3. No copied content: material is hand-authored and cross-checked against the sources in §2;
   third-party datasets keep their licenses and attribution (see §11).
4. Vocabulary scope: JLPT N5 + travel essentials; ✅ N5 imported from OpenJLPT (561 từ mới, nghĩa
   Việt biên tập tay, chờ kiểm duyệt cùng `REVIEW-CHECKLIST.md`); ✅ 460 từ N5 có câu ví dụ
   Tatoeba (lọc câu lịch sự/tự nhiên, nghĩa Việt biên tập, cũng chờ kiểm duyệt).
5. Vietnamese wording: natural, traveler-oriented, avoiding machine-translation tone.

---

## 10. Roadmap

| Phase | Scope |
|---|---|
| **0 — initial (v0.1)** | Data pipeline, 131 phrases / 173 words / 22 grammar points / 9 intent trees, prototype (4 tabs, TTS, show-mode, narrowing builder) |
| **1 — MVP polish (v0.2 → v1.2.5)** | ✅ Favorites + “Sổ tay của tôi” (localStorage) · ✅ PWA offline · ✅ Global search · ✅ Hotel / pharmacy / insurance phrase sets (12 categories, 167 phrases) · ✅ Builder expanded to 13 intent trees in 4 groups, ordered basic → advanced · ✅ Sentence dissection with role colours + Hepburn romaji · ✅ Builder audit fixes (v1.2.4, §6.5) · ✅ SEO/OG meta |
| **2 — Scale content (v1.3.0 → v1.6.1)** | ✅ “Nghe & chọn” audio quiz · ✅ Full N5 vocabulary from OpenJLPT (561 từ mới, lazy-loaded, phân trang) · ✅ Counters 1–10 with sound changes · ✅ Notebook export/import JSON · ✅ Example sentences from Tatoeba (460/561 từ N5) · ✅ Pitch-accent display (Kanjium, 726/744 từ) |
| **3 — Delight** | ✅ Scope narrowing (v2.0.0): chỉ còn **Ghép câu + Từ vựng**, bỏ cụm từ/sổ tay/ngữ pháp/quiz/tìm kiếm (v1.6.1 vẫn trong git history) · Offline pre-generated audio pack; URL-shareable built sentences (`#s=…`); save-as-image card; menu-photo OCR (optional); English UI toggle |

---

## 11. Licensing & attribution

- **Code**: MIT recommended.
- **Curated data/content**: recommend CC BY-SA 4.0 (keeps attribution culture, matches the
  likely upstream sources). If kept MIT, document content provenance in the README.
- **Imported data in tree**: [OpenJLPT](https://github.com/evanclan/OpenJLPT) N5 vocabulary,
  **CC BY-SA 4.0** — 561 entries in `data/source/vocab-n5.json`, Vietnamese glosses authored by
  this project (not from OpenJLPT). Attribution lives in the file header (`note`/`source`),
  README §Giấy phép and this section.
- **Example sentences**: [Tatoeba](https://tatoeba.org) — **CC BY 2.0 FR** — 460 sentences in
  `data/source/vocab-n5-examples.json`, taken from OpenJLPT's example lists (which carry the
  Tatoeba sentence id and furigana). Vietnamese translations authored by this project.
  Attribution in the file header, README §Giấy phép and this section.
- **Pitch accent**: [Kanjium](https://github.com/mifunetoshiro/kanjium) — **CC BY-SA 4.0** —
  726 accents in `data/source/accents.json`, imported from `data/source_files/raw/accents.txt`
  (124,137 words). Required attribution: “The pitch accent notation, verb particle data,
  phonetics, homonyms and other additions or modifications to EDICT, KANJIDIC or KRADFILE were
  provided by Uros O. through his free database.” Shown in the source header, app (Từ vựng tab
  source note) and this section.
- Planned/optional imports: JMdict/JMdict-simplified **EDRDG license (CC BY-SA 4.0)**,
  Tatoeba **CC BY 2.0 FR**, Kanjium **CC BY-SA 4.0**, frequency lists per their repos.
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
| Over-engineering the builder | Deterministic tree, JSON-only extension, 13 intents cover MVP needs |
