# Checklist kiểm duyệt bởi người bản ngữ

Mục tiêu: rà soát độ **tự nhiên – lịch sự – chính xác** của toàn bộ nội dung trước khi coi
Phase 1 hoàn tất. Ưu tiên người Nhật bản ngữ hoặc giáo viên tiếng Nhật; có thể chia nhỏ theo nhóm.

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

- [ ] Âm biến đổi: 一本 `いっぽん`, 三本 `さんぼん`, 一本? 一杯 `いっぱい`, 三杯 `さんばい`,
      一人 `ひとり`, 二人 `ふたり`, 四人 `よにん`.
- [ ] Người học có bị nhầm 一つ (cách đếm chung) với 一個 (đồ tròn nhỏ) trong ngữ cảnh mua sắm không.

## 4. Phiên âm tiếng Việt

- [ ] 20 câu nghe TTS + đọc phiên âm: người Việt không biết tiếng Nhật có đọc ra âm gần đúng?
- [ ] Các ngoại lệ trợ từ `は`→oa, `へ`→ê, `を`→ô đã đủ chưa (thêm câu nào cần ghi đè).
- [ ] Romaji Hepburn hiển thị cạnh phiên âm Việt đọc đúng chưa (đặc biệt trường âm kiểu Wāpuro
      `toukyou`, `koohii`; trợ từ `wa`, `e`, `o`)?
- [ ] Màu vai trò khi bóc tách (đại từ, danh từ, động từ, tính từ, trạng từ, trợ từ, です,
      số đếm, cụm cố định) có giúp người học nhìn ra cấu trúc câu không?

## 5. Cách ghi nhận kết quả

- Sửa trực tiếp `data/source/*.json` (kèm ghi chú nếu là ngoại lệ), chạy `npm run build`, mở PR.
- Hoặc mở issue theo mẫu: `review: <nhóm> — <câu/nhánh> — đề xuất`.
- Ghi tên người kiểm duyệt vào commit/README nếu muốn ghi công.
