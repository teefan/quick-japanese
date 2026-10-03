# Bối cảnh cho phiên phát triển mới

> Cập nhật: 2026-10-03 · commit `9b39d4c` · SW cache `qj-v1.5.0` · Pages built xanh
> Live: <https://teefan.github.io/quick-japanese/> · Repo: `teefan/quick-japanese` (nhánh `archive/hanasou` giữ bản cũ trước khi ghi đè)

Đọc file này trước khi bắt đầu code. Chi tiết đầy đủ nằm ở [`PLAN.md`](PLAN.md);
quy ước phiên âm ở [`PRONUNCIATION.md`](PRONUNCIATION.md); checklist kiểm duyệt bản ngữ ở
[`REVIEW-CHECKLIST.md`](REVIEW-CHECKLIST.md).

## 0. TL;DR

- **SPA tĩnh, vanilla JS**, không framework/bundler. Dữ liệu nguồn là JSON → `npm run build` →
  `data/*.js` (biến toàn cục `window.QJ.*`). Không sửa tay `data/*.js`.
- **5 tab**: Cụm từ 📖 · Ghép câu 🧩 · Sổ tay ⭐ · Từ vựng 📚 · Ngữ pháp 📝, + tìm kiếm toàn cục 🔍
  + Nghe & chọn 🎧 (mở từ nút trên header, không chiếm tab).
- **Builder** = cây ý định thu hẹp dần: **13 cây / 4 nhóm** theo độ cơ bản
  (Giao tiếp → Ăn uống & mua sắm → Đi lại & khách sạn → Sức khỏe & sự cố).
- **Mọi câu** (cụm từ + câu ghép + câu cố định trong builder) đều được **bóc tách thành mảnh**,
  tô màu theo vai trò ngữ pháp, kèm phiên âm Việt + romaji Hepburn.
- **PWA offline**: `sw.js` network-first cho HTML, cache-first cho assets, fonts SWR.
- **Nghe & chọn 🎧**: quiz 10 câu/lượt từ cụm từ hoặc từ vựng — TTS đọc câu hỏi, chọn nghĩa,
  biết đáp án ngay; fallback **Đọc & chọn** khi máy không có TTS; lưu điểm cao `qj.quiz.v1`,
  phím 1–4 trên desktop. Không phải tab: mở từ nút 🎧 trên header hoặc banner trong tab Từ vựng.
- **Từ vựng N5 📚**: 561 từ JLPT N5 (OpenJLPT, CC BY-SA 4.0) nằm ở `data/vocab-n5.js` — tải nền
  khi trang rảnh, không vào builder/segmenter, phân trang 60 từ/lần. **460 từ có câu ví dụ
  Tatoeba** (CC BY 2.0 FR) kèm furigana gốc → kana + phiên âm Việt + nghĩa Việt; hiện trên thẻ
  từ vựng và màn kết quả quiz. Payload đầu giữ ~435 KB, file N5 tải nền ≈ 259 KB.
- **Sổ tay ⭐**: lưu cụm từ + câu ghép (localStorage `qj.favs.v1`); **xuất/nhập JSON** có version
  (`quick-japanese/notebook`), chọn gộp hoặc thay thế, bỏ mục lỗi/trùng.
- Số liệu hiện tại: **744 từ vựng (183 biên tập + 561 N5, 460 có câu ví dụ) · 167 cụm từ (12 nhóm)
  · 22 điểm ngữ pháp · 13 cây · 6 lượng từ (1–10)**.
- Kiểm thử chuẩn: 13 cây × 3 đường ngẫu nhiên = **39/39**, 1 lượt Nghe & chọn mỗi nguồn,
  xuất/nhập lại sổ tay, **thẻ N5 hiện câu ví dụ + 🔊**, không lỗi JS.

## 1. Lệnh thường dùng

```bash
npm run build      # node tools/build.js — bắt buộc chạy sau mọi thay đổi data/source
npm run serve      # python3 -m http.server 8080
node --check assets/js/app.js assets/js/builder.js tools/*.js   # kiểm tra cú pháp
```

Khi test trong trình duyệt với service worker cũ: mở DevTools →
`navigator.serviceWorker.getRegistrations()` unregister + `caches.keys()` delete + reload,
hoặc chạy server `Cache-Control: no-store`. PWA cache-first khiến lần load đầu vẫn có thể là bản cũ.

## 2. Bản đồ repo

```
index.html                 entry; load data/*.js rồi assets/js/app.js, builder.js
manifest.webmanifest       PWA manifest
sw.js                      service worker (đổi VERSION mỗi lần release app/data)
assets/css/style.css       design system + màu vai trò (--rl-*)
assets/js/app.js           5 tab, cụm từ, từ vựng, ngữ pháp, sổ tay, tìm kiếm, Nghe & chọn, TTS, modal, PWA register
assets/js/builder.js       engine builder (cây ý định, structure panel, GROUP_ORDER)
data/source/*.json         dữ liệu gốc: vocab, vocab-n5, vocab-n5-examples, phrases, grammar, intents, numbers
data/*.js                  SINH TỰ ĐỘNG — không sửa tay; vocab-n5.js tải nền, không có trong index.html
tools/kana.js              kana → romaji / phiên âm Việt / chia động từ
tools/segment.js           từ điển + tokenizer DP bóc tách câu (EXPRESSIONS, EXPR_ROLE, PARTICLES)
tools/build.js             validate + enrich + xuất data/*.js
docs/                      PLAN, DEV-CONTEXT (file này), PRONUNCIATION, REVIEW-CHECKLIST, screenshot
```

## 3. Quy trình thêm nội dung

### Thêm từ vựng — `data/source/vocab.json`
```jsonc
{ "id": "n-mizu", "pos": "noun", "jp": "水", "kana": "みず", "vi": "nước", "tags": ["drink"] }
{ "id": "v-nomu", "pos": "verb", "dict": "飲む", "kana": "のむ", "group": "godan", "vi": "uống" }
```
- Động từ bắt buộc có `dict` + `kana` + `group` (`godan`/`ichidan`/`suru`/`kuru`); build tự chia
  `masu, masen, mashita, te, tai, potential, potentialNeg`.
- Từ mới cần được tham chiếu bằng `ref` trong intents nếu muốn dùng ở builder.

### Từ vựng N5 — `data/source/vocab-n5.json`
- 561 từ nhập một lần từ OpenJLPT v0.3.0 (CC BY-SA 4.0); `id` giữ mã gốc dạng `n5-<10 hex>`,
  `tags: ["n5"]`, động từ dùng `dict`/`kana`/`group` như từ vựng thường. Từ kana-only bỏ `jp`
  (build tự lấy `kana`).
- Nghĩa tiếng Việt do dự án biên tập; khi sửa phải giữ đúng `kana` gốc (khoá ghép với OpenJLPT).
- File này **không** đi vào `buildLexicon`/builder — chỉ sinh `data/vocab-n5.js` để tab Từ vựng,
  tìm kiếm và quiz dùng. Muốn một từ N5 xuất hiện trong builder thì thêm bản biên tập vào
  `vocab.json` (và tham chiếu `ref` như bình thường).

### Câu ví dụ N5 — `data/source/vocab-n5-examples.json`
```jsonc
"n5-ada066edfd": {
  "jp": "じゃあパーティーで会いましょう。",   // câu gốc Tatoeba
  "furi": "じゃあパーティーで{会|あ}いましょう。", // furigana gốc — nguồn chuẩn cho kana + literal
  "kana": "じゃあパーティーであいましょう。",  // build kiểm tra phải khớp furi
  "vi": "Vậy hẹn gặp nhau ở bữa tiệc nhé.", // nghĩa Việt do dự án biên tập
  "tatoeba": 215904
}
```
- Khoá là `id` trong `vocab-n5.json`; build gắn `examples` (jp/kana/roma/viPron/vi) vào từ tương ứng
  và **bỏ qua** nếu thiếu dữ liệu (có cảnh báo). Không cần ví dụ cho mọi từ: chỉ nhập câu thật sự
  lịch sự/tự nhiên; 101 từ hiện chưa có câu phù hợp.
- `furi` bắt buộc: build dùng nó để biết ký tự nào là kana viết thẳng (chỗ có thể là trợ từ) và
  sinh phiên âm đúng (`は`→oa, `へ`→ê) mà không nhầm cách đọc kanji (母は `ははは` → `ha-ha-oa`).
- Từ kana dễ bị tách nhầm thành trợ từ (はっきり, はかり…) thêm vào `EXAMPLE_EXTRA_KANA` trong
  `tools/build.js`. Câu lấy từ Tatoeba (CC BY 2.0 FR) qua OpenJLPT v0.3.0; xem `docs/PLAN.md` §11.

### Thêm cụm từ — `data/source/phrases.json`
- `id`, `jp`, `kana`, `vi`, optional `note` (mẹo dùng/văn hóa).
- Thêm `roma`/`viPron` viết tay khi có trợ từ đọc đặc biệt (は → `oa`).
- `parts` viết tay chỉ khi tách tự động chưa đạt; build sẽ audit “mảnh ghép phải khớp câu gốc”.

### Thêm/sửa cây ghép câu — `data/source/intents.json`
- Mỗi cây: `id`, `emoji`, `label`, `desc`, `group` (1 trong 4 nhóm), `start`, `steps`,
  `template`/`viTemplate` (null nếu chỉ ghép câu cố định), `grammar`, `tip`.
- Option có thể là: `ref` (+ `form`: `dict|masu|masen|mashita|te|tai|potential`), `silent` (chỉ chọn
  nhánh), hoặc câu cố định (`jp`/`kana`/`vi` + override `roma`/`viPron`).
- Nâng cao: `particle` (override trợ từ), `templateOverride` (đổi cả khuôn câu),
  `viTemplateOverride` (đổi câu tiếng Việt xem trước), `note`, `hint`.
- Câu cố định được **tách mảnh tự động** khi build nếu từ điển đủ; nếu không, build ghi chú ở mục
  “Option cố định chưa tách được” (không phải lỗi — câu đó hiện 1 dòng).
- **Thứ tự cây trong nhóm = thứ tự mảng** trong file. Muốn sắp lại hàng loạt, viết script di
  chuyển nguyên khối object (đừng sửa tay từng dòng).

### Thêm điểm ngữ pháp — `data/source/grammar.json`
- `id`, `level` (`basic`/`plus`), `title`, `summary`, `detail`, `examples[{jp,kana,vi}]`.
- `id` được intents/segmenter tham chiếu; build cảnh báo nếu không tồn tại.

### Thêm từ cho bộ tách câu — `tools/segment.js`
- Thêm vào `EXPRESSIONS` (kana/jp/vi/note/grammar/role) và `EXPR_ROLE` nếu là danh từ/động từ/
  tính từ/trạng từ. Sau đó build lại để câu cố định được tách mảnh.

## 4. Quy ước phải giữ

- **Phiên âm Việt**: sinh tự động bởi `tools/kana.js`, xem `docs/PRONUNCIATION.md`. Không gõ tay.
- **Romaji**: Hepburn, trường âm kiểu Wāpuro (`toukyou`, `koohii`); trợ từ đọc thật (`wa`, `e`, `o`).
- **Màu vai trò** (`role`): `pron`, `noun`, `verb`, `adj`, `adverb`, `particle`, `copula`,
  `number`, `expression`, `unknown`. Thêm role mới ⇒ sửa cả `ROLE_LEGEND` (app.js), CSS `--rl-*`
  (style.css, light + dark) và `EXPR_ROLE`/lexicon (segment.js).
- **Thứ tự nhóm builder**: `GROUP_ORDER` trong `builder.js` (cố định, cơ bản nhất trước).
- **Lịch sự**: chỉ です/ます trong câu chuẩn; thể thân mật chỉ để trong `note`.
- **Dữ liệu sinh ra**: compact JSON + bỏ field rỗng (prune). Đừng sửa `data/*.js`.
- **N5 tách rời**: `vocab-n5` không được đưa vào segmenter/builder — tránh đổi cách tách câu của
  nội dung hiện có; muốn dùng ở builder thì thêm vào `vocab.json` trước. Riêng câu ví dụ dùng
  **lexicon cục bộ** (curated + N5 + `EXAMPLE_EXTRA_KANA`) chỉ để sinh phiên âm, không ảnh hưởng
  kết quả tách câu của cụm từ/cây ghép.
- **Furigana câu ví dụ**: build đọc `{漢|かん}` để lấy kana; chỉ ghi đè は/へ khi ký tự đó là kana
  viết thẳng và token đúng là trợ từ — không ghi đè vào cách đọc kanji.
- **Sổ tay JSON**: format `quick-japanese/notebook` version 1 (`entries` = mảng fav); nhập chấp
  nhận cả mảng trần, tối đa 2.000 mục, gộp thì chống trùng theo id (cụm từ) / `payload.jp` (câu).
- **Mỗi lần release**: bump `VERSION` trong `sw.js` (`qj-vX.Y.Z`), chạy build, commit, push main.

## 5. Kiểm thử & deploy

1. `npm run build` — phải **0 cảnh báo** (chỉ còn ghi chú thống kê câu ví dụ N5).
2. `node --check` các file JS đã sửa.
3. Mở app (nhớ xoá SW khi test): kiểm 5 tab, tìm kiếm, builder chạy ngẫu nhiên vài cây, lưu Sổ tay,
   **Nghe & chọn** (chạy hết 1 lượt ở cả 2 nguồn, thử 🔊 nghe lại + phím 1–4), **N5** (chip 🌱,
   phân trang Xem thêm, badge N5, tìm một từ N5, **câu ví dụ + 🔊 trên thẻ từ vựng và ở kết quả
   quiz**), và **xuất/nhập sổ tay** (gộp + thay thế).
4. Release regression (khuyến nghị): vòng lặp tất cả cây × 3 đường 🎲, kiểm tra `.b-jp`, `.b-brk`,
   kết thúc 1 lượt quiz ở cả 2 nguồn, không lỗi JS (`window.__errs`).
5. `git push origin main` → GitHub Pages tự build. Kiểm tra:
   `gh api repos/teefan/quick-japanese/pages/builds/latest --jq '.status + " " + .commit'`
   và curl `https://teefan.github.io/quick-japanese/sw.js` để xác nhận VERSION mới.

## 6. Trạng thái & việc còn lại

- **Phase 1** gần xong; việc duy nhất còn lại là **kiểm duyệt bởi người bản ngữ** — dùng
  `docs/REVIEW-CHECKLIST.md` (đã bổ sung mục N5 + lượng từ 6–10 + câu ví dụ), sửa
  `data/source/*.json` + build.
- **Phase 2** (xem `PLAN.md` §10): ✅ Nghe & chọn (v1.3.0) · ✅ đủ N5 từ OpenJLPT — 561 từ mới,
  nghĩa Việt biên tập, tải nền + phân trang · ✅ lượng từ 1–10 · ✅ xuất/nhập Sổ tay JSON ·
  ✅ **câu ví dụ Tatoeba (v1.5.0)** — 460/561 từ N5, furigana gốc → kana + phiên âm, nghĩa Việt
  biên tập, hiện trên thẻ từ vựng + kết quả quiz. Còn lại: **pitch accent** (Kanjium/OJAD —
  cần xử lý trùng âm + thiết kế hiển thị).
- **Tồn đã biết**: nghĩa 561 từ N5 + **460 câu ví dụ** chờ kiểm duyệt; 101 từ N5 chưa có
  câu ví dụ phù hợp; file N5 tải nền giờ ≈ 259 KB (vẫn lazy, không vào payload đầu).

## 7. Lịch sử quyết định ngắn

- Builder là **deterministic**, không dùng AI — lý do ở `PLAN.md` §6.3.
- Bóc tách câu bằng **quy hoạch động có trọng số** (tránh lỗi tham lam `はいくら` → `はい+くら`) — §6.4.
- Audit builder v1.2.4 (độ chính xác, nhất quán, override, chip ngữ pháp, payload) — §6.5.
- Thứ tự nhóm/cây theo **độ cơ bản** (Giao tiếp lên đầu) — commit `8de933d`.
- “Nghe & chọn” là **quiz deterministic** từ dữ liệu sẵn có (không thêm dữ liệu, không AI); TTS chỉ là
  enhancement — máy thiếu giọng Nhật thì tự chuyển sang Đọc & chọn; không thêm tab để giữ IA 5 tab.
- N5 để ở file riêng tải nền (idle) thay vì nhét chung `vocab.js`: giữ payload đầu < 500 KB và
  **không đụng vào kết quả tách câu** đã kiểm duyệt (N5 không vào lexicon/builder).
- Câu ví dụ N5 (v1.5.0) giữ **furigana gốc** trong source thay vì chỉ kana: build suy ra kana và
  chỉ đọc は/へ thành trợ từ khi ký tự đó là kana viết thẳng — tránh cả lỗi “đọc kanji thành trợ từ”
  lẫn lỗi “đọc trợ từ thành cách đọc kanji”; từ kana dễ tách nhầm nằm trong `EXAMPLE_EXTRA_KANA`.
  Thà thiếu ví dụ (101 từ) còn hơn nhập câu thân mật/phản cảm. Nghĩa Việt + độ lịch sự vẫn chờ
  người bản ngữ duyệt như mục N5.
- Sổ tay JSON có `format`/`version`; nhập chỉ nhận mục hợp lệ (cụm từ phải còn id, câu cần `payload.jp`),
  gộp thì chống trùng theo id/`payload.jp`.
