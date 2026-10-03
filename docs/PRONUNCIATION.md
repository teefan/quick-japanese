# Quy ước phiên âm tiếng Việt

Mục tiêu: người Việt **chưa biết tiếng Nhật** vẫn đọc được câu tiếng Nhật gần đúng ngay lần đầu.
Toàn bộ phiên âm trong app được sinh tự động bởi [`tools/kana.js`](../tools/kana.js) để đảm bảo nhất quán, kèm một số ngoại lệ viết tay.

## Nguyên tắc

1. **Tách theo mora (âm tiết Nhật) bằng dấu gạch nối**: `みず` → `mi-zư`.
2. **Không dùng dấu thanh**. Tiếng Nhật không có thanh điệu; thêm dấu sắc/nặng (kiểu "xư-mi-ma-xến") sẽ khiến người Việt đọc nặng và sai nhịp.
3. **Đọc sao cho người Việt bật ra đúng âm gần nhất**, ưu tiên mặt chữ Việt thay vì romaji:
   - `す` → `xư` (không phải "su")
   - `つ` → `tsư`
   - `ふ` → `phư`
   - `だ` → `đa` (âm /d/ gần với "đ" hơn "d" miền Bắc)
   - `ざ` → `za`
4. **Trường âm ghi theo mora**: `とう` → `tô-u`, `せい` → `xê-i`, `コーヒー` → `kôô-hii`.
5. **Trợ từ viết khác đọc**: `は` → `oa`, `へ` → `ê`, `を` → `ô` (đây là các ngoại lệ viết tay).

## Bảng nguyên âm

| Kana | Phiên âm | Ghi chú |
|---|---|---|
| あ | a | |
| い | i | |
| う | ư | môi không tròn, khác "u" tiếng Việt |
| え | ê | |
| お | ô | |

## Bảng phụ âm (hàng chính)

| Kana | Phiên âm | Ví dụ |
|---|---|---|
| か き く け こ | ka, ki, cư, kê, kô | くうこう → `cư-u-kô-u` |
| が ぎ ぐ げ ご | ga, gi, gư, gê, gô | ぎんこう → `ging-kô-u` |
| さ し す せ そ | xa, xi, xư, xê, xô | すみません → `xư-mi-ma-xên` |
| ざ じ ず ぜ ぞ | za, ji, zư, zê, zô | みず → `mi-zư` |
| た ち つ て と | ta, chi, tsư, tê, tô | つくえ → `tsư-kư-ê` |
| だ で ど | đa, đê, đô | です → `đê-xư` |
| な に ぬ ね の | na, ni, nư, nê, nô | |
| は ひ ふ へ ほ | ha, hi, phư, hê, hô | ふたつ → `phư-ta-tsư` |
| ば び ぶ べ ぼ | ba, bi, bư, bê, bô | |
| ぱ ぴ ぷ ぺ ぽ | pa, pi, pư, pê, pô | |
| ま み む め も | ma, mi, mư, mê, mô | |
| や ゆ よ | ya, yu, yô | |
| ら り る れ ろ | ra, ri, rư, rê, rô | âm giữa "r" và "l" |
| わ を | oa, ô | |
| ん | n / m / ng | xem bên dưới |
| っ | gấp âm | xem bên dưới |

Âm ghép (きゃ, しゃ, ちゅ, りょ…) chuyển thẳng: `きゃ` → `kia`, `しゃ` → `xa`, `ちょ` → `chô`, `りょ` → `riô`…

## Âm đặc biệt

### ん — ba cách đọc

| Trước | Đọc là | Ví dụ |
|---|---|---|
| p, b, m | **m** | しんぶん → `xim-bưn` |
| k, g | **ng** | ぎんこう → `ging-kô-u` |
| còn lại | **n** | せんせい → `xên-xê-i` |

### っ — gấp âm (sokuon)

Phụ âm của mora sau được "gấp" vào cuối mora trước:

- がっこう → `gak-kô-u`
- ちょっと → `chôt-tô`
- いってきます → `it-tê-ki-ma-xư`
- いっぱい → `ip-pa-i`
- けっこう → `kêk-kô-u`

### ー — trường âm (katakana)

Kéo dài nguyên âm trước đó:

- コーヒー → `kôô-hii`
- カード → `kaa-đô`
- ビール → `bii-rư`

## Ngoại lệ viết tay trong dữ liệu

Một số câu có phiên âm ghi đè (`viPron` trong `data/source/phrases.json`), chủ yếu vì chứa trợ từ `は`:

| Câu | Phiên âm | Vì sao |
|---|---|---|
| こんにちは | `côn-ni-chi-oa` | は lịch sử là trợ từ, đọc "oa" |
| これはいくらですか | `cô-rê oa i-kư-ra đê-xư-ka` | は = chủ đề |
| 私はベトナム人です | `oa-ta-xi oa bê-tô-na-mư-jin đê-xư` | は = chủ đề |

Trong công cụ ghép câu, trợ từ được app tự chèn và phiên âm sẵn (`は` → `oa`, `へ` → `ê`, `を` → `ô`).

## Hạn chế đã biết

- **Không thể hiện pitch accent** (cao độ). Với câu sinh tồn ngắn, ngữ cảnh giúp người nghe hiểu; nếu muốn chuẩn hơn, xem Kanjium/OJAD ở giai đoạn sau.
- **Không thể hiện âm bị devoice** (u cuối bị "thì thầm" trong です/ます). Quy ước vẫn ghi `đê-xư`, `ma-xư` để người đọc dễ nhận diện mặt chữ.
- ん trước nguyên âm hiếm khi gặp trong dữ liệu hiện tại.

## Dành cho người đóng góp

- Đừng gõ tay phiên âm: chạy `node tools/build.js` — script sẽ tự sinh `viPron` và `roma`.
- Chỉ thêm `viPron` viết tay khi có ngoại lệ (trợ từ, cách đọc đặc biệt), kèm `note` giải thích.
- Mọi thay đổi quy tắc phải sửa ở `tools/kana.js` và thêm ví dụ vào bảng kiểm ở trên.
