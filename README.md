# 🍙 Hanasou! — 10 ngày nói được tiếng Nhật du lịch

Một web app **một trang (SPA)** thuần HTML/CSS/JS, **không cần backend, không cần build** — đẩy lên GitHub Pages là chạy ngay.

> 話そう (*Hanasou*) = "Cùng nói nào!"

**Triết lý UI: mở app là học ngay.** Không dashboard, không bắt đăng nhập — màn hình chính chỉ có một nút lớn **"▶ Học ngay"** với đúng số thẻ của hôm nay theo **kế hoạch 10 ngày**. Chưa đặt tên? Vẫn học bình thường (hồ sơ **Khách** tự tạo, tiến trình vẫn lưu trên máy); sau này đặt tên thì tiến trình được **mang theo** lên bảng vàng.

## ✨ Tính năng

| Tính năng | Chi tiết |
|---|---|
| 🗓️ Kế hoạch 10 ngày | 374 thẻ (76 câu + 302 từ) chia 10 buổi đều (~38 thẻ/buổi, ~10 phút): học từ ngắn → câu dài, xoay vòng qua 9 chủ đề. Thẻ ôn đến hạn tự dồn vào buổi tới |
| 🎴 Thẻ ghi nhớ | 76 câu mẫu + 302 từ vựng (mỗi từ có câu ví dụ) · lật thẻ 3D · chấm Lại/Được/Dễ theo thuật toán **lặp lại ngắt quãng** (Leitner 1→16 ngày) |
| 🇻🇳 Đọc kiểu Việt | Mọi câu/từ có phiên âm gần đúng theo chính tả tiếng Việt (こんにちは → *côn-ni-chi-oa*) + 🔊 giọng chuẩn |
| 🔊 TTS đa nền tảng | Dùng **Web Speech API** nếu máy có giọng Nhật (macOS/iOS/Edge/Windows+cài gói/Android+cài data) — không có thì **tự chuyển giọng trực tuyến** (Google translate_tts, dự phòng VoiceVOX) — kèm phần chẩn đoán + hướng dẫn bật giọng máy ở Cẩm nang |
| 🔬 Từng chữ → phát âm | Trên mỗi thẻ: bấm 🔬 để xem **mũi tên chỉ phát âm từng chữ** — mỗi kana 1 cột (1 nhịp), cụm kanji đọc trọn từ (từ điển 241 cụm), nhỏ っ = nhấn gấp đôi, ー = kéo dài (kỹ thuật furigana/flexbox per-character) |
| 👥 Nhóm & Bảng vàng | Học khách được tự do; muốn thi đấu thì đặt **tên + số điện thoại** (+ mascot) — tiến trình mang theo nguyên vẹn, xếp hạng XP/thẻ/chuỗi |
| 📝 Trắc nghiệm | 10 câu từ **bài đã học** hoặc **tất cả đã mở**: đọc chữ Nhật → nghĩa, dịch ngược, và câu nghe |
| 📖 Cẩm nang | Quy tắc vàng SOV · bảng trợ từ · 4 mẫu câu thần thánh · legend đọc kiểu Việt · Hiragana |
| 🖼️ Minh họa từng thẻ | **374/374 thẻ có ảnh AI kawaii tự sinh** (WebP ~19KB/ảnh) theo nguyên lý *dual coding* — sinh lại bằng `tools/gen-images.mjs`, emoji là dự phòng |
| 🗂️ 9 chủ đề tình huống | Chào hỏi & Lịch sự · Ăn uống · Số Giờ & Giá · Đi lại & Hỏi đường · Mua sắm & Đồ vật · Khách sạn · Tham quan · Trò chuyện & Cảm xúc · Hỏi & Động từ — trong mỗi buổi học **từ ngắn trước, câu dài sau** |
| 📊 Tiến trình | Lộ trình 10 ngày từng buổi, XP, chuỗi ngày, badges |

Mọi thứ khác (Cẩm nang, Trắc nghiệm, Nhóm, Tiến trình) gọn trong **một nút ☰** — không làm rối màn học.

## 🗓️ Kế hoạch 10 ngày hoạt động thế nào

- App tự chia 374 thẻ thành 10 buổi theo kiểu *xoay vòng chủ đề* — mỗi ngày học đều đủ câu + từ của nhiều chủ đề.
- "Ngày" đi theo **tiến độ học**, không theo lịch: học xong buổi hôm nay là mở buổi sau (có thể học sớm hơn kế hoạch); nghỉ vài ngày thì thẻ mới của ngày đó xếp lại vào buổi tới.
- Mỗi thẻ chấm **Lại** (nhớ lại ngay, box về 0), **Được** (+1 box), **Dễ** (+2 box) — box càng cao, khoảng ôn càng dài (1→16 ngày). Thuộc lòng = box ≥ 4.

## 🔒 Về dữ liệu

Chỉ lưu trong **localStorage trên máy đó**, không gửi lên server (phù hợp GitHub Pages tĩnh). Một thiết bị dùng chung: mỗi thành viên một hồ sơ, thi đua trực tiếp. Muốn đồng bộ đa thiết bị thì cắm thêm backend (Firebase/Supabase) — phần đọc/ghi đã tách trong `loadStore/saveStore`.

## 🚀 Chạy máy local

```bash
python3 -m http.server 8080
# mở http://localhost:8080
```

## 🌐 Deploy lên GitHub Pages

```bash
git init && git add . && git commit -m "Hanasou! 10-day travel Japanese SPA"
git branch -M main
git remote add origin https://github.com/<tên-bạn>/quick-japanese.git
git push -u origin main
```

Rồi **Settings → Pages → Deploy from a branch → main / (root) → Save**. Trang sống tại `https://<tên-bạn>.github.io/quick-japanese/`.

## 📁 Cấu trúc

```
quick-japanese/
├── index.html   # màn học chính + menu ☰ + 4 view phụ (Cẩm nang, Trắc nghiệm, Nhóm, Tiến trình)
├── app.css      # design system kawaii
├── data.js      # 76 câu + 302 từ (JP/romaji/đọc-Việt/nghĩa/ví dụ)
├── app.js       # kế hoạch 10 ngày, SRS, quiz, nhóm, hồ sơ khách
└── fonts/       # M PLUS Rounded 1c subset (~100KB/weight, woff2)
```

> Font đã subset gồm mọi chữ trong app + bảng Việt đầy đủ + kana. Thêm câu/từ mới có **kanji lạ** thì subset lại font.

## 🧠 Phương pháp học

1. **Học mẫu câu thay vì ngữ pháp** — 1 quy tắc vàng (động từ cuối câu) + 4 mẫu câu = hàng trăm câu.
2. **Lặp lại ngắt quãng (SRS)** — chứng minh là cách nhớ bền nhất với ít thời gian nhất.
3. **Đọc phiên âm Việt trước, nghe giọng chuẩn sau** — giảm rào cản phát âm ngay ngày đầu.
4. **10 phút mỗi ngày theo kế hoạch sẵn** — không phải chọn học gì, chỉ bấm một nút.
5. **Thi đua nhóm** — bảng vàng + chuỗi ngày giữ nhịp học.

Tham khảo: [JapanNook — Essential Japanese Phrases](https://japannook.com) · [Tofugu](https://www.tofugu.com) · [JapanesePod101 — Word Order](https://www.japanesepod101.com/blog/2020/08/07/japanese-word-order) · [8020 Japanese](https://8020japanese.com/japanese-word-order)

## 🛠️ Tuỳ biến nhanh

- Thêm từ: dòng `W(...)` trong `data.js` (`jp, ro, vn, vi, ex...`) + 1 emoji trong `ILLUS` + chủ đề trong `CATS`.
- Thêm cụm câu: dòng `P(...)` (emoji có thể là **cảnh nhỏ** vài ký tự, ví dụ `"🍽️🙏"`).
- Đổi số ngày: sửa mảng `plan` trong `CURRICULUM` (app.js), ví dụ `[ [byLevel[0], 4], ... ]`.
- Subset lại font sau khi thêm chữ Nhật mới (dùng `pyftsubset` với ký tự lấy từ các file nguồn).

## 🖼️ Nâng cấp minh họa bằng ảnh AI (tùy chọn)

Mặc định mỗi thẻ dùng **emoji** — theo nghiên cứu *dual coding* (Paivio; Sadoski 2005), hình đơn giản + không nhập nhằng mới giúp ghi nhớ; emoji rẻ, nhẹ, rõ. Muốn treo سطح "ảnh vẽ":

```bash
# 1. Sinh ảnh theo phong cách thống nhất (MiniMax image-01, ~100KB/ảnh JPG)
mmx image generate --aspect-ratio 1:1 --out-dir img --out-prefix <ten> --quiet \
  --prompt "a clear glass of cold water with ice cubes, kawaii flat vector sticker \
illustration, thick rounded outlines, soft pastel sakura pink and cream color \
palette, minimalist japanese stationery style, centered single object, plain \
cream background, no text, no watermark"

# 2. Khai báo trong app.js
const IMG_OVERRIDE = { "vanuong-1": "img/mizu_001.jpg", ... };
```

- Ảnh sẽ **ưu tiên hơn emoji** trên mặt trước thẻ (CSS tự cắt viền + bo góc, giấu phần chữ AI hay vẽ lỗi ở mép dưới).
- Nén về WebP (~30KB/ảnh, [squoosh.app](https://squoosh.app)) trước khi commit nếu làm cả bộ — 374 ảnh ≈ 12MB WebP, chấp nhận được cho GitHub Pages (load lười từng ảnh).
- Giấy phép các nguồn đã cân nhắc: emoji hệ thống/Twemoji (CC-BY 4.0) an toàn nhất; **irasutoya** đẹp mà có tính chừng mực (cấm phân phối lại file ảnh — không khuyên dùng cho app); ảnh AI tự sinh thì của mình 100%.
