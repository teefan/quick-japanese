"use strict";
/**
 * segment.js — Tách câu tiếng Nhật thành các thành phần và chú giải tiếng Việt.
 *
 * Cách hoạt động: từ điển gồm (a) trợ từ, (b) từ vựng + mọi thể động từ + lượng từ,
 * (c) cụm cố định (greetings, set phrases). Thuật toán so khớp dài nhất trên chuỗi kana;
 * đoạn không khớp được gom lại và cảnh báo để bổ sung từ điển.
 */

/* ------------------------------ Trợ từ ------------------------------ */

const PARTICLES = {
  "は": { vi: "～ thì / còn ～", note: "trợ từ chủ đề, đọc là 'oa'"},
  "が": { vi: "～ (chủ ngữ / thứ được thích, muốn)", note: "trợ từ chủ ngữ"},
  "を": { vi: "～ (đối tượng của hành động)", note: "trợ từ tân ngữ, đọc là 'ô'"},
  "に": { vi: "～ (hướng đến / thời điểm)", note: "trợ từ hướng, đích"},
  "で": { vi: "～ (nơi xảy ra / phương tiện)", note: "trợ từ nơi / cách thức"},
  "へ": { vi: "～ hướng về", note: "trợ từ hướng, đọc là 'ê'"},
  "の": { vi: "～ của", note: "trợ từ sở hữu / nối danh từ"},
  "も": { vi: "～ cũng", note: "trợ từ 'cũng'"},
  "と": { vi: "～ và / cùng với", note: "trợ từ 'và, cùng'"},
  "か": { vi: "～? (nghi vấn)", note: "trợ từ nghi vấn cuối câu"},
  "まで": { vi: "～ cho đến (điểm đến)", note: "trợ từ giới hạn điểm đến"},
  "から": { vi: "～ từ / vì", note: "trợ từ điểm bắt đầu"},
  "ね": { vi: "～ nhỉ / nhé", note: "trợ từ tình cảm, tìm đồng cảm"},
  "よ": { vi: "～ đấy / nhé", note: "trợ từ nhấn mạnh, thông báo"},
  "だけ": { vi: "chỉ ～", note: "trợ từ giới hạn 'chỉ'"},
  "でも": { vi: "～ cũng (được)", note: "も sau で: '… cũng được'"},
  "には": { vi: "đối với ～ / ở ～", note: "に + は (nhấn chủ đề đích)"},
  "では": { vi: "thì ở ～ / bằng ～ thì", note: "で + は (nhấn chủ đề nơi/cách)"},
};

/* ------------------------------ Chú giải loại từ ------------------------------ */

/* Vai trò cho các cụm cố định (mặc định là expression) */
const EXPR_ROLE = {
  // danh từ
  "さとう": "noun", "かぜぐすり": "noun", "ずつう": "noun", "やく": "noun", "くすり": "noun",
  "いたみどめ": "noun", "ばんそうこう": "noun", "しょほうせん": "noun", "めまい": "noun",
  "サイズ": "noun", "いろ": "noun", "ほか": "noun", "おすすめ": "noun", "おかいけい": "noun",
  "おかわり": "noun", "おみず": "noun", "もちかえり": "noun", "てんない": "noun",
  "きんえんせき": "noun", "きつえんせき": "noun", "ごちゅうもん": "noun", "おきまり": "noun",
  "なんめいさま": "noun", "よやく": "noun", "おなか": "noun", "のど": "noun", "ねつ": "noun",
  "きぶん": "noun", "ほけん": "noun", "しょるい": "noun", "じこ": "noun", "とうなん": "noun",
  "しょうめい": "noun", "りょうしゅうしょ": "noun", "ベトナム": "noun", "たいしかん": "noun",
  "ぼこく": "noun", "れんらく": "noun", "スマホ": "noun", "チェックイン": "noun",
  "チェックアウト": "noun", "ワイファイ": "noun", "パスワード": "noun", "へや": "noun",
  "にもつ": "noun", "タオル": "noun", "エアコン": "noun", "ちょうしょく": "noun",
  "でんしゃ": "noun", "とうきょう": "noun", "なんばんせん": "noun", "みち": "noun",
  "じゅうしょ": "noun", "ごりよう": "noun", "おじゃま": "noun", "しつれい": "noun",
  // tính từ / trạng từ
  "しずか": "adj", "いたい": "adj", "わるい": "adj", "べつ": "adj",
  "よく": "adverb", "からく": "adverb", "やすく": "adverb",
  "ゆっくり": "adverb", "ちょっと": "adverb", "すこし": "adverb", "もう": "adverb",
  "また": "adverb", "まっすぐ": "adverb", "くらい": "adverb", "いっしょ": "adverb",
  "べつべつ": "adverb", "どうやって": "adverb", "じゃあ": "adverb", "そう": "adverb",
  "けっこう": "adverb", "どうも": "adverb", "どうぞ": "adverb", "おさきに": "adverb",
  // từ hỏi / số
  "どの": "pron", "なんかい": "pron", "いちど": "number", "えん": "number",
  // động từ (dạng chia sẵn)
  "あずかって": "verb", "かえて": "verb", "おいて": "verb", "うごきません": "verb",
  "あるいて": "verb", "さして": "verb", "とめて": "verb", "とめたい": "verb",
  "とどけたい": "verb", "あいました": "verb", "おとしました": "verb", "ぬすまれました": "verb",
  "まよいました": "verb", "なくしました": "verb", "さがりません": "verb", "いりません": "verb",
  "いれないで": "verb", "しないで": "verb", "もらえます": "verb", "もらえますか": "verb",
  "なります": "verb", "なりません": "verb", "かかります": "verb", "います": "verb",
  "あります": "verb", "ありません": "verb",
};

const POS_VI = {
  pron: "đại từ",
  demo: "đại từ chỉ định",
  q: "từ để hỏi",
  noun: "danh từ",
  verb: "động từ",
  "adj-i": "tính từ đuôi い",
  "adj-na": "tính từ đuôi な",
};

/* Vai trò để tô màu trong dòng composition (khớp với legend trên UI) */
const POS_ROLE = {
  pron: "pron", demo: "pron", q: "pron",
  noun: "noun", verb: "verb", "adj-i": "adj", "adj-na": "adj",
};

const FORM_VI = {
  dict: "thể từ điển",
  masu: "thể ます (lịch sự)",
  masen: "phủ định ません",
  mashita: "quá khứ ました",
  te: "thể て",
  tai: "mong muốn たい",
  potential: "thể khả năng",
  potentialNeg: "khả năng (phủ định)",
};

/* ------------------------------ Cụm cố định ------------------------------ */

// { kana, jp, vi, note? }
const EXPRESSIONS = [
  { kana: "はい", jp: "はい", vi: "vâng / dạ", note: "đôi khi chỉ nghĩa 'tôi đang nghe'" },
  { kana: "いいえ", jp: "いいえ", vi: "không", note: "người Nhật ít dùng thẳng" },
  { kana: "けっこう", jp: "結構", vi: "khỏi cần / không cần đâu" },
  { kana: "そう", jp: "そう", vi: "như vậy / đúng vậy" },
  { kana: "ベジタリアン", jp: "ベジタリアン", vi: "người ăn chay" },
  { kana: "ちゅうもん", jp: "注文", vi: "gọi món" },
  { kana: "どの", jp: "どの", vi: "... nào (đứng trước danh từ)", note: "thuộc bộ こ・そ・あ・ど"},
  { kana: "くらい", jp: "くらい", vi: "khoảng chừng" },
  { kana: "えん", jp: "円", vi: "yên (tiền Nhật)" },
  { kana: "なんかい", jp: "何回", vi: "mấy lần"},
  { kana: "ごりよう", jp: "ご利用", vi: "quý khách sử dụng", note: "kính ngữ của 利用" },
  { kana: "りょこう", jp: "旅行", vi: "du lịch" },
  { kana: "なくしました", jp: "なくしました", vi: "đã làm mất", note: "từ なくす" },
  { kana: "いちにち", jp: "一日", vi: "một ngày" },
  { kana: "なし", jp: "なし", vi: "không có" },
  { kana: "どうやって", jp: "どうやって", vi: "bằng cách nào" },
  { kana: "お", jp: "お", vi: "tiền tố lịch sự", note: "thêm trước danh từ để lịch sự (お水, お名前…)" },
  { kana: "な", jp: "な", vi: "nối tính từ な với danh từ", note: "静かな部屋 = phòng yên tĩnh"},

  { kana: "まあまあ", jp: "まあまあ", vi: "tạm ổn", role: "adverb" },
  { kana: "むずかしい", jp: "難しい", vi: "khó", note: "tính từ đuôi い", role: "adj" },
  { kana: "おくれて", jp: "遅れて", vi: "muộn (thể て)", note: "từ 遅れる", role: "verb" },
  { kana: "つきません", jp: "つきません", vi: "không sáng / không bật", note: "từ 点く (đèn)", role: "verb" },
  { kana: "でません", jp: "出ません", vi: "không ra / không chảy", note: "từ 出る (nước nóng…)", role: "verb" },
  { kana: "つながりません", jp: "つながりません", vi: "không kết nối được", note: "từ つながる (Wi-Fi…)", role: "verb" },

  // Chào hỏi & lịch sự
  { kana: "こんにちは", jp: "こんにちは", vi: "xin chào (ban ngày)", note: "は viết 'ha' nhưng đọc 'oa' — dấu vết trợ từ chủ đề" },
  { kana: "こんばんは", jp: "こんばんは", vi: "chào buổi tối", note: "は đọc 'oa'" },
  { kana: "おはよう", jp: "おはよう", vi: "chào buổi sáng", note: "dạng thân mật; thêm ございます để lịch sự" },
  { kana: "ございます", jp: "ございます", vi: "làm cho câu lịch sự", note: "dạng lịch sự của ある" },
  { kana: "ございました", jp: "ございました", vi: "đã… (quá khứ lịch sự)", note: "quá khứ của ございます" },
  { kana: "ありがとう", jp: "ありがとう", vi: "cảm ơn" },
  { kana: "さようなら", jp: "さようなら", vi: "tạm biệt", note: "trang trọng, lâu mới gặp lại" },
  { kana: "はじめまして", jp: "はじめまして", vi: "rất vui được gặp", note: "câu chào lần đầu gặp" },
  { kana: "よろしく", jp: "よろしく", vi: "mong được giúp đỡ", note: "nói sau khi giới thiệu tên" },
  { kana: "おやすみなさい", jp: "おやすみなさい", vi: "chúc ngủ ngon" },
  { kana: "いってきます", jp: "いってきます", vi: "tôi đi nhé", note: "nói khi rời nhà/khách sạn" },
  { kana: "いってらっしゃい", jp: "いってらっしゃい", vi: "đi cẩn thận nhé", note: "đáp lại いってきます" },
  { kana: "ただいま", jp: "ただいま", vi: "tôi về rồi đây" },
  { kana: "おかえりなさい", jp: "おかえりなさい", vi: "mừng bạn đã về", note: "đáp lại ただいま" },
  { kana: "おひさしぶり", jp: "お久しぶり", vi: "lâu rồi không gặp" },
  { kana: "すみません", jp: "すみません", vi: "xin lỗi / cho hỏi", note: "câu đa dụng: gọi nhân viên, hỏi đường, xin lỗi" },
  { kana: "ごめんなさい", jp: "ごめんなさい", vi: "xin lỗi (khi mắc lỗi)" },
  { kana: "ごめん", jp: "ごめん", vi: "xin lỗi (thân mật)" },
  { kana: "どうも", jp: "どうも", vi: "cảm ơn / chào (thân mật)" },
  { kana: "どうぞ", jp: "どうぞ", vi: "xin mời" },
  { kana: "どういたしまして", jp: "どういたしまして", vi: "không có gì" },
  { kana: "いただきます", jp: "いただきます", vi: "con xin phép dùng bữa", note: "nói trước khi ăn" },
  { kana: "ごちそうさま", jp: "ごちそうさま", vi: "cảm ơn vì bữa ăn", note: "nói sau khi ăn xong" },
  { kana: "でした", jp: "でした", vi: "đã là (quá khứ của です)", role: "copula" },
  { kana: "おじゃま", jp: "お邪魔", vi: "làm phiền", note: "trong お邪魔します = xin phép vào nhà" },
  { kana: "しつれい", jp: "失礼", vi: "thất lễ", note: "trong 失礼します = xin phép" },
  { kana: "おさきに", jp: "お先に", vi: "trước mọi người", note: "trong お先に失礼します = tôi về trước" },
  { kana: "おねがい", jp: "お願い", vi: "nhờ vả / mong", note: "đi với します thành 'xin nhờ'" },
  { kana: "ください", jp: "ください", vi: "xin hãy cho", note: "đuôi yêu cầu lịch sự"},
  { kana: "くださいませ", jp: "くださいませ", vi: "xin mời (trang trọng hơn)"},
  { kana: "いらっしゃいませ", jp: "いらっしゃいませ", vi: "chào mừng quý khách", note: "câu cửa miệng của nhân viên" },
  { kana: "かしこまりました", jp: "かしこまりました", vi: "vâng, tôi đã hiểu ạ", note: "nhân viên xác nhận yêu cầu" },
  { kana: "もうしわけございません", jp: "申し訳ございません", vi: "thành thật xin lỗi ạ", note: "xin lỗi trang trọng nhất" },
  { kana: "ごめいわく", jp: "ご迷惑", vi: "sự phiền phức / làm phiền", note: "trong ご迷惑をおかけしました = đã làm phiền quý vị", role: "noun" },
  { kana: "おかけ", jp: "お掛け", vi: "gây ra (kính ngữ)", note: "từ かける — 迷惑をかける = gây phiền", role: "verb" },
  { kana: "しょうしょう", jp: "少々", vi: "một chút (lịch sự)" },
  { kana: "おまち", jp: "お待ち", vi: "chờ đợi", note: "trong お待ちください = xin chờ" },
  { kana: "また", jp: "また", vi: "lại, lần nữa" },
  { kana: "おこし", jp: "お越し", vi: "ghé đến", note: "trong またお越しくださいませ = hẹn quay lại" },
  { kana: "じゃあ", jp: "じゃあ", vi: "vậy thì / thôi nhé", note: "dùng khi chia tay thân mật" },

  // Đuôi câu / ngữ pháp rời
  { kana: "です", jp: "です", vi: "là (lịch sự)", note: "đuôi câu danh từ/tính từ", role: "copula" },
  { kana: "ないでください", jp: "ないでください", vi: "xin đừng…", note: "phủ định + ください"},
  { kana: "もらえます", jp: "もらえます", vi: "có thể nhận được", note: "〜てもらえますか = nhờ ai làm giúp"},
  { kana: "もらえますか", jp: "もらえますか", vi: "…giúp tôi được không?", note: "nhờ vả lịch sự"},
  { kana: "なります", jp: "なります", vi: "trở nên"},
  { kana: "なりません", jp: "なりません", vi: "không trở nên"},
  { kana: "かかります", jp: "かかります", vi: "mất (thời gian/tiền)"},
  { kana: "います", jp: "います", vi: "có (người/vật sống)"},
  { kana: "あります", jp: "あります", vi: "có (đồ vật)"},
  { kana: "ありません", jp: "ありません", vi: "không có"},
  { kana: "いりません", jp: "いりません", vi: "không cần", note: "từ 要る (cần)" },
  { kana: "いれないで", jp: "入れないで", vi: "xin đừng cho vào", note: "phủ định thể て của 入れる"},
  { kana: "しないで", jp: "しないで", vi: "đừng làm", note: "phủ định thể て của する" },
  { kana: "よく", jp: "よく", vi: "tốt / thường xuyên", note: "dạng trạng từ của いい" },
  { kana: "なん", jp: "何", vi: "cái gì", note: "đọc 'なん' trước です/です"},

  // Ăn uống / mua sắm
  { kana: "おすすめ", jp: "おすすめ", vi: "gợi ý / món nên thử", note: "nhà hàng hay dùng" },
  { kana: "おかいけい", jp: "お会計", vi: "thanh toán", note: "hóa đơn tính tiền" },
  { kana: "おかわり", jp: "おかわり", vi: "phần thêm (cơm/nước)" },
  { kana: "おみず", jp: "お水", vi: "nước (lịch sự)", note: "お là tiền tố lịch sự" },
  { kana: "もちかえり", jp: "持ち帰り", vi: "mang về" },
  { kana: "べつべつ", jp: "別々", vi: "riêng ra (từng người)" },
  { kana: "いっしょ", jp: "一緒", vi: "cùng nhau" },
  { kana: "てんない", jp: "店内", vi: "trong quán (ăn tại chỗ)" },
  { kana: "きんえんせき", jp: "禁煙席", vi: "chỗ không hút thuốc" },
  { kana: "きつえんせき", jp: "喫煙席", vi: "chỗ hút thuốc" },
  { kana: "ごちゅうもん", jp: "ご注文", vi: "việc gọi món (kính ngữ)" },
  { kana: "おきまり", jp: "お決まり", vi: "đã chọn xong", note: "trong ご注文はお決まりですか" },
  { kana: "なんめいさま", jp: "何名様", vi: "quý khách mấy người" },
  { kana: "よやく", jp: "予約", vi: "đặt trước" },
  { kana: "かぜぐすり", jp: "風邪薬", vi: "thuốc cảm" },
  { kana: "ずつう", jp: "頭痛", vi: "đau đầu" },
  { kana: "いたみどめ", jp: "痛み止め", vi: "thuốc giảm đau" },
  { kana: "くすり", jp: "薬", vi: "thuốc" },
  { kana: "やく", jp: "薬", vi: "thuốc (trong từ ghép)" },
  { kana: "ばんそうこう", jp: "絆創膏", vi: "băng cá nhân" },
  { kana: "しょほうせん", jp: "処方箋", vi: "đơn thuốc" },
  { kana: "めまい", jp: "めまい", vi: "chóng mặt" },
  { kana: "さとう", jp: "砂糖", vi: "đường" },
  { kana: "からく", jp: "辛く", vi: "cay (dạng trạng từ)", note: "từ 辛い"},
  { kana: "めんぜい", jp: "免税", vi: "miễn thuế" },
  { kana: "サイズ", jp: "サイズ", vi: "cỡ / kích thước" },
  { kana: "べつ", jp: "別", vi: "khác" },
  { kana: "いろ", jp: "色", vi: "màu" },
  { kana: "ほか", jp: "他", vi: "khác (còn gì nữa)" },
  { kana: "いりません", jp: "要りません", vi: "không cần", note: "từ 要る (cần)" },
  { kana: "いたい", jp: "痛い", vi: "đau", note: "tính từ đuôi い"},
  { kana: "おなか", jp: "お腹", vi: "bụng" },
  { kana: "のど", jp: "のど", vi: "cổ họng" },
  { kana: "ねつ", jp: "熱", vi: "sốt" },
  { kana: "さがりません", jp: "下がりません", vi: "không hạ xuống", note: "từ 下がる" },
  { kana: "きぶん", jp: "気分", vi: "tâm trạng / sức khỏe" },
  { kana: "わるい", jp: "悪い", vi: "tệ, không khỏe"},

  // Khách sạn
  { kana: "チェックイン", jp: "チェックイン", vi: "nhận phòng" },
  { kana: "チェックアウト", jp: "チェックアウト", vi: "trả phòng" },
  { kana: "ワイファイ", jp: "Wi-Fi", vi: "Wi-Fi" },
  { kana: "パスワード", jp: "パスワード", vi: "mật khẩu" },
  { kana: "へや", jp: "部屋", vi: "phòng" },
  { kana: "にもつ", jp: "荷物", vi: "hành lý" },
  { kana: "あずかって", jp: "預かって", vi: "giữ hộ (thể て)", note: "từ 預かる" },
  { kana: "タオル", jp: "タオル", vi: "khăn" },
  { kana: "もう", jp: "もう", vi: "thêm nữa / đã rồi" },
  { kana: "エアコン", jp: "エアコン", vi: "điều hòa" },
  { kana: "うごきません", jp: "動きません", vi: "không chạy / không hoạt động", note: "từ 動く" },
  { kana: "しずか", jp: "静か", vi: "yên tĩnh", note: "tính từ đuôi な"},
  { kana: "かえて", jp: "変えて", vi: "đổi (thể て)", note: "từ 変える" },
  { kana: "おいて", jp: "置いて", vi: "để, đặt (thể て)", note: "từ 置く" },
  { kana: "ちょうしょく", jp: "朝食", vi: "bữa sáng" },
  { kana: "いちど", jp: "一度", vi: "một lần" },

  // Đi lại
  { kana: "でんしゃ", jp: "電車", vi: "tàu điện" },
  { kana: "とうきょう", jp: "東京", vi: "Tokyo" },
  { kana: "なんばんせん", jp: "何番線", vi: "sân ga số mấy" },
  { kana: "みち", jp: "道", vi: "đường" },
  { kana: "まよいました", jp: "迷いました", vi: "đã bị lạc", note: "từ 迷う" },
  { kana: "あるいて", jp: "歩いて", vi: "đi bộ (thể て)", note: "từ 歩く" },
  { kana: "まっすぐ", jp: "まっすぐ", vi: "thẳng" },
  { kana: "とめて", jp: "止めて", vi: "dừng lại (thể て)", note: "từ 止める" },
  { kana: "とめたい", jp: "止めたい", vi: "muốn dừng / khóa"},
  { kana: "じゅうしょ", jp: "住所", vi: "địa chỉ" },
  { kana: "ゆっくり", jp: "ゆっくり", vi: "chậm rãi" },
  { kana: "ちょっと", jp: "ちょっと", vi: "một chút" },
  { kana: "すこし", jp: "少し", vi: "một chút" },
  { kana: "やすく", jp: "安く", vi: "rẻ (dạng trạng từ)", note: "từ 安い"},
  { kana: "さして", jp: "指して", vi: "chỉ (thể て)", note: "từ 指す" },

  // Sự cố & bảo hiểm
  { kana: "ほけん", jp: "保険", vi: "bảo hiểm" },
  { kana: "しょるい", jp: "書類", vi: "giấy tờ" },
  { kana: "じこ", jp: "事故", vi: "tai nạn" },
  { kana: "あいました", jp: "遭いました", vi: "đã gặp (tai nạn)", note: "từ 遭う" },
  { kana: "スマホ", jp: "スマホ", vi: "điện thoại thông minh" },
  { kana: "おとしました", jp: "落としました", vi: "đã đánh rơi", note: "từ 落とす" },
  { kana: "ぬすまれました", jp: "盗まれました", vi: "đã bị lấy cắp", note: "từ 盗む" },
  { kana: "とうなん", jp: "盗難", vi: "trộm cắp" },
  { kana: "しょうめい", jp: "証明", vi: "chứng nhận / xác nhận" },
  { kana: "とどけたい", jp: "届けたい", vi: "muốn trình báo", note: "từ 届ける"},
  { kana: "りょうしゅうしょ", jp: "領収書", vi: "hóa đơn nhận tiền" },
  { kana: "ベトナム", jp: "ベトナム", vi: "Việt Nam" },
  { kana: "たいしかん", jp: "大使館", vi: "đại sứ quán" },
  { kana: "ぼこく", jp: "母国", vi: "quê hương" },
  { kana: "れんらく", jp: "連絡", vi: "liên lạc" },
  { kana: "クレジットカード", jp: "クレジットカード", vi: "thẻ tín dụng" },
  { kana: "じしん", jp: "地震", vi: "động đất" },
  { kana: "ぜんぜん", jp: "全然", vi: "hoàn toàn (không)" },
  { kana: "なか", jp: "中", vi: "trong" },
];

/* ------------------------------ Xây từ điển ------------------------------ */

function addEntry(lex, entry) {
  // Ưu tiên entry dài hơn; entry trùng kana: bản đầu tiên thắng (từ điển người viết trước)
  const prev = lex.get(entry.kana);
  if (!prev || entry.kana.length > prev.kana.length) lex.set(entry.kana, entry);
}

function buildLexicon(vocab, numbers) {
  const lex = new Map();

  // Trợ từ
  for (const [kana, p] of Object.entries(PARTICLES)) {
    addEntry(lex, { kana, jp: kana, vi: p.vi, note: p.note, isParticle: true, role: "particle" });
  }

  // Lượng từ & mệnh giá (một 一つ, một chai 一本, 100円…)
  if (numbers) {
    for (const c of numbers.counters || []) {
      for (const combo of c.combos || []) {
        addEntry(lex, {
          kana: combo.kana, jp: combo.jp, vi: combo.vi,
          note: `lượng từ "${c.jp}" (${c.vi})`, role: "number",
        });
      }
    }
    for (const m of numbers.money || []) {
      addEntry(lex, { kana: m.kana, jp: m.jp, vi: m.vi, note: "tiền Nhật", role: "number" });
    }
  }

  // Cụm cố định (đăng trước để giữ nguyên dạng hiển thị)
  for (const e of EXPRESSIONS) {
    addEntry(lex, { isExpression: true, role: EXPR_ROLE[e.kana] || "expression", ...e });
  }

  // Từ vựng
  for (const v of vocab) {
    const role = POS_ROLE[v.pos] || "expression";
    if (v.pos === "verb") {
      for (const [form, f] of Object.entries(v.forms)) {
        addEntry(lex, {
          kana: f.kana, jp: f.jp, vi: v.vi,
          note: FORM_VI[form] || "động từ",
          isVerb: true, role: "verb",
        });
      }
      // phủ định thể khả năng (食べられません…) phục vụ câu "không ăn được"
      const pot = v.forms.potential;
      if (pot && pot.kana.endsWith("ます")) {
        addEntry(lex, {
          kana: pot.kana.slice(0, -2) + "ません",
          jp: pot.jp.slice(0, -2) + "ません",
          vi: v.vi,
          note: "khả năng (phủ định)",
          isVerb: true, role: "verb",
        });
      }
      continue;
    }
    if (v.pos === "adj-i") {
      // dạng trạng từ く: 高い → 高く
      if (v.kana !== "いい") {
        addEntry(lex, {
          kana: v.kana.slice(0, -1) + "く",
          jp: v.jp.slice(0, -1) + "く",
          vi: v.vi,
          note: "dạng trạng từ (〜く)", role: "adj",
        });
      }
      addEntry(lex, { kana: v.kana, jp: v.jp, vi: v.vi, note: POS_VI[v.pos], role });
      continue;
    }
    addEntry(lex, { kana: v.kana, jp: v.jp, vi: v.vi, note: POS_VI[v.pos] || "", role });
  }

  return lex;
}

/* ------------------------------ Tách câu ------------------------------ */

const SKIP = /[、。！？!?\s〜「」（）()・…]/;

/**
 * Tách câu bằng quy hoạch động có trọng số:
 *  - từ vựng / cụm cố định: 1 điểm
 *  - trợ từ: 2 điểm (ưu tiên cách hiểu có trợ từ khi hai cách ngang nhau)
 *  - đoạn chưa biết: 100 điểm/char (bị phạt nặng, gộp lại và cảnh báo)
 * Nhờ vậy tránh lỗi tham lam kiểu はいくら → はい + くら.
 * @param {string} kana
 * @param {Map} lex
 * @returns {{parts:Array, unknowns:string[]}} parts có `start` = vị trí ký tự trong câu
 */
function tokenize(kana, lex) {
  const n = kana.length;
  const INF = Number.POSITIVE_INFINITY;
  const MAXLEN = 12;
  const cost = new Array(n + 1).fill(INF);
  const back = new Array(n + 1).fill(null);
  cost[0] = 0;

  for (let i = 0; i < n; i++) {
    if (cost[i] === INF) continue;
    const ch = kana[i];
    if (SKIP.test(ch)) {
      if (cost[i] < cost[i + 1]) {
        cost[i + 1] = cost[i];
        back[i + 1] = { start: i, len: 1, skip: true };
      }
      continue;
    }
    for (let len = Math.min(MAXLEN, n - i); len >= 1; len--) {
      const hit = lex.get(kana.slice(i, i + len));
      if (!hit) continue;
      const c = cost[i] + (hit.isParticle ? 2 : 1);
      if (c < cost[i + len]) {
        cost[i + len] = c;
        back[i + len] = { start: i, len, entry: hit };
      }
    }
    if (cost[i] + 100 < cost[i + 1]) {
      cost[i + 1] = cost[i] + 100;
      back[i + 1] = { start: i, len: 1, unknown: true };
    }
  }

  // Truy vết
  const nodes = [];
  for (let pos = n; pos > 0; ) {
    const b = back[pos];
    if (!b) break;
    if (!b.skip) nodes.push(b);
    pos = b.start;
  }
  nodes.reverse();

  // Gộp đoạn chưa biết liền nhau
  const parts = [];
  const unknowns = [];
  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.unknown) {
      let chunk = kana.slice(node.start, node.start + node.len);
      let j = i + 1;
      while (j < nodes.length && nodes[j].unknown) {
        const nn = nodes[j];
        chunk += kana.slice(nn.start, nn.start + nn.len);
        j += 1;
      }
      unknowns.push(chunk);
      parts.push({ kana: chunk, jp: chunk, vi: "", note: "chưa tách được nghĩa", unknown: true, start: node.start });
      i = j;
      continue;
    }
    const e = node.entry;
    parts.push({ ...e, kana: e.kana, jp: e.jp, start: node.start });
    i += 1;
  }
  return { parts, unknowns };
}

module.exports = {
  PARTICLES, POS_VI, POS_ROLE, FORM_VI,
  EXPRESSIONS, buildLexicon, tokenize,
};
