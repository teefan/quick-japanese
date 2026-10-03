# Quick Japanese 🗾

**Sổ tay tiếng Nhật sinh tồn cho người Việt đi du lịch.** Mở trang là dùng được ngay:
tìm câu, nghe đọc, đưa màn hình cho người Nhật xem — hoặc tự ghép câu mới từ những mảnh có sẵn.

🌐 **Dùng thử: <https://teefan.github.io/quick-japanese/>** · 📲 Cài như app (PWA) và dùng offline.

- 🇻🇳 Giao diện, nghĩa và **phiên âm tiếng Việt** cho mọi câu (kiểu `xư-mi-ma-xen`, `côn-ni-chi-oa`)
  — kèm **romaji chính thức** (Hepburn) song song: `sumimasen`, `konnichiwa`.
- 🧩 **Ghép câu thu hẹp dần**: chọn “Tôi” → app chỉ hiện những gì có thể nối tiếp → chọn “muốn” → chọn món…
  Câu tiếng Nhật tự ráp đúng trợ từ (は, が, を, に…), kèm furigana và giải thích ngay trên từng trợ từ.
- 🔬 **Bóc tách ngữ pháp từng câu**: mọi cụm từ và câu ghép đều được chia thành các mảnh
  (từ + trợ từ) **tô màu theo vai trò ngữ pháp** (đại từ, danh từ, động từ, tính từ, trợ từ,
  です, số đếm…), kèm phiên âm Việt + romaji, nghĩa, loại từ/thể và giải thích ngữ pháp —
  bấm vào mảnh để làm nổi dòng giải thích, bấm 📝 để mở điểm ngữ pháp. Bộ tách từ + chú giải
  nằm ở `tools/segment.js`; bảng màu xem trong tab Ngữ pháp.
- ⭐ **Sổ tay của tôi**: lưu cụm từ và câu tự ghép (localStorage) để mở nhanh khi đi du lịch.
- 🔍 **Tìm kiếm toàn bộ**: cụm từ, từ vựng, ngữ pháp và mục ghép câu trong một ô tìm kiếm.
- 🔊 Đọc tiếng Nhật bằng giọng máy (Web Speech API) trên mọi câu và câu tự ghép.
- 📺 **Chế độ đưa máy**: chữ Nhật cỡ lớn để chỉ cho nhân viên/tài xế xem.
- 📚 173 từ vựng du lịch, 6 lượng từ đếm số, mệnh giá tiền, 22 điểm ngữ pháp tối giản.
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
assets/js/app.js           5 tab: Cụm từ, Ghép câu, Sổ tay, Từ vựng, Ngữ pháp + tìm kiếm + TTS
assets/js/builder.js       engine ghép câu (cây ý định thu hẹp dần)
assets/icons/              icon PWA (SVG gốc + PNG 192/512)
data/source/*.json         dữ liệu gốc để biên tập (từ vựng, cụm từ, ngữ pháp, cây câu, số đếm)
data/*.js                  dữ liệu đã sinh — window.QJ.* (đừng sửa tay)
tools/kana.js              kana → romaji / phiên âm Việt / chia động từ
tools/build.js             kiểm tra + làm giàu dữ liệu, xuất data/*.js
docs/PLAN.md               kế hoạch tổng thể, thiết kế dữ liệu, lộ trình
docs/PRONUNCIATION.md      quy ước phiên âm tiếng Việt
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
nếu bổ sung dữ liệu từ OpenJLPT / JMdict / Tatoeba, giữ nguyên giấy phép và ghi công tương ứng
(chi tiết trong `docs/PLAN.md` mục 11).
