# Checklist kiểm duyệt bởi người bản ngữ

Mục tiêu: rà soát độ **tự nhiên – lịch sự – chính xác** của toàn bộ nội dung (Phase 1 + 561 từ
N5 + 460 câu ví dụ của Phase 2) trước khi coi nội dung hoàn tất. Ưu tiên người Nhật bản ngữ hoặc
giáo viên tiếng Nhật; có thể chia nhỏ theo nhóm.

## 1. Cụm từ (167 câu, 12 nhóm)

- [ ] Câu du khách nói: đúng mức lịch sự (です/ます), không lọt thể thân mật (タメ口).
- [ ] Câu nhân viên nói (nhóm “Người Nhật có thể nói”): đúng như thực tế hay gặp.
- [ ] Ghi chú văn hóa không gây hiểu nhầm, đặc biệt:
  - `いいです` / `結構です` (từ chối — có thể bị hiểu là đồng ý nếu thiếu ngữ điệu),
  - `大丈夫です` (vừa là “ổn” vừa là “không cần”),
  - mặc cả (`少し安くなりませんか`) — chỉ dùng ở chợ.
- [ ] Cách đọc kana chính xác, nhất là từ katakana (Wi-Fi, パスワード, チェックアウト…).

## 2. Cây ghép câu (13 mục / 4 nhóm)

- [ ] Thứ tự & phân nhóm: Giao tiếp → Ăn uống & mua sắm → Đi lại & khách sạn → Sức khỏe & sự cố;
      trong mỗi nhóm xếp cơ bản trước (Chào hỏi & xã giao → Cảm ơn & xin lỗi → …).
- [ ] Mỗi mục: chạy 🎲 10 lần, đọc to từng câu — kiểm tra trợ từ và độ tự nhiên.
- [ ] Các bẫy đã biết cần xác nhận:
  - `水が飲みたいです` (が với たい) — chấp nhận を?
  - `これが買いたいです` — có tự nhiên hơn `これを買いたいです` không?
  - nhánh taxi `〜までお願いします` và nhánh `〜に行きたいです`.
  - mẫu cảm ơn `〜てくれてありがとうございます` (6 hành động) — mức thân mật có ổn với người lạ?
  - nhánh sự cố khách sạn: `電気がつきません` / `お湯が出ません` / `Wi-Fiがつながりません`.
  - 5 bộ phận × `〜が痛いです`; 4 món đồ × `〜をなくしました / 〜を盗まれました`;
    4 dịch vụ × `〜を呼んでください` (nhánh tàu đã lọc điểm đến riêng).
- [ ] Lựa chọn “Không cần chủ ngữ” ở mục “Tôi muốn…” có ổn khi đứng một mình không.

## 3. Số đếm & tiền

- [ ] Âm biến đổi 1–10: 一本 `いっぽん`, 三本 `さんぼん`, 六本 `ろっぽん`, 八本 `はっぽん`,
      十本 `じゅっぽん`; 一杯 `いっぱい`, 三杯 `さんばい`, 六杯 `ろっぱい`, 八杯 `はっぱい`,
      十杯 `じゅっぱい`; 一人 `ひとり`, 二人 `ふたり`, 四人 `よにん`, 七人 `ななにん / しちにん`.
- [ ] Cách đếm chung つ 1–9 + `十 (とお)` cho số 10 đã đúng và dễ hiểu chưa.
- [ ] Người học có bị nhầm 一つ (cách đếm chung) với 一個 (đồ tròn nhỏ) trong ngữ cảnh mua sắm không.

## 4. Phiên âm tiếng Việt

- [ ] 20 câu nghe TTS + đọc phiên âm: người Việt không biết tiếng Nhật có đọc ra âm gần đúng?
- [ ] Các ngoại lệ trợ từ `は`→oa, `へ`→ê, `を`→ô đã đủ chưa (thêm câu nào cần ghi đè).
- [ ] Romaji Hepburn hiển thị cạnh phiên âm Việt đọc đúng chưa (đặc biệt trường âm kiểu Wāpuro
      `toukyou`, `koohii`; trợ từ `wa`, `e`, `o`)?
- [ ] Màu vai trò khi bóc tách (đại từ, danh từ, động từ, tính từ, trạng từ, trợ từ, です,
      số đếm, cụm cố định) có giúp người học nhìn ra cấu trúc câu không?

## 5. Từ vựng JLPT N5 (561 từ mới, `data/source/vocab-n5.json`)

- [ ] Nghĩa tiếng Việt tự nhiên, đúng trọng tâm; không trùng lặp khó hiểu với 183 từ biên tập tay.
- [ ] Từ đồng âm khác chữ (厚い/暑い, 早い/速い, 取る/撮る, 止まる/泊まる) phân biệt rõ.
- [ ] Động từ: đúng nhóm chia (`godan`/`ichidan`/`suru`), thể ます/て hiển thị chính xác.
- [ ] Từ kana-only hiển thị không bị lặp chữ; từ katakana đúng chính tả.
- [ ] Ghi chú dữ liệu: `せっけん` gốc OpenJLPT ghi “economy” — dự án đã sửa nghĩa Việt thành “xà phòng”.

## 6. Câu ví dụ N5 (460 câu, `data/source/vocab-n5-examples.json`)

- [ ] Câu tiếng Nhật tự nhiên, đúng ngữ cảnh của từ; không phải câu quá văn vẻ, tục, hoặc nghĩa
      lệch với từ đang minh hoạ.
- [ ] Độ lịch sự: ưu tiên です/ます/ください; câu thể thân mật (nếu còn) phải chấp nhận được và
      không dạy thói quen phản cảm.
- [ ] `kana` khớp furigana gốc; cách đọc tên riêng/katakana đúng (đặc biệt trường âm ー).
- [ ] Phiên âm Việt đọc đúng trợ từ `は`→oa, `へ`→ê, `を`→ô; không đọc nhầm は trong 母 (はは),
      流行る (はやる), はっきり, はかり…
- [ ] Nghĩa tiếng Việt tự nhiên, đúng thì/thể của câu Nhật; xưng hô nhất quán (tôi/bạn/anh ấy…).
- [ ] Nếu câu không đạt: sửa `jp`/`furi`/`kana`/`vi` trong file, hoặc xoá mục đó (app chỉ hiện
      ví dụ khi có), rồi `npm run build`.

## 7. Cách ghi nhận kết quả

- Sửa trực tiếp `data/source/*.json` (kèm ghi chú nếu là ngoại lệ), chạy `npm run build`, mở PR.
- Hoặc mở issue theo mẫu: `review: <nhóm> — <câu/nhánh> — đề xuất`.
- Ghi tên người kiểm duyệt vào commit/README nếu muốn ghi công.
