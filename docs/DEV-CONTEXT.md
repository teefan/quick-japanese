# Bối cảnh cho phiên phát triển mới

> Cập nhật: 2026-10-03 · commit `9074a6c` · SW cache `qj-v1.3.0` · Pages built xanh
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
- Số liệu hiện tại: **183 từ vựng · 167 cụm từ (12 nhóm) · 22 điểm ngữ pháp · 13 cây · 6 lượng từ**.
- Kiểm thử chuẩn: 13 cây × 3 đường ngẫu nhiên = **39/39**, không lỗi JS.

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
data/source/*.json         dữ liệu gốc: vocab, phrases, grammar, intents, numbers
data/*.js                  SINH TỰ ĐỘNG — không sửa tay
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
- **Mỗi lần release**: bump `VERSION` trong `sw.js` (`qj-vX.Y.Z`), chạy build, commit, push main.

## 5. Kiểm thử & deploy

1. `npm run build` — phải **0 cảnh báo** (1 ghi chú fallback `ご迷惑をおかけしました` là bình thường).
2. `node --check` các file JS đã sửa.
3. Mở app (nhớ xoá SW khi test): kiểm 5 tab, tìm kiếm, builder chạy ngẫu nhiên vài cây, lưu Sổ tay,
   và **Nghe & chọn**: chạy hết 1 lượt ở cả 2 nguồn (cụm từ / từ vựng), thử 🔊 nghe lại + phím 1–4.
4. Release regression (khuyến nghị): vòng lặp tất cả cây × 3 đường 🎲, kiểm tra `.b-jp`, `.b-brk`,
   kết thúc 1 lượt quiz ở cả 2 nguồn, không lỗi JS (`window.__errs`).
5. `git push origin main` → GitHub Pages tự build. Kiểm tra:
   `gh api repos/teefan/quick-japanese/pages/builds/latest --jq '.status + " " + .commit'`
   và curl `https://teefan.github.io/quick-japanese/sw.js` để xác nhận VERSION mới.

## 6. Trạng thái & việc còn lại

- **Phase 1** gần xong; việc duy nhất còn lại là **kiểm duyệt bởi người bản ngữ** — dùng
  `docs/REVIEW-CHECKLIST.md`, sửa `data/source/*.json` + build là xong.
- **Phase 2 gợi ý** (xem `PLAN.md` §10): ✅ **Nghe & chọn** (v1.3.0, quiz 2 nguồn + fallback Đọc & chọn);
  còn lại: mở rộng đủ N5 (662 từ) từ OpenJLPT + nghĩa Việt biên tập, câu ví dụ Tatoeba,
  lượng từ 1–10, pitch accent, export/import Sổ tay.
- **Tồn đã biết**: `ご迷惑をおかけしました` chưa tách mảnh (fallback 1 dòng); nhánh taxi vẫn cho chọn
  `トイレ` (chấp nhận được); payload ≈ 415 KB (có thể nén/nâng cấp sau).

## 7. Lịch sử quyết định ngắn

- Builder là **deterministic**, không dùng AI — lý do ở `PLAN.md` §6.3.
- Bóc tách câu bằng **quy hoạch động có trọng số** (tránh lỗi tham lam `はいくら` → `はい+くら`) — §6.4.
- Audit builder v1.2.4 (độ chính xác, nhất quán, override, chip ngữ pháp, payload) — §6.5.
- Thứ tự nhóm/cây theo **độ cơ bản** (Giao tiếp lên đầu) — commit `8de933d`.
- “Nghe & chọn” là **quiz deterministic** từ dữ liệu sẵn có (không thêm dữ liệu, không AI); TTS chỉ là
  enhancement — máy thiếu giọng Nhật thì tự chuyển sang Đọc & chọn; không thêm tab để giữ IA 5 tab.
