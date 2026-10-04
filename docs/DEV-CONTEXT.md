# Bối cảnh cho phiên phát triển mới

> Cập nhật: 2026-10-03 · commit `da1b445` · SW cache `qj-v2.7.0` · Pages built xanh
> Live: <https://teefan.github.io/quick-japanese/> · Repo: `teefan/quick-japanese`
> (bản đầy đủ trước khi thu hẹp nằm ở git history, commit `10532f5` / tag không có — dùng `git log`)

Đọc file này trước khi bắt đầu code. Chi tiết đầy đủ nằm ở [`PLAN.md`](PLAN.md);
quy ước phiên âm ở [`PRONUNCIATION.md`](PRONUNCIATION.md).

## 0. TL;DR

- **SPA tĩnh, vanilla JS**, không framework/bundler. Dữ liệu nguồn là JSON → `npm run build` →
  `data/*.js` (biến toàn cục `window.QJ.*`). Không sửa tay `data/*.js`.
- **v2.0.0 thu hẹp còn 2 tab**: **Ghép câu 🧩** (16 cây / 4 nhóm) và **Từ vựng 📚**
  (747 từ: 186 biên tập + 561 N5; câu ví dụ + trọng âm + số đếm & mệnh giá).
  Đã bỏ hẳn: cụm từ, sổ tay, ngữ pháp, quiz “Nghe & chọn”, tìm kiếm toàn cục;
  **v2.4.0 bỏ thêm** chế độ “Đưa máy” và “Copy” (câu xong chỉ còn 🔊 Nghe).
- **Mọi câu ghép** được ráp từ cây ý định thu hẹp dần; câu cố định trong cây được bóc tách
  thành mảnh, tô màu theo vai trò ngữ pháp, kèm phiên âm Việt + romaji. Hiện có **1.266 câu có thể
  ghép** từ 16 cây; **130 từ biên tập + 39 từ N5** được dùng làm option. Trang chủ Ghép câu có
  **⚡ Chọn nhanh** (6 việc hay dùng → mở thẳng cây), nhóm đặt tên theo cảnh, cây trong nhóm
  xếp theo tần suất (thứ tự mảng trong `intents.json`).
- **Liên kết hai tab**: thẻ từ vựng có chip “🧩 Ghép câu” trỏ tới các mục dùng từ đó
  (`data/builder-index.js`, sinh tự động).
- **Nghe & đáp 🗣️**: 3 tình huống **nhân viên nói trước** (nhà hàng, cửa hàng, khách sạn) kèm câu
  đáp; câu ghép xong có thêm gợi ý “Người Nhật có thể nói” cho i-please / i-where / i-hotel / i-pay.
- **Từ vựng N5** nằm ở `data/vocab-n5.js` — tải nền khi trang rảnh, phân trang 60 từ/lần,
  460 từ có câu ví dụ Tatoeba, 726 từ có pitch accent (Kanjium).
- **PWA offline**: `sw.js` network-first cho HTML, cache-first cho assets, fonts SWR.
- **Giao diện**: nền sáng là mặc định (không theo `prefers-color-scheme`), có nút 🌙/☀️ ở header
  nhớ lựa chọn trong `localStorage` (`qj-theme`); màu accent/vai trò đạt tương phản AA.
- Kiểm thử chuẩn: `npm run build` chạy `tools/audit.js` soát **toàn bộ 1.266 đường ghép câu**;
  vẫn 🎲 vài cây để kiểm UI/TTS, thẻ N5 hiện ví dụ + trọng âm, không lỗi JS.

## 1. Lệnh thường dùng

```bash
npm run build      # node tools/build.js + node tools/audit.js — bắt buộc sau mọi thay đổi data/source
npm run audit      # soát toàn bộ đường ghép câu + slot/template (không cần build lại)
npm run serve      # python3 -m http.server 8080
node --check assets/js/assemble.js assets/js/builder.js assets/js/app.js tools/*.js   # kiểm tra cú pháp
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
assets/js/app.js           2 tab: Ghép câu, Từ vựng + TTS + chủ đề sáng/tối + PWA register
assets/js/assemble.js      logic ráp câu thuần (không DOM) — builder + audit dùng chung
assets/js/builder.js       engine builder (cây ý định, structure panel, GROUP_ORDER)
data/source/*.json         dữ liệu gốc: vocab, vocab-n5, vocab-n5-examples, accents, intents, exchanges, numbers
data/*.js                  SINH TỰ ĐỘNG — không sửa tay; vocab-n5.js tải nền, không có trong index.html;
                           builder-index.js: từ vựng → mục ghép câu dùng từ đó (chip ở tab Từ vựng);
                           exchanges.js: tình huống “nhân viên nói trước” (module Nghe & đáp)
tools/kana.js              kana → romaji / phiên âm Việt / chia động từ
tools/segment.js           từ điển + tokenizer DP bóc tách câu
tools/build.js             validate + enrich + xuất data/*.js
tools/audit.js             soát mọi đường ghép câu + slot/template (build gọi tự động)
docs/                      PLAN, DEV-CONTEXT (file này), PRONUNCIATION, screenshot
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
- 21 từ (Kyoto, Osaka, Shinjuku, スマホ, ごめんなさい…) chưa có dữ liệu → app không hiện trọng âm.

### Thêm/sửa cây ghép câu — `data/source/intents.json`
- Mỗi cây: `id`, `emoji`, `label`, `desc`, `group` (1 trong 4 nhóm), `start`, `steps`,
  `template`/`viTemplate` (null nếu chỉ ghép câu cố định), `tip`.
- Option có thể là: `ref` (+ `form`: `dict|masu|masen|mashita|te|tai|potential`), `silent`
  (chỉ chọn nhánh), hoặc câu cố định (`jp`/`kana`/`vi` + override `roma`/`viPron`).
- Lượng từ: `{ "counter": "c-hai", "counts": [1, 2, 3, 4, 5], "next": null }` — build nở thành
  câu cố định từ `data/source/numbers.json` (đúng cách đọc いっぱい/さんばい, kèm roma + phiên âm).
  Option lượng từ chỉ có `counter`/`counts`/`next`; `counts` bỏ trống = lấy cả 10 mục.
- Nâng cao: `particle` (override trợ từ), `templateOverride`, `viTemplateOverride`, `note`, `hint`.
- Câu cố định được **tách mảnh tự động** khi build nếu từ điển đủ; nếu không, build ghi chú ở mục
  “Option cố định chưa tách được” (không phải lỗi — câu đó hiện 1 dòng).
- **Không đặt `particle` ở cấp step** — engine không đọc field này (đã xoá khỏi dữ liệu; audit báo
  lỗi nếu thêm lại). Trợ từ đặt ở `template`/`templateOverride` (mặc định) hoặc `particle` của option.
- Cây **không có `template`** (nối nhiều câu cố định): engine tự chèn `。` giữa hai mảnh nếu mảnh
  trước chưa kết câu (`assets/js/assemble.js`); audit kiểm lại từng đường.
- **Thứ tự cây trong nhóm = thứ tự mảng** trong file.
- Không còn trường `grammar` (đã bỏ cùng tab Ngữ pháp v2.0.0).
- `replies` (tuỳ chọn): các câu **người Nhật có thể đáp** sau khi mình nói câu này; app hiện ở cuối
  trang khi câu đã xong (khối “🗣️ Người Nhật có thể nói”).
- Sau khi sửa luôn chạy `npm run build`: audit sẽ báo slot không tồn tại, nhãn trùng, vi lặp từ,
  field chết, mảnh tách thiếu ký tự… (xem §5).

### Nghe & đáp (nhân viên nói trước) — `data/source/exchanges.json`
```jsonc
{
  "id": "x-restaurant", "emoji": "🍜", "label": "Ở nhà hàng",
  "desc": "Được chào, hỏi số người, gọi món, thanh toán", "group": "Ăn uống, mua sắm & thanh toán",
  "exchanges": [
    {
      "heard": { "jp": "何名様ですか", "kana": "なんめいさまですか", "vi": "Quý khách đi mấy người ạ?" },
      "note": "tuỳ chọn — mẹo, hoặc lý do không cần đáp",
      "answers": [ { "jp": "一人です", "kana": "ひとりです", "vi": "Một người" } ]
    }
  ]
}
```
- Dành cho tình huống **nhân viên nói trước** (nhà hàng, cửa hàng, khách sạn…): hiện câu họ có thể
  nói (to, có furigana + phiên âm + 🔊) và các câu mình có thể đáp. `jp/kana/vi` bắt buộc.
- `roma`/`viPron` do build sinh, đúng trợ từ は→oa, へ→ê nhờ lexicon nói riêng; thêm cụm mới vào
  `SPOKEN_EXTRA` trong `tools/build.js` (không đụng lexicon builder) hoặc ghi đè tay khi cần.
- Audit kiểm mỗi tình huống có id/label, mỗi câu đủ dữ liệu + đã enrich.

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
- **Chủ đề**: nền sáng là mặc định — không thêm `prefers-color-scheme`; nền tối chỉ qua
  `:root[data-theme="dark"]` + nút `#theme-toggle` (nhớ trong `localStorage.qj-theme`).
- **Hành động ở câu đã xong**: chỉ giữ 🔊 Nghe (Đưa máy/Copy đã bỏ ở v2.4.0 — đừng thêm lại
  nếu chưa bàn; “lưu thành ảnh” là hướng thay thế trong Phase 3).
- **Câu nói nghe/đáp** (`replies`, `exchanges`): không gõ phiên âm tay — dùng `enrichSpoken`
  trong build (tách mảnh bằng lexicon nói riêng) để は→oa, へ→ê; chỉ ghi đè `roma`/`viPron` khi
  từ/cụm chưa có trong `SPOKEN_EXTRA`.
- **Mỗi lần release**: bump `VERSION` trong `sw.js` (`qj-vX.Y.Z`), chạy build, commit, push main.

## 5. Kiểm thử & deploy

1. `npm run build` — build phải **0 cảnh báo** (còn vài ghi chú thống kê: ví dụ N5, N5 refs trong
   builder, trọng âm); `tools/audit.js` phải **0 lỗi** (soát toàn bộ đường ghép câu) và nên 0 cảnh báo.
2. `node --check` các file JS đã sửa.
3. Mở app (nhớ xoá SW khi test): kiểm 2 tab, **Ghép câu** (chạy ngẫu nhiên vài cây, câu cố định
   hiện bảng cấu trúc, câu xong hiện **replies** nếu có), **Nghe & đáp** ở trang chủ (mở 1 tình
   huống, kiểm furigana/phiên âm/nút 🔊), **Từ vựng** (chip lọc, phân trang, tìm kiếm, câu ví dụ +
   🔊, trọng âm `[n]` + gạch trên + ↓, thẻ N5 tải nền), nút 🔊, nút 🌙 đổi nền tối
   (nhớ lựa chọn, mặc định sáng), không lỗi JS.
4. Release regression: `npm run audit` đã phủ **toàn bộ 1.266 đường**; vẫn nên 🎲 vài cây để kiểm
   UI, TTS và bảng cấu trúc.
5. `git push origin main` → GitHub Pages tự build. Kiểm tra:
   `gh api repos/teefan/quick-japanese/pages/builds/latest --jq '.status + " " + .commit'`
   và curl `https://teefan.github.io/quick-japanese/sw.js` để xác nhận VERSION mới.

## 6. Trạng thái & việc còn lại

- **v2.0.0** đã thu hẹp sản phẩm còn **Ghép câu + Từ vựng**; code/dữ liệu của các tính năng cũ
  nằm trong git history (commit `10532f5` trở về trước).
- **v2.1.0 → v2.3.0** mở rộng builder theo nghiên cứu: N5 refs (37 từ, audit 0 đổi cách tách),
  Tier 1 (đầy option), Tier 2 (i-feel 365 câu, i-shop, nhánh thời tiết), nhánh ngôn ngữ trong
  i-respond, và liên kết hai tab (builder-index).
- **v2.4.0** sửa theo audit builder: tách logic ráp câu sang `assets/js/assemble.js` (builder +
  `tools/audit.js` dùng chung), chèn `。` giữa hai mảnh cố định (hết dính `お元気ですかはい…`),
  sửa `hơn hơn` ở i-shop và rò nghĩa phân biệt trong câu, thêm audit toàn bộ đường câu vào
  `npm run build`, gọn focus/aria-live, gợi ý khi chưa chọn + lọc danh sách dài; bỏ chế độ
  đưa máy/Copy và dòng nhắc thừa ở câu đã xong (chỉ còn nút 🔊 Nghe).
- **v2.5.0** giao diện washi–sakura–indigo: nền sáng mặc định (không theo hệ điều hành),
  nút 🌙/☀️ đổi nền tối có nhớ lựa chọn; họa tiết sóng seigaiha ở header, logo có nụ hoa,
  gạch chân tiêu đề, nút hành động gradient; màu vai trò và accent chỉnh để đạt AA.
- **v2.6.0** vòng lặp hỏi–đáp: thêm `data/source/exchanges.json` + module **Nghe & đáp** ở trang chủ
  (3 tình huống, 20 cặp), thêm `replies` cho i-please/i-where/i-hotel; build sinh phiên âm đúng trợ
  từ bằng lexicon nói riêng (`SPOKEN_EXTRA`), audit kiểm luôn câu nói.
- **v2.7.0** bổ sung câu **mình chủ động**: cây mới **Thanh toán & hoá đơn** 🧾 (8 câu: お会計,
  別々, カード/現金, レシート, 袋は大丈夫です, 免税 + 5 `replies`); nhánh **Có … không?** trong i-shop
  (`〜はありますか`, 9 món/đồ) và nhánh **Tôi bị lạc đường** trong i-health (`道に迷いました`,
  `ここはどこですか`, `駅までどう行きますか`); i-shop đổi tên “Màu & cỡ” → “Hỏi khi mua đồ”.
- **v2.8.0** chỉnh theo review IA/builder: nhóm **đặt tên theo cảnh** (Giao tiếp cơ bản · Ăn uống,
  mua sắm & thanh toán · Đi lại & khách sạn · Sự cố & sức khỏe) và cây trong nhóm **xếp theo tần
  suất**; thêm **⚡ Chọn nhanh** ở trang Ghép câu (6 chip mở thẳng cây); i-can thu về **xin phép**
  (dv: 写真/入る/座る), chuyển カード/免税 về i-pay, 試着/持ち帰り về i-shop (nhánh “Thử & mang về”);
  i-feel tách “Món ăn” / “Đồ uống / tráng miệng” với bộ tính từ hợp lý (bỏ 酸っぱい/苦い khỏi món
  mặn, thêm あそこ); **lượng từ thật** trong i-please (つ/杯 1–5 nở từ `numbers.json`); sửa điểm đến
  tàu (Tokyo/Kyoto/Osaka/Shinjuku, bỏ khách sạn/đền/chùa/chợ/onsen), thêm 晴れ/曇り; bỏ câu trùng
  医者を呼んでください (giữ ở i-health); mặc định bước chủ ngữ = “Không cần chủ ngữ”.
  Tổng: **16 cây, 1.266 câu**.
- Việc còn lại:
  1. **Phase 3** (xem `PLAN.md` §10): URL chia sẻ câu ghép (`#s=…`), lưu thẻ thành ảnh,
     gói audio offline, OCR menu (tùy chọn), giao diện tiếng Anh.
  2. **Mở rộng Nghe & đáp** (theo nghiên cứu v2.6.0): tình huống ga/tàu & taxi (IC card, sân ga,
     điểm đến), hiệu thuốc/khẩn cấp, quầy miễn thuế (パスポート); thêm câu nhân viên hay nói
     (席へどうぞ, ラストオーダーです, お下げしてもいいですか, 試着室はこちらです, お荷物をお預かりしますか,
     温めますか, お箸お付けしますか); câu mình chủ động còn thiếu: `写真を撮ってもらえますか`,
     `切符はどこで買えますか`, `ICカードは使えますか`, `ここで止めてください`, `乗り換えはどこですか`,
     `英語は話せますか`.
- **Tồn đã biết**: 101 từ N5 chưa có câu ví dụ; 21 từ chưa có trọng âm; file N5 tải nền ≈ 264 KB
  (vẫn lazy, không vào payload đầu).

## 7. Lịch sử quyết định ngắn

- Builder là **deterministic**, không dùng AI — lý do ở `PLAN.md` §6.3.
- Bóc tách câu bằng **quy hoạch động có trọng số** (tránh lỗi tham lam `はいくら` → `はい+くら`) — §6.4.
- Thứ tự nhóm/cây theo **độ cơ bản** (Giao tiếp lên đầu) — commit `8de933d`.
- N5 để ở file riêng tải nền (idle) thay vì nhét chung `vocab.js`: giữ payload đầu nhẹ và
  **không đụng vào kết quả tách câu** đã ổn định.
- Câu ví dụ N5 giữ **furigana gốc** trong source thay vì chỉ kana: build suy ra kana và chỉ đọc
  は/へ thành trợ từ khi ký tự đó là kana viết thẳng; thà thiếu ví dụ (101 từ) còn hơn nhập câu
  thân mật/phản cảm.
- Trọng âm dùng **Kanjium accents.txt** (CC BY-SA 4.0, 124k từ): dữ liệu mở, có sẵn số accent
  theo mora; từ kana-only ưu tiên ứng viên cùng reading; 21 từ thiếu dữ liệu thì **không hiện**
  trọng âm (không đoán).
- **`が` với たい**: `i-want` giữ `[object:が] + たい` (chuẩn giáo trình Genki/Minna: 水が飲みたいです).
  `を` cũng đúng và ngày càng phổ biến; giữ が cho nhất quán (nếu đổi chỉ cần sửa `particle` ở
  template `i-want`).
- **v2.0.0 thu hẹp sản phẩm** theo yêu cầu: bỏ cụm từ, sổ tay, ngữ pháp, quiz, tìm kiếm toàn cục;
  xoá luôn dữ liệu/grammar refs để không còn code chết (grammar metadata trong `segment.js`,
  `grammar` array trong intents, CSS/JS của các tính năng cũ).
- **N5 vào builder (v2.1.0)**: cho phép `ref` trỏ thẳng id N5 thay vì phải chép sang `vocab.json`;
  builder chỉ nạp **các từ N5 được tham chiếu** và build audit lại — thử nghiệm 100 từ cho
  0/98 câu cố định đổi cách tách, thực tế 18 từ cũng 0 câu đổi. Tránh nhân bản dữ liệu và giữ
  nguyên nguyên tắc "N5 không đụng nội dung đã ổn định".
- **Audit tự động thay regression tay (v2.4.0)**: logic ráp câu nằm ở module dùng chung
  (`assets/js/assemble.js`) để `tools/audit.js` kiểm đúng thứ app chạy; **toàn bộ 1.266 đường
  câu** được soát trong `npm run build`, lỗi ⇒ exit 1 (slot trống, vi lặp từ, slot/template lệch,
  field chết, nhãn trùng).
- **Nền sáng mặc định (v2.5.0)**: app học ngôn ngữ cần nền sáng; nền tối là lựa chọn thủ công có
  nhớ, không theo hệ điều hành. Bảng màu washi–sakura–indigo; accent + màu vai trò chỉnh để đạt AA.
- **Giữ UI tối giản (v2.4.0)**: bỏ chế độ “Đưa máy”, “Copy”, dòng nhắc thừa và nút 🎲 trùng — câu đã
  xong chỉ còn 🔊 Nghe; mọi thêm mới phải thật cần thiết.
- **Vòng lặp hỏi–đáp (v2.6.0)**: câu ghép chỉ là một nửa cuộc nói chuyện; thêm lớp nhận biết
  (họ có thể nói gì) + tình huống họ nói trước. Không mở rộng engine — `replies`/`exchanges` là
  dữ liệu + UI, cây ý định giữ nguyên.
- **Tránh câu mơ hồ khi tách từ (v2.7.0)**: `袋はいりません` bị DP hiểu thành 袋 + 入りません
  (`はいりません` là thể phủ định của 入る, rẻ điểm hơn は + いりません); chọn `袋は大丈夫です`
  (tự nhiên hơn, không mơ hồ). Khi thêm câu cố định, xem mục “Option cố định chưa tách được” của build
  và kiểm phiên âm trợ từ bằng script nhỏ.
- **Nhóm theo cảnh + Chọn nhanh (v2.8.0)**: review IA cho thấy nhóm trộn hai trục (cảnh vs chức
  năng) và cây “khung câu” chiếm ~77% đường nhưng khó tìm; chọn cách **đặt tên nhóm theo cảnh**,
  giữ cây khung câu nhưng thêm chip việc-cần-ngay mở thẳng cây (`Builder.startWith`); i-can chỉ còn
  `〜てもいいですか`, câu dịch vụ về đúng cây; i-feel tách nhánh theo đồ ăn/đồ uống để bộ tính từ
  không sinh câu vô nghĩa (すしは苦いです…).
- **Lượng từ là dữ liệu, không chép tay (v2.8.0)**: i-please dùng option `counter` mới thay vì liệt
  kê 一つ/二つ/三つ; build nở từ `numbers.json` nên cách đọc biến âm (いっぱい, さんばい, よんはい)
  và phiên âm luôn khớp tab Từ vựng. Thêm lượng từ mới = sửa `numbers.json` rồi `npm run build`;
  chỉ dùng `counter`/`counts`/`next`, không kèm `ref`/`jp`/`kana` (build báo lỗi).
