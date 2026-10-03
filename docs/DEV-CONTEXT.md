# Bối cảnh cho phiên phát triển mới

> Cập nhật: 2026-10-03 · SW cache `qj-v2.3.0` · Pages built xanh
> Live: <https://teefan.github.io/quick-japanese/> · Repo: `teefan/quick-japanese`
> (bản đầy đủ trước khi thu hẹp nằm ở git history, commit `10532f5` / tag không có — dùng `git log`)

Đọc file này trước khi bắt đầu code. Chi tiết đầy đủ nằm ở [`PLAN.md`](PLAN.md);
quy ước phiên âm ở [`PRONUNCIATION.md`](PRONUNCIATION.md); checklist kiểm duyệt bản ngữ ở
[`REVIEW-CHECKLIST.md`](REVIEW-CHECKLIST.md).

## 0. TL;DR

- **SPA tĩnh, vanilla JS**, không framework/bundler. Dữ liệu nguồn là JSON → `npm run build` →
  `data/*.js` (biến toàn cục `window.QJ.*`). Không sửa tay `data/*.js`.
- **v2.0.0 thu hẹp còn 2 tab**: **Ghép câu 🧩** (15 cây / 4 nhóm) và **Từ vựng 📚**
  (744 từ: 183 biên tập + 561 N5; câu ví dụ + trọng âm + số đếm & mệnh giá).
  Đã bỏ hẳn: cụm từ, sổ tay, ngữ pháp, quiz “Nghe & chọn”, tìm kiếm toàn cục.
- **Mọi câu ghép** được ráp từ cây ý định thu hẹp dần; câu cố định trong cây được bóc tách
  thành mảnh, tô màu theo vai trò ngữ pháp, kèm phiên âm Việt + romaji. Hiện có **~1.120 câu có thể
  ghép** từ 15 cây; **128 từ biên tập + 37 từ N5** được dùng làm option.
- **Liên kết hai tab**: thẻ từ vựng có chip “🧩 Ghép câu” trỏ tới các mục dùng từ đó
  (`data/builder-index.js`, sinh tự động).
- **Từ vựng N5** nằm ở `data/vocab-n5.js` — tải nền khi trang rảnh, phân trang 60 từ/lần,
  460 từ có câu ví dụ Tatoeba, 726 từ có pitch accent (Kanjium).
- **PWA offline**: `sw.js` network-first cho HTML, cache-first cho assets, fonts SWR.
- Kiểm thử chuẩn: 15 cây × 3 đường ngẫu nhiên = **45/45**, thẻ N5 hiện ví dụ + trọng âm,
  không lỗi JS.

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
assets/js/app.js           2 tab: Ghép câu, Từ vựng + TTS + modal + PWA register
assets/js/builder.js       engine builder (cây ý định, structure panel, GROUP_ORDER)
data/source/*.json         dữ liệu gốc: vocab, vocab-n5, vocab-n5-examples, accents, intents, numbers
data/*.js                  SINH TỰ ĐỘNG — không sửa tay; vocab-n5.js tải nền, không có trong index.html;
                           builder-index.js: từ vựng → mục ghép câu dùng từ đó (chip ở tab Từ vựng)
tools/kana.js              kana → romaji / phiên âm Việt / chia động từ
tools/segment.js           từ điển + tokenizer DP bóc tách câu
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
  `tags: ["n5"]`, động từ dùng `dict`/`kana`/`group`. Từ kana-only bỏ `jp` (build tự lấy `kana`).
- Nghĩa tiếng Việt do dự án biên tập; khi sửa phải giữ đúng `kana` gốc.
- File này **không** đi vào `buildLexicon` chung — chỉ sinh `data/vocab-n5.js` cho tab Từ vựng.
  **Từ v2.1.0 builder có thể tham chiếu thẳng id N5** (`"ref": "n5-…"`): build chỉ đưa **đúng
  những từ N5 được ref** vào lexicon của builder và tự audit — nếu cách tách câu cố định nào đổi,
  build in ghi chú để rà lại (hiện 18 từ, 0 câu đổi). Từ N5 dùng được cả `form` (chia sẵn như từ biên tập).

### Câu ví dụ N5 — `data/source/vocab-n5-examples.json`
```jsonc
"n5-ada066edfd": {
  "jp": "じゃあパーティーで会いましょう。",
  "furi": "じゃあパーティーで{会|あ}いましょう。", // furigana gốc — nguồn chuẩn cho kana + literal
  "kana": "じゃあパーティーであいましょう。",
  "vi": "Vậy hẹn gặp nhau ở bữa tiệc nhé.",
  "tatoeba": 215904
}
```
- Build gắn `examples` (jp/kana/roma/viPron/vi) vào từ tương ứng; **bỏ qua** nếu thiếu dữ liệu.
- `furi` bắt buộc: build dùng nó để biết ký tự nào là kana viết thẳng (chỗ có thể là trợ từ) và
  sinh phiên âm đúng (`は`→oa, `へ`→ê) mà không nhầm cách đọc kanji (母は `ははは` → `ha-ha-oa`).
- Từ kana dễ bị tách nhầm thành trợ từ (はっきり, はかり…) thêm vào `EXAMPLE_EXTRA_KANA` trong
  `tools/build.js`. Câu lấy từ Tatoeba (CC BY 2.0 FR) qua OpenJLPT v0.3.0; xem `docs/PLAN.md` §11.

### Trọng âm — `data/source/accents.json`
```jsonc
"items": { "n-mizu": 0, "d-kore": 0, "n5-7ce7f7d305": 1 }
```
- Khoá là id từ vựng; giá trị `n` = xuống giọng sau mora thứ n, `0` = heiban. Build gắn `accent`
  và cảnh báo nếu id lạ.
- Nguồn: Kanjium `data/source_files/raw/accents.txt` (124.137 từ, CC BY-SA 4.0). Script nhập một lần
  ở `/tmp/opencode/import-accents.py` (không commit): khớp chính xác `(jp, kana)` → cùng reading →
  từ katakana; từ kana-only ưu tiên ứng viên cùng reading (これ [0], không phải thán từ [1]);
  21 từ nhập nhằng chọn tay trong chính ứng viên Kanjium; trợ từ より bị loại.
- 18 từ (スマホ, ごめんなさい…) chưa có dữ liệu → app không hiện trọng âm.

### Thêm/sửa cây ghép câu — `data/source/intents.json`
- Mỗi cây: `id`, `emoji`, `label`, `desc`, `group` (1 trong 4 nhóm), `start`, `steps`,
  `template`/`viTemplate` (null nếu chỉ ghép câu cố định), `tip`.
- Option có thể là: `ref` (+ `form`: `dict|masu|masen|mashita|te|tai|potential`), `silent`
  (chỉ chọn nhánh), hoặc câu cố định (`jp`/`kana`/`vi` + override `roma`/`viPron`).
- Nâng cao: `particle` (override trợ từ), `templateOverride`, `viTemplateOverride`, `note`, `hint`.
- Câu cố định được **tách mảnh tự động** khi build nếu từ điển đủ; nếu không, build ghi chú ở mục
  “Option cố định chưa tách được” (không phải lỗi — câu đó hiện 1 dòng).
- **Thứ tự cây trong nhóm = thứ tự mảng** trong file.
- Không còn trường `grammar` (đã bỏ cùng tab Ngữ pháp v2.0.0).

### Thêm từ cho bộ tách câu — `tools/segment.js`
- Thêm vào `EXPRESSIONS` (kana/jp/vi/note/role) và `EXPR_ROLE` nếu là danh từ/động từ/tính từ/trạng từ.
  Sau đó build lại để câu cố định được tách mảnh.

## 4. Quy ước phải giữ

- **Phiên âm Việt**: sinh tự động bởi `tools/kana.js`, xem `docs/PRONUNCIATION.md`. Không gõ tay.
- **Romaji**: Hepburn, trường âm kiểu Wāpuro (`toukyou`, `koohii`); trợ từ đọc thật (`wa`, `e`, `o`).
- **Màu vai trò** (`role`): `pron`, `noun`, `verb`, `adj`, `adverb`, `particle`, `copula`,
  `number`, `expression`, `unknown`. Thêm role mới ⇒ sửa cả CSS `--rl-*` (light + dark) và
  `EXPR_ROLE`/lexicon (segment.js).
- **Thứ tự nhóm builder**: `GROUP_ORDER` trong `builder.js` (cố định, cơ bản nhất trước).
- **Lịch sự**: chỉ です/ます trong câu chuẩn; thể thân mật chỉ để trong `note`.
- **Dữ liệu sinh ra**: compact JSON + bỏ field rỗng (prune). Đừng sửa `data/*.js`.
- **N5 tách rời**: `vocab-n5` không đi vào lexicon chung; builder chỉ nhận **các từ N5 được ref
  trong intents.json** (kèm audit tự động), nhờ vậy không đổi cách tách câu của nội dung cũ.
  Riêng câu ví dụ dùng **lexicon cục bộ** (curated + N5 + `EXAMPLE_EXTRA_KANA`) chỉ để sinh
  phiên âm, không ảnh hưởng kết quả tách câu của cây ghép.
- **Furigana câu ví dụ**: build đọc `{漢|かん}` để lấy kana; chỉ ghi đè は/へ khi ký tự đó là kana
  viết thẳng và token đúng là trợ từ.
- **Trọng âm**: chỉ hiển thị khi `accent` tồn tại; mora cao = `i ≥ 2` và (`accent = 0` hoặc `i ≤ accent`),
  riêng `accent = 1` thì mora 1 cao; ↓ sau mora `min(accent, số mora)`.
- **Chỉ mục builder**: `data/builder-index.js` sinh từ intents (ref → mục dùng từ); thẻ từ vựng đọc
  `QJ.builderIndex` để hiện chip “🧩 Ghép câu” — không sửa tay, build lại là tự cập nhật.
- **Mỗi lần release**: bump `VERSION` trong `sw.js` (`qj-vX.Y.Z`), chạy build, commit, push main.

## 5. Kiểm thử & deploy

1. `npm run build` — phải **0 cảnh báo** (còn vài ghi chú thống kê: ví dụ N5, N5 refs trong
   builder, trọng âm).
2. `node --check` các file JS đã sửa.
3. Mở app (nhớ xoá SW khi test): kiểm 2 tab, **Ghép câu** (chạy ngẫu nhiên vài cây, câu cố định
   hiện bảng cấu trúc), **Từ vựng** (chip lọc, phân trang, tìm kiếm, câu ví dụ + 🔊, trọng âm
   `[n]` + gạch trên + ↓, thẻ N5 tải nền), nút 🔊 / 📺 / 📋, không lỗi JS.
4. Release regression (khuyến nghị): vòng lặp tất cả cây × 3 đường 🎲, kiểm tra `.b-jp`, `.b-brk`,
   `.done-badge`, không lỗi JS (`window.__errs`).
5. `git push origin main` → GitHub Pages tự build. Kiểm tra:
   `gh api repos/teefan/quick-japanese/pages/builds/latest --jq '.status + " " + .commit'`
   và curl `https://teefan.github.io/quick-japanese/sw.js` để xác nhận VERSION mới.

## 6. Trạng thái & việc còn lại

- **v2.0.0** đã thu hẹp sản phẩm còn **Ghép câu + Từ vựng**; code/dữ liệu của các tính năng cũ
  nằm trong git history (commit `10532f5` trở về trước).
- **v2.1.0 → v2.3.0** mở rộng builder theo nghiên cứu: N5 refs (37 từ, audit 0 đổi cách tách),
  Tier 1 (đầy option), Tier 2 (i-feel 365 câu, i-shop, nhánh thời tiết), nhánh ngôn ngữ trong
  i-respond, và liên kết hai tab (builder-index).
- Việc còn lại:
  1. **Kiểm duyệt bởi người bản ngữ** — dùng `docs/REVIEW-CHECKLIST.md` (cây ghép câu, lượng từ,
     phiên âm, nghĩa N5, câu ví dụ, trọng âm, các cặp tính từ × danh từ mới), sửa
     `data/source/*.json` + build.
  2. **Phase 3** (xem `PLAN.md` §10): URL chia sẻ câu ghép (`#s=…`), lưu thẻ thành ảnh,
     gói audio offline, OCR menu (tùy chọn), giao diện tiếng Anh.
- **Tồn đã biết**: nghĩa 561 từ N5 + 460 câu ví dụ + 726 trọng âm chờ kiểm duyệt; 101 từ N5 chưa
  có câu ví dụ; 18 từ chưa có trọng âm; file N5 tải nền ≈ 264 KB (vẫn lazy, không vào payload đầu).

## 7. Lịch sử quyết định ngắn

- Builder là **deterministic**, không dùng AI — lý do ở `PLAN.md` §6.3.
- Bóc tách câu bằng **quy hoạch động có trọng số** (tránh lỗi tham lam `はいくら` → `はい+くら`) — §6.4.
- Thứ tự nhóm/cây theo **độ cơ bản** (Giao tiếp lên đầu) — commit `8de933d`.
- N5 để ở file riêng tải nền (idle) thay vì nhét chung `vocab.js`: giữ payload đầu nhẹ và
  **không đụng vào kết quả tách câu** đã kiểm duyệt.
- Câu ví dụ N5 giữ **furigana gốc** trong source thay vì chỉ kana: build suy ra kana và chỉ đọc
  は/へ thành trợ từ khi ký tự đó là kana viết thẳng; thà thiếu ví dụ (101 từ) còn hơn nhập câu
  thân mật/phản cảm.
- Trọng âm dùng **Kanjium accents.txt** (CC BY-SA 4.0, 124k từ): dữ liệu mở, có sẵn số accent
  theo mora; từ kana-only ưu tiên ứng viên cùng reading; 18 từ thiếu dữ liệu thì **không hiện**
  trọng âm (không đoán).
- **`が` với たい**: `i-want` giữ `[object:が] + たい` (chuẩn giáo trình Genki/Minna: 水が飲みたいです).
  `を` cũng đúng và ngày càng phổ biến; giữ が cho nhất quán, để người bản ngữ xác nhận trong
  `REVIEW-CHECKLIST.md` (nếu đổi chỉ cần sửa `particle` ở template `i-want`).
- **v2.0.0 thu hẹp sản phẩm** theo yêu cầu: bỏ cụm từ, sổ tay, ngữ pháp, quiz, tìm kiếm toàn cục;
  xoá luôn dữ liệu/grammar refs để không còn code chết (grammar metadata trong `segment.js`,
  `grammar` array trong intents, CSS/JS của các tính năng cũ).
- **N5 vào builder (v2.1.0)**: cho phép `ref` trỏ thẳng id N5 thay vì phải chép sang `vocab.json`;
  builder chỉ nạp **các từ N5 được tham chiếu** và build audit lại — thử nghiệm 100 từ cho
  0/98 câu cố định đổi cách tách, thực tế 18 từ cũng 0 câu đổi. Tránh nhân bản dữ liệu và giữ
  nguyên nguyên tắc "N5 không đụng nội dung đã kiểm duyệt".
