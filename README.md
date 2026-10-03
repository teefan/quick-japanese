# Quick Japanese 🗾

**Sổ tay tiếng Nhật sinh tồn cho người Việt đi du lịch.** Mở trang là dùng được ngay:
tìm câu, nghe đọc, đưa màn hình cho người Nhật xem — hoặc tự ghép câu mới từ những mảnh có sẵn.

🌐 **Dùng thử: <https://teefan.github.io/quick-japanese/>** · 📲 Cài như app (PWA) và dùng offline.

- 🇻🇳 Giao diện, nghĩa và **phiên âm tiếng Việt** cho mọi câu (kiểu `xư-mi-ma-xen`, `côn-ni-chi-oa`)
  — kèm **romaji chính thức** (Hepburn) song song: `sumimasen`, `konnichiwa`.
- 🧩 **Ghép câu thu hẹp dần** (13 mục, gom theo nhóm: Giao tiếp · Ăn uống & mua sắm · Đi lại & khách sạn ·
  Sức khỏe & sự cố): chọn “Tôi” → app chỉ hiện những gì có thể nối tiếp → chọn “muốn” → chọn món…
  Câu tiếng Nhật tự ráp đúng trợ từ (は, が, を, に…), kèm furigana và giải thích ngay trên từng trợ từ.
  Bao gồm cả chào hỏi, **cảm ơn (kể cả mẫu 〜てくれてありがとう “cảm ơn vì đã…”)**, xin lỗi,
  trả lời/không hiểu, khách sạn, đau ốm – mất đồ – gọi giúp khẩn cấp.
- 🔬 **Bóc tách ngữ pháp từng câu**: mọi cụm từ và câu ghép đều được chia thành các mảnh
  (từ + trợ từ) **tô màu theo vai trò ngữ pháp** (đại từ, danh từ, động từ, tính từ, trợ từ,
  です, số đếm…), kèm phiên âm Việt + romaji, nghĩa, loại từ/thể và giải thích ngữ pháp —
  bấm vào mảnh để làm nổi dòng giải thích, bấm 📝 để mở điểm ngữ pháp. Bộ tách từ + chú giải
  nằm ở `tools/segment.js`; bảng màu xem trong tab Ngữ pháp.
- 🎧 **Nghe & chọn**: luyện tai 10 câu một lượt từ cụm từ hoặc từ vựng — nghe giọng Nhật, chọn
  nghĩa đúng, biết đáp án ngay; cuối lượt có danh sách câu cần ôn và điểm cao lưu trên máy.
  Máy không hỗ trợ đọc tiếng Nhật thì tự chuyển sang chế độ **Đọc & chọn**.
- ⭐ **Sổ tay của tôi**: lưu cụm từ và câu tự ghép (localStorage) để mở nhanh khi đi du lịch;
  **xuất / nhập JSON** để sao lưu hoặc chuyển sang máy khác.
- 🔍 **Tìm kiếm toàn bộ**: cụm từ, từ vựng, ngữ pháp và mục ghép câu trong một ô tìm kiếm.
- 🔊 Đọc tiếng Nhật bằng giọng máy (Web Speech API) trên mọi câu và câu tự ghép.
- 📺 **Chế độ đưa máy**: chữ Nhật cỡ lớn để chỉ cho nhân viên/tài xế xem.
- 📚 **744 từ vựng** (183 từ du lịch biên tập tay + 561 từ JLPT N5 tải nền theo nhu cầu) —
  **460 từ N5 kèm câu ví dụ** lấy từ Tatoeba, có phiên âm Việt + romaji + nghĩa tiếng Việt;
  **trọng âm (pitch accent) cho 726 từ** — kana với mora cao có gạch trên, dấu ↓ xuống giọng và
  số `[n]`, kèm chú giải trong tab Ngữ pháp; lượng từ đếm 1–10, mệnh giá tiền, 22 điểm ngữ pháp.
- 📶 **PWA offline**: service worker cache toàn bộ app — không cần mạng khi đã mở một lần.
- 📴 Không cần server, không cần build khi dùng, chạy được cả khi mở trực tiếp `index.html`.

![Giao diện ghép câu](docs/screenshot.png)

## Dùng ngay

```bash
# Cách 1: mở thẳng file
xdg-open index.html        # macOS: open index.html

# Cách 2: chạy server tĩnh (khuyến nghị, để test đầy đủ)
npm run serve              # http://localhost:8080
```

## Cấu trúc

```
index.html                 trang chính (load data + app)
manifest.webmanifest       khai báo PWA (cài như app)
sw.js                      service worker — cache offline
assets/css/style.css       giao diện, mobile-first, có dark mode
assets/js/app.js           5 tab: Cụm từ, Ghép câu, Sổ tay, Từ vựng, Ngữ pháp + tìm kiếm + Nghe & chọn + TTS
assets/js/builder.js       engine ghép câu (cây ý định thu hẹp dần)
assets/icons/              icon PWA (SVG gốc + PNG 192/512)
data/source/*.json         dữ liệu gốc để biên tập (từ vựng, vocab-n5, câu ví dụ N5, trọng âm, cụm từ, ngữ pháp, cây câu, số đếm)
data/*.js                  dữ liệu đã sinh — window.QJ.* (đừng sửa tay); vocab-n5.js tải theo nhu cầu
tools/kana.js              kana → romaji / phiên âm Việt / chia động từ
tools/segment.js           bóc tách câu: từ điển + tokenizer DP
tools/build.js             kiểm tra + làm giàu dữ liệu, xuất data/*.js
docs/PLAN.md               kế hoạch tổng thể, thiết kế dữ liệu, lộ trình
docs/DEV-CONTEXT.md        bối cảnh & hướng dẫn cho phiên phát triển mới (đọc trước khi code)
docs/PRONUNCIATION.md      quy ước phiên âm tiếng Việt
docs/REVIEW-CHECKLIST.md   checklist kiểm duyệt bởi người bản ngữ
```

## Thêm nội dung

1. Sửa file trong `data/source/` (JSON, có thể review diff dễ dàng).
2. Chạy `npm run build` — script sẽ:
   - sinh phiên âm Việt + romaji cho mọi mục mới,
   - chia động từ mới thành ます / て / たい / khả năng…,
   - kiểm tra lỗi: trùng id, thiếu kana, cây câu trỏ sai bước, tham chiếu từ vựng không tồn tại.
3. Nếu thêm câu chứa trợ từ đọc đặc biệt (`は` → “oa”), thêm `viPron` viết tay kèm ghi chú.

## Triển khai GitHub Pages

1. Đẩy repo lên GitHub.
2. **Settings → Pages → Deploy from a branch → `main` / `(root)`**.
3. Xong — trang chạy tại `https://<user>.github.io/<repo>/`.

Gợi ý giai đoạn sau: thêm service worker để dùng offline hoàn toàn (xem lộ trình trong
[`docs/PLAN.md`](docs/PLAN.md)).

## Giấy phép

Mã nguồn: MIT. Nội dung (cụm từ, từ vựng, ngữ pháp) được biên soạn thủ công cho dự án này;
561 từ vựng JLPT N5 lấy từ [OpenJLPT](https://github.com/evanclan/OpenJLPT) (CC BY-SA 4.0),
nghĩa tiếng Việt do dự án biên tập. **Câu ví dụ** lấy từ [Tatoeba](https://tatoeba.org)
(CC BY 2.0 FR) qua OpenJLPT; **trọng âm** lấy từ [Kanjium](https://github.com/mifunetoshiro/kanjium)
(CC BY-SA 4.0, ghi công Uros O.); bản dịch/nội dung tiếng Việt do dự án biên tập — xem chi tiết
giấy phép và ghi công trong [`docs/PLAN.md`](docs/PLAN.md) mục 11.
