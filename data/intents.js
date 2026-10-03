window.QJ = window.QJ || {};
window.QJ.intents = {
  "intents": [
    {
      "id": "i-want",
      "emoji": "🙋",
      "label": "Tôi muốn…",
      "desc": "Nói điều mình muốn ăn, uống, mua, xem, đi",
      "group": "Ăn uống & mua sắm",
      "start": "s-subject",
      "steps": {
        "s-subject": {
          "prompt": "Ai muốn?",
          "slot": "subject",
          "options": [
            {
              "ref": "p-watashi",
              "next": "s-action",
              "jp": "私",
              "kana": "わたし",
              "roma": "watashi",
              "viPron": "oa-ta-xi",
              "vi": "tôi",
              "viLabel": "tôi",
              "posVi": "đại từ",
              "grammarHint": null,
              "role": "pron"
            },
            {
              "ref": "p-watashitachi",
              "next": "s-action",
              "jp": "私たち",
              "kana": "わたしたち",
              "roma": "watashitachi",
              "viPron": "oa-ta-xi-ta-chi",
              "vi": "chúng tôi",
              "viLabel": "chúng tôi",
              "posVi": "đại từ",
              "grammarHint": null,
              "role": "pron"
            },
            {
              "silent": true,
              "label": "Không cần chủ ngữ",
              "hint": "Người Nhật thường lược bỏ chủ ngữ khi đã rõ",
              "vi": "(tôi)",
              "next": "s-action",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Không cần chủ ngữ"
            }
          ]
        },
        "s-action": {
          "prompt": "Muốn làm gì?",
          "slot": "verb",
          "options": [
            {
              "ref": "v-taberu",
              "form": "tai",
              "next": "s-obj-food",
              "jp": "食べたい",
              "kana": "たべたい",
              "roma": "tabetai",
              "viPron": "ta-bê-ta-i",
              "vi": "ăn",
              "viLabel": "ăn",
              "posVi": "động từ",
              "formNote": "mong muốn たい",
              "grammarHint": "tai",
              "role": "verb"
            },
            {
              "ref": "v-nomu",
              "form": "tai",
              "next": "s-obj-drink",
              "jp": "飲みたい",
              "kana": "のみたい",
              "roma": "nomitai",
              "viPron": "nô-mi-ta-i",
              "vi": "uống",
              "viLabel": "uống",
              "posVi": "động từ",
              "formNote": "mong muốn たい",
              "grammarHint": "tai",
              "role": "verb"
            },
            {
              "ref": "v-kau",
              "form": "tai",
              "next": "s-obj-buy",
              "jp": "買いたい",
              "kana": "かいたい",
              "roma": "kaitai",
              "viPron": "ka-i-ta-i",
              "vi": "mua",
              "viLabel": "mua",
              "posVi": "động từ",
              "formNote": "mong muốn たい",
              "grammarHint": "tai",
              "role": "verb"
            },
            {
              "ref": "v-miru",
              "form": "tai",
              "next": "s-obj-see",
              "jp": "見たい",
              "kana": "みたい",
              "roma": "mitai",
              "viPron": "mi-ta-i",
              "vi": "xem",
              "viLabel": "xem",
              "posVi": "động từ",
              "formNote": "mong muốn たい",
              "grammarHint": "tai",
              "role": "verb"
            },
            {
              "ref": "v-iku",
              "form": "tai",
              "next": "s-obj-place",
              "jp": "行きたい",
              "kana": "いきたい",
              "roma": "ikitai",
              "viPron": "i-ki-ta-i",
              "vi": "đi",
              "viLabel": "đi",
              "posVi": "động từ",
              "formNote": "mong muốn たい",
              "grammarHint": "tai",
              "role": "verb"
            }
          ]
        },
        "s-obj-food": {
          "prompt": "Muốn ăn gì?",
          "slot": "object",
          "particle": "が",
          "options": [
            {
              "ref": "n-sushi",
              "next": null,
              "jp": "すし",
              "kana": "すし",
              "roma": "sushi",
              "viPron": "xư-xi",
              "vi": "sushi",
              "viLabel": "sushi",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-raamen",
              "next": null,
              "jp": "ラーメン",
              "kana": "ラーメン",
              "roma": "raamen",
              "viPron": "raa-mên",
              "vi": "mì ramen",
              "viLabel": "mì ramen",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-tempura",
              "next": null,
              "jp": "天ぷら",
              "kana": "てんぷら",
              "roma": "tenpura",
              "viPron": "têm-pư-ra",
              "vi": "tempura",
              "viLabel": "tempura",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-karee",
              "next": null,
              "jp": "カレー",
              "kana": "カレー",
              "roma": "karee",
              "viPron": "ka-rêê",
              "vi": "cà ri",
              "viLabel": "cà ri",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-gyuudon",
              "next": null,
              "jp": "牛丼",
              "kana": "ぎゅうどん",
              "roma": "gyuudon",
              "viPron": "giu-u-đôn",
              "vi": "cơm thịt bò",
              "viLabel": "cơm thịt bò",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "d-kore",
              "next": null,
              "jp": "これ",
              "kana": "これ",
              "roma": "kore",
              "viPron": "kô-rê",
              "vi": "cái này",
              "viLabel": "cái này",
              "posVi": "đại từ chỉ định",
              "grammarHint": "kosoado",
              "role": "pron"
            },
            {
              "ref": "d-sore",
              "next": null,
              "jp": "それ",
              "kana": "それ",
              "roma": "sore",
              "viPron": "xô-rê",
              "vi": "cái đó",
              "viLabel": "cái đó",
              "posVi": "đại từ chỉ định",
              "grammarHint": "kosoado",
              "role": "pron"
            }
          ]
        },
        "s-obj-drink": {
          "prompt": "Muốn uống gì?",
          "slot": "object",
          "particle": "が",
          "options": [
            {
              "ref": "n-mizu",
              "next": null,
              "jp": "水",
              "kana": "みず",
              "roma": "mizu",
              "viPron": "mi-zư",
              "vi": "nước",
              "viLabel": "nước",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-ocha",
              "next": null,
              "jp": "お茶",
              "kana": "おちゃ",
              "roma": "ocha",
              "viPron": "ô-cha",
              "vi": "trà",
              "viLabel": "trà",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-koohii",
              "next": null,
              "jp": "コーヒー",
              "kana": "コーヒー",
              "roma": "koohii",
              "viPron": "kôô-hii",
              "vi": "cà phê",
              "viLabel": "cà phê",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-biiru",
              "next": null,
              "jp": "ビール",
              "kana": "ビール",
              "roma": "biiru",
              "viPron": "bii-rư",
              "vi": "bia",
              "viLabel": "bia",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-juusu",
              "next": null,
              "jp": "ジュース",
              "kana": "ジュース",
              "roma": "juusu",
              "viPron": "juu-xư",
              "vi": "nước ép",
              "viLabel": "nước ép",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "d-kore",
              "next": null,
              "jp": "これ",
              "kana": "これ",
              "roma": "kore",
              "viPron": "kô-rê",
              "vi": "cái này",
              "viLabel": "cái này",
              "posVi": "đại từ chỉ định",
              "grammarHint": "kosoado",
              "role": "pron"
            }
          ]
        },
        "s-obj-buy": {
          "prompt": "Muốn mua gì?",
          "slot": "object",
          "particle": "が",
          "options": [
            {
              "ref": "n-omiyage",
              "next": null,
              "jp": "お土産",
              "kana": "おみやげ",
              "roma": "omiyage",
              "viPron": "ô-mi-ya-gê",
              "vi": "quà lưu niệm",
              "viLabel": "quà lưu niệm",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-kasa",
              "next": null,
              "jp": "傘",
              "kana": "かさ",
              "roma": "kasa",
              "viPron": "ka-xa",
              "vi": "ô, dù",
              "viLabel": "ô, dù",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-kippu",
              "next": null,
              "jp": "切符",
              "kana": "きっぷ",
              "roma": "kippu",
              "viPron": "kip-pư",
              "vi": "vé tàu/xe",
              "viLabel": "vé tàu/xe",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "d-kore",
              "next": null,
              "jp": "これ",
              "kana": "これ",
              "roma": "kore",
              "viPron": "kô-rê",
              "vi": "cái này",
              "viLabel": "cái này",
              "posVi": "đại từ chỉ định",
              "grammarHint": "kosoado",
              "role": "pron"
            },
            {
              "ref": "d-sore",
              "next": null,
              "jp": "それ",
              "kana": "それ",
              "roma": "sore",
              "viPron": "xô-rê",
              "vi": "cái đó",
              "viLabel": "cái đó",
              "posVi": "đại từ chỉ định",
              "grammarHint": "kosoado",
              "role": "pron"
            }
          ]
        },
        "s-obj-see": {
          "prompt": "Muốn xem gì?",
          "slot": "object",
          "particle": "が",
          "options": [
            {
              "ref": "n-menu",
              "next": null,
              "jp": "メニュー",
              "kana": "メニュー",
              "roma": "menyuu",
              "viPron": "mê-niuu",
              "vi": "thực đơn",
              "viLabel": "thực đơn",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-chizu",
              "next": null,
              "jp": "地図",
              "kana": "ちず",
              "roma": "chizu",
              "viPron": "chi-zư",
              "vi": "bản đồ",
              "viLabel": "bản đồ",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-shashin",
              "next": null,
              "jp": "写真",
              "kana": "しゃしん",
              "roma": "shashin",
              "viPron": "xa-xin",
              "vi": "ảnh",
              "viLabel": "ảnh",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "d-kore",
              "next": null,
              "jp": "これ",
              "kana": "これ",
              "roma": "kore",
              "viPron": "kô-rê",
              "vi": "cái này",
              "viLabel": "cái này",
              "posVi": "đại từ chỉ định",
              "grammarHint": "kosoado",
              "role": "pron"
            }
          ]
        },
        "s-obj-place": {
          "prompt": "Muốn đi đâu?",
          "slot": "object",
          "particle": "が",
          "options": [
            {
              "ref": "n-eki",
              "particle": "に",
              "vi": "đến ga",
              "next": null,
              "jp": "駅",
              "kana": "えき",
              "roma": "eki",
              "viPron": "ê-ki",
              "viLabel": "đến ga",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun",
              "particleObj": {
                "jp": "に",
                "kana": "に",
                "roma": "ni",
                "viPron": "ni",
                "vi": "～ (hướng đến / thời điểm)",
                "note": "trợ từ hướng, đích",
                "grammar": "particle-ni",
                "role": "particle",
                "isParticle": true
              }
            },
            {
              "ref": "n-kukou",
              "particle": "に",
              "vi": "đến sân bay",
              "next": null,
              "jp": "空港",
              "kana": "くうこう",
              "roma": "kuukou",
              "viPron": "cư-u-kô-u",
              "viLabel": "đến sân bay",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun",
              "particleObj": {
                "jp": "に",
                "kana": "に",
                "roma": "ni",
                "viPron": "ni",
                "vi": "～ (hướng đến / thời điểm)",
                "note": "trợ từ hướng, đích",
                "grammar": "particle-ni",
                "role": "particle",
                "isParticle": true
              }
            },
            {
              "ref": "n-hoteru",
              "particle": "に",
              "vi": "đến khách sạn",
              "next": null,
              "jp": "ホテル",
              "kana": "ホテル",
              "roma": "hoteru",
              "viPron": "hô-tê-rư",
              "viLabel": "đến khách sạn",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun",
              "particleObj": {
                "jp": "に",
                "kana": "に",
                "roma": "ni",
                "viPron": "ni",
                "vi": "～ (hướng đến / thời điểm)",
                "note": "trợ từ hướng, đích",
                "grammar": "particle-ni",
                "role": "particle",
                "isParticle": true
              }
            },
            {
              "ref": "n-onsen",
              "particle": "に",
              "vi": "đến suối nước nóng",
              "next": null,
              "jp": "温泉",
              "kana": "おんせん",
              "roma": "onsen",
              "viPron": "ôn-xên",
              "viLabel": "đến suối nước nóng",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun",
              "particleObj": {
                "jp": "に",
                "kana": "に",
                "roma": "ni",
                "viPron": "ni",
                "vi": "～ (hướng đến / thời điểm)",
                "note": "trợ từ hướng, đích",
                "grammar": "particle-ni",
                "role": "particle",
                "isParticle": true
              }
            },
            {
              "ref": "n-ichiba",
              "particle": "に",
              "vi": "đến chợ",
              "next": null,
              "jp": "市場",
              "kana": "いちば",
              "roma": "ichiba",
              "viPron": "i-chi-ba",
              "viLabel": "đến chợ",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun",
              "particleObj": {
                "jp": "に",
                "kana": "に",
                "roma": "ni",
                "viPron": "ni",
                "vi": "～ (hướng đến / thời điểm)",
                "note": "trợ từ hướng, đích",
                "grammar": "particle-ni",
                "role": "particle",
                "isParticle": true
              }
            },
            {
              "ref": "n-konbini",
              "particle": "に",
              "vi": "đến cửa hàng tiện lợi",
              "next": null,
              "jp": "コンビニ",
              "kana": "コンビニ",
              "roma": "konbini",
              "viPron": "kôm-bi-ni",
              "viLabel": "đến cửa hàng tiện lợi",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun",
              "particleObj": {
                "jp": "に",
                "kana": "に",
                "roma": "ni",
                "viPron": "ni",
                "vi": "～ (hướng đến / thời điểm)",
                "note": "trợ từ hướng, đích",
                "grammar": "particle-ni",
                "role": "particle",
                "isParticle": true
              }
            },
            {
              "ref": "n-byouin",
              "particle": "に",
              "vi": "đến bệnh viện",
              "next": null,
              "jp": "病院",
              "kana": "びょういん",
              "roma": "byouin",
              "viPron": "biô-u-in",
              "viLabel": "đến bệnh viện",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun",
              "particleObj": {
                "jp": "に",
                "kana": "に",
                "roma": "ni",
                "viPron": "ni",
                "vi": "～ (hướng đến / thời điểm)",
                "note": "trợ từ hướng, đích",
                "grammar": "particle-ni",
                "role": "particle",
                "isParticle": true
              }
            }
          ]
        }
      },
      "template": [
        {
          "slot": "subject",
          "particle": {
            "jp": "は",
            "kana": "は",
            "roma": "wa",
            "viPron": "oa",
            "vi": "～ thì / còn ～",
            "note": "trợ từ chủ đề, đọc là 'oa'",
            "grammar": "particle-wa",
            "role": "particle",
            "isParticle": true
          }
        },
        {
          "slot": "object",
          "particle": {
            "jp": "が",
            "kana": "が",
            "roma": "ga",
            "viPron": "ga",
            "vi": "～ (chủ ngữ / thứ được thích, muốn)",
            "note": "trợ từ chủ ngữ",
            "grammar": "particle-ga",
            "role": "particle",
            "isParticle": true
          }
        },
        {
          "slot": "verb",
          "particle": null
        },
        {
          "text": "です",
          "kana": "です",
          "roma": "desu",
          "viPron": "đê-xư",
          "vi": "là (lịch sự)",
          "role": "copula"
        }
      ],
      "viTemplate": "{subject} muốn {verb} {object}",
      "grammar": [
        "tai",
        "particle-ga",
        "sov"
      ],
      "tip": "たい = 'muốn làm gì'. Với 行く (đi), đích đến đánh dấu bằng に chứ không phải が."
    },
    {
      "id": "i-please",
      "emoji": "🙏",
      "label": "Cho tôi…",
      "desc": "Câu gọi món / mua hàng lịch sự với ください",
      "group": "Ăn uống & mua sắm",
      "start": "s-object",
      "steps": {
        "s-object": {
          "prompt": "Cho bạn cái gì?",
          "slot": "object",
          "particle": "を",
          "options": [
            {
              "ref": "d-kore",
              "next": "s-quantity",
              "jp": "これ",
              "kana": "これ",
              "roma": "kore",
              "viPron": "kô-rê",
              "vi": "cái này",
              "viLabel": "cái này",
              "posVi": "đại từ chỉ định",
              "grammarHint": "kosoado",
              "role": "pron"
            },
            {
              "ref": "d-sore",
              "next": "s-quantity",
              "jp": "それ",
              "kana": "それ",
              "roma": "sore",
              "viPron": "xô-rê",
              "vi": "cái đó",
              "viLabel": "cái đó",
              "posVi": "đại từ chỉ định",
              "grammarHint": "kosoado",
              "role": "pron"
            },
            {
              "ref": "d-are",
              "next": "s-quantity",
              "jp": "あれ",
              "kana": "あれ",
              "roma": "are",
              "viPron": "a-rê",
              "vi": "cái kia",
              "viLabel": "cái kia",
              "posVi": "đại từ chỉ định",
              "grammarHint": "kosoado",
              "role": "pron"
            },
            {
              "ref": "n-mizu",
              "next": "s-quantity",
              "jp": "水",
              "kana": "みず",
              "roma": "mizu",
              "viPron": "mi-zư",
              "vi": "nước",
              "viLabel": "nước",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-ocha",
              "next": "s-quantity",
              "jp": "お茶",
              "kana": "おちゃ",
              "roma": "ocha",
              "viPron": "ô-cha",
              "vi": "trà",
              "viLabel": "trà",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-koohii",
              "next": "s-quantity",
              "jp": "コーヒー",
              "kana": "コーヒー",
              "roma": "koohii",
              "viPron": "kôô-hii",
              "vi": "cà phê",
              "viLabel": "cà phê",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-biiru",
              "next": "s-quantity",
              "jp": "ビール",
              "kana": "ビール",
              "roma": "biiru",
              "viPron": "bii-rư",
              "vi": "bia",
              "viLabel": "bia",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-menu",
              "next": "s-quantity",
              "jp": "メニュー",
              "kana": "メニュー",
              "roma": "menyuu",
              "viPron": "mê-niuu",
              "vi": "thực đơn",
              "viLabel": "thực đơn",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-sushi",
              "next": "s-quantity",
              "jp": "すし",
              "kana": "すし",
              "roma": "sushi",
              "viPron": "xư-xi",
              "vi": "sushi",
              "viLabel": "sushi",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-raamen",
              "next": "s-quantity",
              "jp": "ラーメン",
              "kana": "ラーメン",
              "roma": "raamen",
              "viPron": "raa-mên",
              "vi": "mì ramen",
              "viLabel": "mì ramen",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            }
          ]
        },
        "s-quantity": {
          "prompt": "Số lượng?",
          "slot": "quantity",
          "options": [
            {
              "silent": true,
              "label": "Không cần số lượng",
              "vi": "",
              "next": null,
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Không cần số lượng"
            },
            {
              "jp": "一つ",
              "kana": "ひとつ",
              "vi": "một cái",
              "next": null,
              "roma": "hitotsu",
              "viPron": "hi-tô-tsư",
              "viLabel": "một cái"
            },
            {
              "jp": "二つ",
              "kana": "ふたつ",
              "vi": "hai cái",
              "next": null,
              "roma": "futatsu",
              "viPron": "phư-ta-tsư",
              "viLabel": "hai cái"
            },
            {
              "jp": "三つ",
              "kana": "みっつ",
              "vi": "ba cái",
              "next": null,
              "roma": "mittsu",
              "viPron": "mit-tsư",
              "viLabel": "ba cái"
            }
          ]
        }
      },
      "template": [
        {
          "slot": "object",
          "particle": {
            "jp": "を",
            "kana": "を",
            "roma": "o",
            "viPron": "ô",
            "vi": "～ (đối tượng của hành động)",
            "note": "trợ từ tân ngữ, đọc là 'ô'",
            "grammar": "particle-wo",
            "role": "particle",
            "isParticle": true
          }
        },
        {
          "slot": "quantity",
          "particle": null
        },
        {
          "text": "ください",
          "kana": "ください",
          "roma": "kudasai",
          "viPron": "cư-đa-xa-i",
          "vi": "xin hãy cho",
          "role": "expression"
        }
      ],
      "viTemplate": "Cho tôi {object}, {quantity}",
      "grammar": [
        "kudasai-onegai",
        "particle-wo",
        "counters"
      ],
      "tip": "ください là cách 'cho tôi' chuẩn mực nhất. Số lượng đứng ngay trước ください."
    },
    {
      "id": "i-like",
      "emoji": "❤️",
      "label": "Tôi thích…",
      "desc": "Nói món ăn, đồ uống, địa điểm mình thích",
      "group": "Ăn uống & mua sắm",
      "start": "s-subject",
      "steps": {
        "s-subject": {
          "prompt": "Ai thích?",
          "slot": "subject",
          "options": [
            {
              "ref": "p-watashi",
              "next": "s-object",
              "jp": "私",
              "kana": "わたし",
              "roma": "watashi",
              "viPron": "oa-ta-xi",
              "vi": "tôi",
              "viLabel": "tôi",
              "posVi": "đại từ",
              "grammarHint": null,
              "role": "pron"
            },
            {
              "ref": "p-watashitachi",
              "next": "s-object",
              "jp": "私たち",
              "kana": "わたしたち",
              "roma": "watashitachi",
              "viPron": "oa-ta-xi-ta-chi",
              "vi": "chúng tôi",
              "viLabel": "chúng tôi",
              "posVi": "đại từ",
              "grammarHint": null,
              "role": "pron"
            },
            {
              "silent": true,
              "label": "Không cần chủ ngữ",
              "vi": "(tôi)",
              "next": "s-object",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Không cần chủ ngữ"
            }
          ]
        },
        "s-object": {
          "prompt": "Thích gì?",
          "slot": "object",
          "particle": "が",
          "options": [
            {
              "ref": "n-sushi",
              "next": null,
              "jp": "すし",
              "kana": "すし",
              "roma": "sushi",
              "viPron": "xư-xi",
              "vi": "sushi",
              "viLabel": "sushi",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-raamen",
              "next": null,
              "jp": "ラーメン",
              "kana": "ラーメン",
              "roma": "raamen",
              "viPron": "raa-mên",
              "vi": "mì ramen",
              "viLabel": "mì ramen",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-tempura",
              "next": null,
              "jp": "天ぷら",
              "kana": "てんぷら",
              "roma": "tenpura",
              "viPron": "têm-pư-ra",
              "vi": "tempura",
              "viLabel": "tempura",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-karee",
              "next": null,
              "jp": "カレー",
              "kana": "カレー",
              "roma": "karee",
              "viPron": "ka-rêê",
              "vi": "cà ri",
              "viLabel": "cà ri",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-koohii",
              "next": null,
              "jp": "コーヒー",
              "kana": "コーヒー",
              "roma": "koohii",
              "viPron": "kôô-hii",
              "vi": "cà phê",
              "viLabel": "cà phê",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-ocha",
              "next": null,
              "jp": "お茶",
              "kana": "おちゃ",
              "roma": "ocha",
              "viPron": "ô-cha",
              "vi": "trà",
              "viLabel": "trà",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-nihon",
              "next": null,
              "jp": "日本",
              "kana": "にほん",
              "roma": "nihon",
              "viPron": "ni-hôn",
              "vi": "Nhật Bản",
              "viLabel": "Nhật Bản",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-onsen",
              "next": null,
              "jp": "温泉",
              "kana": "おんせん",
              "roma": "onsen",
              "viPron": "ôn-xên",
              "vi": "suối nước nóng",
              "viLabel": "suối nước nóng",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            }
          ]
        }
      },
      "template": [
        {
          "slot": "subject",
          "particle": {
            "jp": "は",
            "kana": "は",
            "roma": "wa",
            "viPron": "oa",
            "vi": "～ thì / còn ～",
            "note": "trợ từ chủ đề, đọc là 'oa'",
            "grammar": "particle-wa",
            "role": "particle",
            "isParticle": true
          }
        },
        {
          "slot": "object",
          "particle": {
            "jp": "が",
            "kana": "が",
            "roma": "ga",
            "viPron": "ga",
            "vi": "～ (chủ ngữ / thứ được thích, muốn)",
            "note": "trợ từ chủ ngữ",
            "grammar": "particle-ga",
            "role": "particle",
            "isParticle": true
          }
        },
        {
          "text": "好きです",
          "kana": "すきです",
          "roma": "sukidesu",
          "viPron": "xư-ki-đê-xư",
          "vi": "thích",
          "role": "expression"
        }
      ],
      "viTemplate": "{subject} thích {object}",
      "grammar": [
        "suki",
        "particle-ga",
        "particle-wa"
      ],
      "tip": "好き là tính từ đuôi な, thứ được thích đánh dấu bằng が (không phải を)."
    },
    {
      "id": "i-this",
      "emoji": "👉",
      "label": "Cái này thì sao?",
      "desc": "Chỉ vào đồ vật rồi hỏi / mua",
      "group": "Ăn uống & mua sắm",
      "start": "s-demo",
      "steps": {
        "s-demo": {
          "prompt": "Chỉ vào…",
          "slot": "demo",
          "options": [
            {
              "ref": "d-kore",
              "next": "s-ask",
              "jp": "これ",
              "kana": "これ",
              "roma": "kore",
              "viPron": "kô-rê",
              "vi": "cái này",
              "viLabel": "cái này",
              "posVi": "đại từ chỉ định",
              "grammarHint": "kosoado",
              "role": "pron"
            },
            {
              "ref": "d-sore",
              "next": "s-ask",
              "jp": "それ",
              "kana": "それ",
              "roma": "sore",
              "viPron": "xô-rê",
              "vi": "cái đó",
              "viLabel": "cái đó",
              "posVi": "đại từ chỉ định",
              "grammarHint": "kosoado",
              "role": "pron"
            },
            {
              "ref": "d-are",
              "next": "s-ask",
              "jp": "あれ",
              "kana": "あれ",
              "roma": "are",
              "viPron": "a-rê",
              "vi": "cái kia",
              "viLabel": "cái kia",
              "posVi": "đại từ chỉ định",
              "grammarHint": "kosoado",
              "role": "pron"
            }
          ]
        },
        "s-ask": {
          "prompt": "Bạn muốn hỏi gì?",
          "slot": "suffix",
          "options": [
            {
              "jp": "何ですか",
              "kana": "なんですか",
              "vi": "là gì?",
              "templateOverride": [
                {
                  "slot": "demo",
                  "particle": {
                    "jp": "は",
                    "kana": "は",
                    "roma": "wa",
                    "viPron": "oa",
                    "vi": "～ thì / còn ～",
                    "note": "trợ từ chủ đề, đọc là 'oa'",
                    "grammar": "particle-wa",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "何ですか",
                  "kana": "なんですか",
                  "roma": "nandesuka",
                  "viPron": "nan-đê-xư-ka",
                  "vi": "là gì?",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "{demo} là gì?",
              "next": null,
              "roma": "nandesuka",
              "viPron": "nan-đê-xư-ka",
              "viLabel": "là gì?"
            },
            {
              "jp": "いくらですか",
              "kana": "いくらですか",
              "vi": "bao nhiêu tiền?",
              "templateOverride": [
                {
                  "slot": "demo",
                  "particle": {
                    "jp": "は",
                    "kana": "は",
                    "roma": "wa",
                    "viPron": "oa",
                    "vi": "～ thì / còn ～",
                    "note": "trợ từ chủ đề, đọc là 'oa'",
                    "grammar": "particle-wa",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "いくらですか",
                  "kana": "いくらですか",
                  "roma": "ikuradesuka",
                  "viPron": "i-cư-ra-đê-xư-ka",
                  "vi": "bao nhiêu tiền?",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "{demo} bao nhiêu tiền?",
              "next": null,
              "roma": "ikuradesuka",
              "viPron": "i-cư-ra-đê-xư-ka",
              "viLabel": "bao nhiêu tiền?"
            },
            {
              "jp": "いいですか",
              "kana": "いいですか",
              "vi": "có được không?",
              "templateOverride": [
                {
                  "slot": "demo",
                  "particle": {
                    "jp": "で",
                    "kana": "で",
                    "roma": "de",
                    "viPron": "đê",
                    "vi": "～ (nơi xảy ra / phương tiện)",
                    "note": "trợ từ nơi / cách thức",
                    "grammar": "particle-de",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "いいですか",
                  "kana": "いいですか",
                  "roma": "iidesuka",
                  "viPron": "i-i-đê-xư-ka",
                  "vi": "được không?",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "{demo} có được không ạ?",
              "next": null,
              "roma": "iidesuka",
              "viPron": "i-i-đê-xư-ka",
              "viLabel": "có được không?"
            },
            {
              "jp": "ください",
              "kana": "ください",
              "vi": "cho tôi",
              "templateOverride": [
                {
                  "slot": "demo",
                  "particle": {
                    "jp": "を",
                    "kana": "を",
                    "roma": "o",
                    "viPron": "ô",
                    "vi": "～ (đối tượng của hành động)",
                    "note": "trợ từ tân ngữ, đọc là 'ô'",
                    "grammar": "particle-wo",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "ください",
                  "kana": "ください",
                  "roma": "kudasai",
                  "viPron": "cư-đa-xa-i",
                  "vi": "xin hãy cho",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "Cho tôi {demo}",
              "next": null,
              "roma": "kudasai",
              "viPron": "cư-đa-xa-i",
              "viLabel": "cho tôi"
            }
          ]
        }
      },
      "template": [
        {
          "slot": "demo",
          "particle": {
            "jp": "は",
            "kana": "は",
            "roma": "wa",
            "viPron": "oa",
            "vi": "～ thì / còn ～",
            "note": "trợ từ chủ đề, đọc là 'oa'",
            "grammar": "particle-wa",
            "role": "particle",
            "isParticle": true
          }
        },
        {
          "text": "何ですか",
          "kana": "なんですか",
          "roma": "nandesuka",
          "viPron": "nan-đê-xư-ka",
          "vi": "là gì?",
          "role": "expression"
        }
      ],
      "viTemplate": "{demo} là gì?",
      "grammar": [
        "kosoado",
        "question-ka",
        "particle-wa"
      ],
      "tip": "これ/それ/あれ chọn theo khoảng cách: gần mình – gần người nghe – xa cả hai."
    },
    {
      "id": "i-go",
      "emoji": "🚕",
      "label": "Đi đến…",
      "desc": "Nói muốn đi đâu hoặc nhờ tài xế đưa đến nơi",
      "group": "Đi lại & khách sạn",
      "start": "s-way",
      "steps": {
        "s-way": {
          "prompt": "Bạn muốn nói kiểu nào?",
          "options": [
            {
              "silent": true,
              "label": "Tôi muốn đi đến…",
              "vi": "(tôi muốn đi đến)",
              "templateOverride": [
                {
                  "slot": "place",
                  "particle": {
                    "jp": "に",
                    "kana": "に",
                    "roma": "ni",
                    "viPron": "ni",
                    "vi": "～ (hướng đến / thời điểm)",
                    "note": "trợ từ hướng, đích",
                    "grammar": "particle-ni",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "行きたいです",
                  "kana": "いきたいです",
                  "roma": "ikitaidesu",
                  "viPron": "i-ki-ta-i-đê-xư",
                  "vi": "muốn đi",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "Tôi muốn đi đến {place}",
              "next": "s-place",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Tôi muốn đi đến…"
            },
            {
              "silent": true,
              "label": "Nhờ đưa tôi đến… (taxi)",
              "vi": "(làm ơn đưa tôi đến)",
              "templateOverride": [
                {
                  "slot": "place",
                  "particle": {
                    "jp": "まで",
                    "kana": "まで",
                    "roma": "made",
                    "viPron": "ma-đê",
                    "vi": "～ cho đến (điểm đến)",
                    "note": "trợ từ giới hạn điểm đến",
                    "grammar": "particle-ni",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "お願いします",
                  "kana": "おねがいします",
                  "roma": "onegaishimasu",
                  "viPron": "ô-nê-ga-i-xi-ma-xư",
                  "vi": "xin nhờ / làm ơn",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "Làm ơn đưa tôi đến {place}",
              "next": "s-place",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Nhờ đưa tôi đến… (taxi)"
            },
            {
              "silent": true,
              "label": "Tàu này có đi… không?",
              "vi": "(tàu này có đi)",
              "templateOverride": [
                {
                  "text": "この電車は",
                  "kana": "このでんしゃは",
                  "roma": "kono densha wa",
                  "viPron": "cô-nô đên-xa oa",
                  "vi": "tàu này thì",
                  "role": "expression"
                },
                {
                  "slot": "place",
                  "particle": {
                    "jp": "に",
                    "kana": "に",
                    "roma": "ni",
                    "viPron": "ni",
                    "vi": "～ (hướng đến / thời điểm)",
                    "note": "trợ từ hướng, đích",
                    "grammar": "particle-ni",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "行きますか",
                  "kana": "いきますか",
                  "roma": "ikimasuka",
                  "viPron": "i-ki-ma-xư-ka",
                  "vi": "có đi không?",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "Tàu này có đi {place} không?",
              "next": "s-place",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Tàu này có đi… không?"
            }
          ]
        },
        "s-place": {
          "prompt": "Điểm đến là đâu?",
          "slot": "place",
          "options": [
            {
              "ref": "n-eki",
              "next": null,
              "jp": "駅",
              "kana": "えき",
              "roma": "eki",
              "viPron": "ê-ki",
              "vi": "ga tàu",
              "viLabel": "ga tàu",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-kukou",
              "next": null,
              "jp": "空港",
              "kana": "くうこう",
              "roma": "kuukou",
              "viPron": "cư-u-kô-u",
              "vi": "sân bay",
              "viLabel": "sân bay",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-hoteru",
              "next": null,
              "jp": "ホテル",
              "kana": "ホテル",
              "roma": "hoteru",
              "viPron": "hô-tê-rư",
              "vi": "khách sạn",
              "viLabel": "khách sạn",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-toire",
              "next": null,
              "jp": "トイレ",
              "kana": "トイレ",
              "roma": "toire",
              "viPron": "tô-i-rê",
              "vi": "nhà vệ sinh",
              "viLabel": "nhà vệ sinh",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-onsen",
              "next": null,
              "jp": "温泉",
              "kana": "おんせん",
              "roma": "onsen",
              "viPron": "ôn-xên",
              "vi": "suối nước nóng",
              "viLabel": "suối nước nóng",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-ichiba",
              "next": null,
              "jp": "市場",
              "kana": "いちば",
              "roma": "ichiba",
              "viPron": "i-chi-ba",
              "vi": "chợ",
              "viLabel": "chợ",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-ginkou",
              "next": null,
              "jp": "銀行",
              "kana": "ぎんこう",
              "roma": "ginkou",
              "viPron": "ging-kô-u",
              "vi": "ngân hàng",
              "viLabel": "ngân hàng",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-byouin",
              "next": null,
              "jp": "病院",
              "kana": "びょういん",
              "roma": "byouin",
              "viPron": "biô-u-in",
              "vi": "bệnh viện",
              "viLabel": "bệnh viện",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-basutei",
              "next": null,
              "jp": "バス停",
              "kana": "バスてい",
              "roma": "basutei",
              "viPron": "ba-xư-tê-i",
              "vi": "trạm xe buýt",
              "viLabel": "trạm xe buýt",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            }
          ]
        }
      },
      "template": [
        {
          "slot": "place",
          "particle": {
            "jp": "に",
            "kana": "に",
            "roma": "ni",
            "viPron": "ni",
            "vi": "～ (hướng đến / thời điểm)",
            "note": "trợ từ hướng, đích",
            "grammar": "particle-ni",
            "role": "particle",
            "isParticle": true
          }
        },
        {
          "text": "行きたいです",
          "kana": "いきたいです",
          "roma": "ikitaidesu",
          "viPron": "i-ki-ta-i-đê-xư",
          "vi": "muốn đi",
          "role": "expression"
        }
      ],
      "viTemplate": "Tôi muốn đi đến {place}",
      "grammar": [
        "particle-ni",
        "tai"
      ],
      "tip": "Đến (điểm đích) dùng に; nhờ taxi đi đến dùng まで + お願いします."
    },
    {
      "id": "i-do-please",
      "emoji": "🆘",
      "label": "Làm ơn giúp tôi…",
      "desc": "Nhờ nói chậm, viết ra, chỉ đường, chụp ảnh…",
      "group": "Giao tiếp",
      "start": "s-action",
      "steps": {
        "s-action": {
          "prompt": "Nhờ giúp điều gì?",
          "slot": "action",
          "options": [
            {
              "jp": "ゆっくり話して",
              "kana": "ゆっくりはなして",
              "vi": "nói chậm lại",
              "next": null,
              "roma": "yukkurihanashite",
              "viPron": "yuk-cư-ri-ha-na-xi-tê",
              "viLabel": "nói chậm lại"
            },
            {
              "jp": "もう一度言って",
              "kana": "もういちどいって",
              "vi": "nói lại lần nữa",
              "next": null,
              "roma": "mouichidoitte",
              "viPron": "mô-u-i-chi-đô-it-tê",
              "viLabel": "nói lại lần nữa"
            },
            {
              "jp": "ここに書いて",
              "kana": "ここにかいて",
              "vi": "viết ra đây",
              "next": null,
              "roma": "kokonikaite",
              "viPron": "kô-kô-ni-ka-i-tê",
              "viLabel": "viết ra đây"
            },
            {
              "jp": "地図で指して",
              "kana": "ちずでさして",
              "vi": "chỉ trên bản đồ",
              "next": null,
              "roma": "chizudesashite",
              "viPron": "chi-zư-đê-xa-xi-tê",
              "viLabel": "chỉ trên bản đồ"
            },
            {
              "jp": "写真を撮って",
              "kana": "しゃしんをとって",
              "vi": "chụp ảnh giúp",
              "next": null,
              "roma": "shashinototte",
              "viPron": "xa-xin-ô-tôt-tê",
              "viLabel": "chụp ảnh giúp"
            },
            {
              "jp": "医者を呼んで",
              "kana": "いしゃをよんで",
              "vi": "gọi bác sĩ",
              "next": null,
              "roma": "ishaoyonde",
              "viPron": "i-xa-ô-yôn-đê",
              "viLabel": "gọi bác sĩ"
            },
            {
              "jp": "助けて",
              "kana": "たすけて",
              "vi": "giúp tôi",
              "next": null,
              "roma": "tasukete",
              "viPron": "ta-xư-kê-tê",
              "viLabel": "giúp tôi"
            }
          ]
        }
      },
      "template": [
        {
          "slot": "action",
          "particle": null
        },
        {
          "text": "ください",
          "kana": "ください",
          "roma": "kudasai",
          "viPron": "cư-đa-xa-i",
          "vi": "xin hãy cho",
          "role": "expression"
        }
      ],
      "viTemplate": "Làm ơn {action}",
      "grammar": [
        "te-kudasai",
        "kudasai-onegai"
      ],
      "tip": "Cấu trúc: thể て của động từ + ください = 'làm ơn hãy…'."
    },
    {
      "id": "i-respond",
      "emoji": "💬",
      "label": "Trả lời & xử lý",
      "desc": "Đồng ý, từ chối, không hiểu, nói về bạn",
      "group": "Giao tiếp",
      "start": "s-kind",
      "steps": {
        "s-kind": {
          "prompt": "Bạn muốn phản hồi thế nào?",
          "options": [
            {
              "silent": true,
              "label": "Đồng ý / đã hiểu",
              "vi": "(đồng ý)",
              "next": "s-yes",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Đồng ý / đã hiểu"
            },
            {
              "silent": true,
              "label": "Từ chối lịch sự",
              "vi": "(từ chối)",
              "next": "s-no",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Từ chối lịch sự"
            },
            {
              "silent": true,
              "label": "Không hiểu / nhờ giúp",
              "vi": "(không hiểu)",
              "next": "s-confused",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Không hiểu / nhờ giúp"
            },
            {
              "silent": true,
              "label": "Nói về bạn",
              "vi": "(về tôi)",
              "next": "s-me",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Nói về bạn"
            }
          ]
        },
        "s-yes": {
          "prompt": "Đồng ý thế nào?",
          "options": [
            {
              "jp": "はい",
              "kana": "はい",
              "vi": "Vâng / Dạ",
              "next": null,
              "roma": "hai",
              "viPron": "ha-i",
              "viLabel": "Vâng / Dạ"
            },
            {
              "jp": "わかりました",
              "kana": "わかりました",
              "vi": "Tôi hiểu rồi",
              "next": null,
              "roma": "wakarimashita",
              "viPron": "oa-ka-ri-ma-xi-ta",
              "viLabel": "Tôi hiểu rồi"
            },
            {
              "jp": "大丈夫です",
              "kana": "だいじょうぶです",
              "vi": "Không sao đâu / Tôi ổn",
              "next": null,
              "roma": "daijoubudesu",
              "viPron": "đa-i-jô-u-bư-đê-xư",
              "viLabel": "Không sao đâu / Tôi ổn"
            },
            {
              "jp": "そうですね",
              "kana": "そうですね",
              "vi": "Ừ nhỉ / Đúng vậy nhỉ",
              "next": null,
              "roma": "soudesune",
              "viPron": "xô-u-đê-xư-nê",
              "viLabel": "Ừ nhỉ / Đúng vậy nhỉ"
            }
          ]
        },
        "s-no": {
          "prompt": "Từ chối thế nào?",
          "options": [
            {
              "jp": "いいえ",
              "kana": "いいえ",
              "vi": "Không",
              "note": "Người Nhật ít dùng thẳng.",
              "next": null,
              "roma": "iie",
              "viPron": "i-i-ê",
              "viLabel": "Không"
            },
            {
              "jp": "大丈夫です",
              "kana": "だいじょうぶです",
              "vi": "Không, cảm ơn / Tôi ổn",
              "next": null,
              "roma": "daijoubudesu",
              "viPron": "đa-i-jô-u-bư-đê-xư",
              "viLabel": "Không, cảm ơn / Tôi ổn"
            },
            {
              "jp": "いいです",
              "kana": "いいです",
              "vi": "Thôi, khỏi cần ạ",
              "note": "Khi được mời thêm, いいです nghĩa là từ chối.",
              "next": null,
              "roma": "iidesu",
              "viPron": "i-i-đê-xư",
              "viLabel": "Thôi, khỏi cần ạ"
            },
            {
              "jp": "結構です",
              "kana": "けっこうです",
              "vi": "Không cần đâu ạ",
              "next": null,
              "roma": "kekkoudesu",
              "viPron": "kêk-kô-u-đê-xư",
              "viLabel": "Không cần đâu ạ"
            },
            {
              "jp": "ちょっと難しいです",
              "kana": "ちょっとむずかしいです",
              "vi": "Hơi khó ạ…",
              "next": null,
              "roma": "chottomuzukashiidesu",
              "viPron": "chôt-tô-mư-zư-ka-xi-i-đê-xư",
              "viLabel": "Hơi khó ạ…"
            },
            {
              "silent": true,
              "label": "Tôi không ăn được…",
              "vi": "(tôi không ăn được)",
              "templateOverride": [
                {
                  "slot": "food",
                  "particle": {
                    "jp": "は",
                    "kana": "は",
                    "roma": "wa",
                    "viPron": "oa",
                    "vi": "～ thì / còn ～",
                    "note": "trợ từ chủ đề, đọc là 'oa'",
                    "grammar": "particle-wa",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "食べられません",
                  "kana": "たべられません",
                  "roma": "taberaremasen",
                  "viPron": "ta-bê-ra-rê-ma-xên",
                  "vi": "không ăn được",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "Tôi không ăn được {food}",
              "next": "s-food",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Tôi không ăn được…"
            }
          ]
        },
        "s-confused": {
          "prompt": "Không hiểu thì nói gì?",
          "options": [
            {
              "jp": "わかりません",
              "kana": "わかりません",
              "vi": "Tôi không hiểu",
              "next": null,
              "roma": "wakarimasen",
              "viPron": "oa-ka-ri-ma-xên",
              "viLabel": "Tôi không hiểu"
            },
            {
              "jp": "日本語がわかりません",
              "kana": "にほんごがわかりません",
              "vi": "Tôi không hiểu tiếng Nhật",
              "next": null,
              "roma": "nihongogawakarimasen",
              "viPron": "ni-hông-gô-ga-oa-ka-ri-ma-xên",
              "viLabel": "Tôi không hiểu tiếng Nhật"
            },
            {
              "jp": "英語でお願いします",
              "kana": "えいごでおねがいします",
              "vi": "Làm ơn nói tiếng Anh",
              "next": null,
              "roma": "eigodeonegaishimasu",
              "viPron": "ê-i-gô-đê-ô-nê-ga-i-xi-ma-xư",
              "viLabel": "Làm ơn nói tiếng Anh"
            },
            {
              "jp": "もう一度お願いします",
              "kana": "もういちどおねがいします",
              "vi": "Làm ơn nhắc lại",
              "next": null,
              "roma": "mouichidoonegaishimasu",
              "viPron": "mô-u-i-chi-đô-ô-nê-ga-i-xi-ma-xư",
              "viLabel": "Làm ơn nhắc lại"
            },
            {
              "jp": "ゆっくりお願いします",
              "kana": "ゆっくりおねがいします",
              "vi": "Làm ơn nói chậm hơn",
              "next": null,
              "roma": "yukkurionegaishimasu",
              "viPron": "yuk-cư-ri-ô-nê-ga-i-xi-ma-xư",
              "viLabel": "Làm ơn nói chậm hơn"
            },
            {
              "jp": "ちょっと待ってください",
              "kana": "ちょっとまってください",
              "vi": "Làm ơn đợi một chút",
              "next": null,
              "roma": "chottomattekudasai",
              "viPron": "chôt-tô-mat-tê-cư-đa-xa-i",
              "viLabel": "Làm ơn đợi một chút"
            },
            {
              "jp": "書いてもらえますか",
              "kana": "かいてもらえますか",
              "vi": "Viết ra giúp tôi được không?",
              "next": null,
              "roma": "kaitemoraemasuka",
              "viPron": "ka-i-tê-mô-ra-ê-ma-xư-ka",
              "viLabel": "Viết ra giúp tôi được không?"
            }
          ]
        },
        "s-me": {
          "prompt": "Nói gì về bạn?",
          "options": [
            {
              "jp": "ベトナム人です",
              "kana": "ベトナムじんです",
              "vi": "Tôi là người Việt Nam",
              "next": null,
              "roma": "betonamujindesu",
              "viPron": "bê-tô-na-mư-jin-đê-xư",
              "viLabel": "Tôi là người Việt Nam"
            },
            {
              "jp": "日本語が話せません",
              "kana": "にほんごがはなせません",
              "vi": "Tôi không nói được tiếng Nhật",
              "next": null,
              "roma": "nihongogahanasemasen",
              "viPron": "ni-hông-gô-ga-ha-na-xê-ma-xên",
              "viLabel": "Tôi không nói được tiếng Nhật"
            },
            {
              "jp": "英語が少し話せます",
              "kana": "えいごがすこしはなせます",
              "vi": "Tôi nói được một chút tiếng Anh",
              "next": null,
              "roma": "eigogasukoshihanasemasu",
              "viPron": "ê-i-gô-ga-xư-kô-xi-ha-na-xê-ma-xư",
              "viLabel": "Tôi nói được một chút tiếng Anh"
            },
            {
              "jp": "日本語が少しわかります",
              "kana": "にほんごがすこしわかります",
              "vi": "Tôi hiểu một chút tiếng Nhật",
              "next": null,
              "roma": "nihongogasukoshiwakarimasu",
              "viPron": "ni-hông-gô-ga-xư-kô-xi-oa-ka-ri-ma-xư",
              "viLabel": "Tôi hiểu một chút tiếng Nhật"
            },
            {
              "jp": "アレルギーがあります",
              "kana": "アレルギーがあります",
              "vi": "Tôi bị dị ứng",
              "next": null,
              "roma": "arerugiigaarimasu",
              "viPron": "a-rê-rư-gii-ga-a-ri-ma-xư",
              "viLabel": "Tôi bị dị ứng"
            }
          ]
        },
        "s-food": {
          "prompt": "Không ăn được gì?",
          "slot": "food",
          "options": [
            {
              "ref": "n-butaniku",
              "next": null,
              "jp": "豚肉",
              "kana": "ぶたにく",
              "roma": "butaniku",
              "viPron": "bư-ta-ni-cư",
              "vi": "thịt lợn",
              "viLabel": "thịt lợn",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-gyuuniku",
              "next": null,
              "jp": "牛肉",
              "kana": "ぎゅうにく",
              "roma": "gyuuniku",
              "viPron": "giu-u-ni-cư",
              "vi": "thịt bò",
              "viLabel": "thịt bò",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-toriniku",
              "next": null,
              "jp": "鶏肉",
              "kana": "とりにく",
              "roma": "toriniku",
              "viPron": "tô-ri-ni-cư",
              "vi": "thịt gà",
              "viLabel": "thịt gà",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-kaisen",
              "next": null,
              "jp": "海鮮",
              "kana": "かいせん",
              "roma": "kaisen",
              "viPron": "ka-i-xên",
              "vi": "hải sản",
              "viLabel": "hải sản",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            }
          ]
        }
      },
      "viTemplate": null,
      "grammar": [
        "desu",
        "te-kudasai"
      ],
      "tip": "Khi bí, chỉ cần すみません、わかりません — hoặc bấm 📺 đưa máy cho người đối diện."
    },
    {
      "id": "i-can",
      "emoji": "👌",
      "label": "Cái này được không?",
      "desc": "Xin phép hoặc hỏi dịch vụ có được không",
      "group": "Giao tiếp",
      "start": "s-can",
      "steps": {
        "s-can": {
          "prompt": "Bạn muốn hỏi điều gì?",
          "options": [
            {
              "jp": "カードは使えますか",
              "kana": "カードはつかえますか",
              "vi": "Dùng thẻ được không?",
              "roma": "kaadohatsukaemasuka",
              "viPron": "kaa-đô-ha-tsư-ka-ê-ma-xư-ka",
              "next": null,
              "viLabel": "Dùng thẻ được không?"
            },
            {
              "jp": "免税できますか",
              "kana": "めんぜいできますか",
              "vi": "Được miễn thuế không?",
              "next": null,
              "roma": "menzeidekimasuka",
              "viPron": "mên-zê-i-đê-ki-ma-xư-ka",
              "viLabel": "Được miễn thuế không?"
            },
            {
              "jp": "持ち帰りできますか",
              "kana": "もちかえりできますか",
              "vi": "Mang về được không?",
              "next": null,
              "roma": "mochikaeridekimasuka",
              "viPron": "mô-chi-ka-ê-ri-đê-ki-ma-xư-ka",
              "viLabel": "Mang về được không?"
            },
            {
              "jp": "写真を撮ってもいいですか",
              "kana": "しゃしんをとってもいいですか",
              "vi": "Tôi chụp ảnh được không?",
              "next": null,
              "roma": "shashinotottemoiidesuka",
              "viPron": "xa-xin-ô-tôt-tê-mô-i-i-đê-xư-ka",
              "viLabel": "Tôi chụp ảnh được không?"
            },
            {
              "jp": "試着してもいいですか",
              "kana": "しちゃくしてもいいですか",
              "vi": "Tôi mặc thử được không?",
              "next": null,
              "roma": "shichakushitemoiidesuka",
              "viPron": "xi-cha-cư-xi-tê-mô-i-i-đê-xư-ka",
              "viLabel": "Tôi mặc thử được không?"
            },
            {
              "jp": "入ってもいいですか",
              "kana": "はいってもいいですか",
              "vi": "Tôi vào được không?",
              "next": null,
              "roma": "haittemoiidesuka",
              "viPron": "ha-it-tê-mô-i-i-đê-xư-ka",
              "viLabel": "Tôi vào được không?"
            },
            {
              "jp": "座ってもいいですか",
              "kana": "すわってもいいですか",
              "vi": "Tôi ngồi được không?",
              "next": null,
              "roma": "suwattemoiidesuka",
              "viPron": "xư-oat-tê-mô-i-i-đê-xư-ka",
              "viLabel": "Tôi ngồi được không?"
            }
          ]
        }
      },
      "viTemplate": null,
      "grammar": [
        "te-mo-ii",
        "potential"
      ],
      "tip": "〜てもいいですか = xin phép; 〜できますか = có làm được không."
    },
    {
      "id": "i-where",
      "emoji": "🗺️",
      "label": "…ở đâu?",
      "desc": "Hỏi vị trí nhà vệ sinh, ga, khách sạn…",
      "group": "Đi lại & khách sạn",
      "start": "s-place",
      "steps": {
        "s-place": {
          "prompt": "Tìm gì?",
          "slot": "place",
          "options": [
            {
              "ref": "n-toire",
              "next": null,
              "jp": "トイレ",
              "kana": "トイレ",
              "roma": "toire",
              "viPron": "tô-i-rê",
              "vi": "nhà vệ sinh",
              "viLabel": "nhà vệ sinh",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-eki",
              "next": null,
              "jp": "駅",
              "kana": "えき",
              "roma": "eki",
              "viPron": "ê-ki",
              "vi": "ga tàu",
              "viLabel": "ga tàu",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-kukou",
              "next": null,
              "jp": "空港",
              "kana": "くうこう",
              "roma": "kuukou",
              "viPron": "cư-u-kô-u",
              "vi": "sân bay",
              "viLabel": "sân bay",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-hoteru",
              "next": null,
              "jp": "ホテル",
              "kana": "ホテル",
              "roma": "hoteru",
              "viPron": "hô-tê-rư",
              "vi": "khách sạn",
              "viLabel": "khách sạn",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-yakkyoku",
              "next": null,
              "jp": "薬局",
              "kana": "やっきょく",
              "roma": "yakkyoku",
              "viPron": "yak-kiô-cư",
              "vi": "hiệu thuốc",
              "viLabel": "hiệu thuốc",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-kouban",
              "next": null,
              "jp": "交番",
              "kana": "こうばん",
              "roma": "kouban",
              "viPron": "kô-u-ban",
              "vi": "chốt cảnh sát",
              "viLabel": "chốt cảnh sát",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-ginkou",
              "next": null,
              "jp": "銀行",
              "kana": "ぎんこう",
              "roma": "ginkou",
              "viPron": "ging-kô-u",
              "vi": "ngân hàng",
              "viLabel": "ngân hàng",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-konbini",
              "next": null,
              "jp": "コンビニ",
              "kana": "コンビニ",
              "roma": "konbini",
              "viPron": "kôm-bi-ni",
              "vi": "cửa hàng tiện lợi",
              "viLabel": "cửa hàng tiện lợi",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-basutei",
              "next": null,
              "jp": "バス停",
              "kana": "バスてい",
              "roma": "basutei",
              "viPron": "ba-xư-tê-i",
              "vi": "trạm xe buýt",
              "viLabel": "trạm xe buýt",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-byouin",
              "next": null,
              "jp": "病院",
              "kana": "びょういん",
              "roma": "byouin",
              "viPron": "biô-u-in",
              "vi": "bệnh viện",
              "viLabel": "bệnh viện",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            }
          ]
        }
      },
      "template": [
        {
          "slot": "place",
          "particle": {
            "jp": "は",
            "kana": "は",
            "roma": "wa",
            "viPron": "oa",
            "vi": "～ thì / còn ～",
            "note": "trợ từ chủ đề, đọc là 'oa'",
            "grammar": "particle-wa",
            "role": "particle",
            "isParticle": true
          }
        },
        {
          "text": "どこですか",
          "kana": "どこですか",
          "roma": "dokodesuka",
          "viPron": "đô-kô-đê-xư-ka",
          "vi": "ở đâu?",
          "role": "expression"
        }
      ],
      "viTemplate": "{place} ở đâu?",
      "grammar": [
        "question-ka",
        "particle-wa",
        "kosoado"
      ],
      "tip": "Công thức vạn năng: [địa điểm] + はどこですか."
    },
    {
      "id": "i-greet",
      "emoji": "👋",
      "label": "Chào hỏi & xã giao",
      "desc": "Chào theo buổi, chia tay, gặp lần đầu, hỏi thăm",
      "group": "Giao tiếp",
      "start": "s-situation",
      "steps": {
        "s-situation": {
          "prompt": "Tình huống nào?",
          "options": [
            {
              "silent": true,
              "label": "Chào theo buổi",
              "vi": "(chào)",
              "next": "s-hello",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Chào theo buổi"
            },
            {
              "silent": true,
              "label": "Chia tay",
              "vi": "(tạm biệt)",
              "next": "s-bye",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Chia tay"
            },
            {
              "silent": true,
              "label": "Gặp lần đầu",
              "vi": "(giới thiệu)",
              "next": "s-intro",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Gặp lần đầu"
            },
            {
              "silent": true,
              "label": "Khi rời nhà / trở về",
              "vi": "(đi và về)",
              "next": "s-depart",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Khi rời nhà / trở về"
            },
            {
              "jp": "お元気ですか",
              "kana": "おげんきですか",
              "vi": "Bạn khỏe không?",
              "next": "s-genki",
              "roma": "ogenkidesuka",
              "viPron": "ô-gêng-ki-đê-xư-ka",
              "viLabel": "Bạn khỏe không?"
            },
            {
              "jp": "お久しぶりです",
              "kana": "おひさしぶりです",
              "vi": "Lâu rồi không gặp",
              "next": null,
              "roma": "ohisashiburidesu",
              "viPron": "ô-hi-xa-xi-bư-ri-đê-xư",
              "viLabel": "Lâu rồi không gặp"
            }
          ]
        },
        "s-hello": {
          "prompt": "Chào vào lúc nào?",
          "options": [
            {
              "jp": "おはようございます",
              "kana": "おはようございます",
              "vi": "Chào buổi sáng",
              "note": "Trước ~10 giờ sáng",
              "next": null,
              "roma": "ohayougozaimasu",
              "viPron": "ô-ha-yô-u-gô-za-i-ma-xư",
              "viLabel": "Chào buổi sáng"
            },
            {
              "jp": "こんにちは",
              "kana": "こんにちは",
              "vi": "Xin chào (ban ngày)",
              "roma": "konnichiha",
              "viPron": "kôn-ni-chi-ha",
              "next": null,
              "viLabel": "Xin chào (ban ngày)"
            },
            {
              "jp": "こんばんは",
              "kana": "こんばんは",
              "vi": "Chào buổi tối",
              "roma": "konbanha",
              "viPron": "kôm-ban-ha",
              "next": null,
              "viLabel": "Chào buổi tối"
            }
          ]
        },
        "s-bye": {
          "prompt": "Chia tay thế nào?",
          "options": [
            {
              "jp": "さようなら",
              "kana": "さようなら",
              "vi": "Tạm biệt (lâu gặp lại)",
              "next": null,
              "roma": "sayounara",
              "viPron": "xa-yô-u-na-ra",
              "viLabel": "Tạm biệt (lâu gặp lại)"
            },
            {
              "jp": "じゃあ、また",
              "kana": "じゃあ、また",
              "vi": "Hẹn gặp lại nhé",
              "next": null,
              "roma": "jaamata",
              "viPron": "ja-a-ma-ta",
              "viLabel": "Hẹn gặp lại nhé"
            },
            {
              "jp": "おやすみなさい",
              "kana": "おやすみなさい",
              "vi": "Chúc ngủ ngon",
              "next": null,
              "roma": "oyasuminasai",
              "viPron": "ô-ya-xư-mi-na-xa-i",
              "viLabel": "Chúc ngủ ngon"
            }
          ]
        },
        "s-intro": {
          "prompt": "Giới thiệu thế nào?",
          "options": [
            {
              "jp": "はじめまして。",
              "kana": "はじめまして。",
              "vi": "Rất vui được gặp bạn",
              "next": "s-intro2",
              "roma": "hajimemashite",
              "viPron": "ha-ji-mê-ma-xi-tê",
              "viLabel": "Rất vui được gặp bạn"
            },
            {
              "jp": "よろしくお願いします",
              "kana": "よろしくおねがいします",
              "vi": "Mong được giúp đỡ",
              "note": "Câu chốt sau khi giới thiệu tên",
              "next": null,
              "roma": "yoroshikuonegaishimasu",
              "viPron": "yô-rô-xi-cư-ô-nê-ga-i-xi-ma-xư",
              "viLabel": "Mong được giúp đỡ"
            }
          ]
        },
        "s-intro2": {
          "prompt": "Nói tiếp nhé?",
          "options": [
            {
              "jp": "よろしくお願いします",
              "kana": "よろしくおねがいします",
              "vi": "Mong được giúp đỡ",
              "next": null,
              "roma": "yoroshikuonegaishimasu",
              "viPron": "yô-rô-xi-cư-ô-nê-ga-i-xi-ma-xư",
              "viLabel": "Mong được giúp đỡ"
            },
            {
              "silent": true,
              "label": "Chỉ cần vậy thôi",
              "vi": "…",
              "next": null,
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Chỉ cần vậy thôi"
            }
          ]
        },
        "s-genki": {
          "prompt": "Trả lời thế nào?",
          "options": [
            {
              "jp": "はい、元気です",
              "kana": "はい、げんきです",
              "vi": "Vâng, tôi khỏe",
              "next": null,
              "roma": "haigenkidesu",
              "viPron": "ha-i-gêng-ki-đê-xư",
              "viLabel": "Vâng, tôi khỏe"
            },
            {
              "jp": "まあまあです",
              "kana": "まあまあです",
              "vi": "Cũng tạm ổn",
              "next": null,
              "roma": "maamaadesu",
              "viPron": "ma-a-ma-a-đê-xư",
              "viLabel": "Cũng tạm ổn"
            }
          ]
        },
        "s-depart": {
          "prompt": "Bạn đang…?",
          "options": [
            {
              "jp": "いってきます",
              "kana": "いってきます",
              "vi": "Tôi đi nhé",
              "note": "Nói khi rời nhà/khách sạn",
              "next": null,
              "roma": "ittekimasu",
              "viPron": "it-tê-ki-ma-xư",
              "viLabel": "Tôi đi nhé"
            },
            {
              "jp": "ただいま",
              "kana": "ただいま",
              "vi": "Tôi về rồi đây",
              "note": "Nói khi trở về",
              "next": null,
              "roma": "tadaima",
              "viPron": "ta-đa-i-ma",
              "viLabel": "Tôi về rồi đây"
            }
          ]
        }
      },
      "viTemplate": null,
      "grammar": [
        "desu"
      ],
      "tip": "Thứ tự chuẩn khi gặp lần đầu: はじめまして → (tên) → よろしくお願いします."
    },
    {
      "id": "i-courtesy",
      "emoji": "🙏",
      "label": "Cảm ơn & xin lỗi",
      "desc": "Cảm ơn, xin lỗi, phép lịch sự, trước–sau bữa ăn",
      "group": "Giao tiếp",
      "start": "s-kind",
      "steps": {
        "s-kind": {
          "prompt": "Bạn muốn nói gì?",
          "options": [
            {
              "silent": true,
              "label": "Cảm ơn",
              "vi": "(cảm ơn)",
              "next": "s-thanks",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Cảm ơn"
            },
            {
              "silent": true,
              "label": "Xin lỗi",
              "vi": "(xin lỗi)",
              "next": "s-sorry",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Xin lỗi"
            },
            {
              "silent": true,
              "label": "Phép lịch sự",
              "vi": "(lịch sự)",
              "next": "s-polite",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Phép lịch sự"
            },
            {
              "silent": true,
              "label": "Trước & sau bữa ăn",
              "vi": "(bữa ăn)",
              "next": "s-meal",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Trước & sau bữa ăn"
            }
          ]
        },
        "s-thanks": {
          "prompt": "Cảm ơn kiểu nào?",
          "options": [
            {
              "jp": "ありがとうございます",
              "kana": "ありがとうございます",
              "vi": "Cảm ơn (lịch sự)",
              "next": null,
              "roma": "arigatougozaimasu",
              "viPron": "a-ri-ga-tô-u-gô-za-i-ma-xư",
              "viLabel": "Cảm ơn (lịch sự)"
            },
            {
              "jp": "ありがとう",
              "kana": "ありがとう",
              "vi": "Cảm ơn (thân mật)",
              "next": null,
              "roma": "arigatou",
              "viPron": "a-ri-ga-tô-u",
              "viLabel": "Cảm ơn (thân mật)"
            },
            {
              "jp": "どうも",
              "kana": "どうも",
              "vi": "Cảm ơn (nhanh)",
              "next": null,
              "roma": "doumo",
              "viPron": "đô-u-mô",
              "viLabel": "Cảm ơn (nhanh)"
            },
            {
              "jp": "ありがとうございました",
              "kana": "ありがとうございました",
              "vi": "Cảm ơn vì mọi chuyện",
              "note": "Khi công việc đã xong",
              "next": null,
              "roma": "arigatougozaimashita",
              "viPron": "a-ri-ga-tô-u-gô-za-i-ma-xi-ta",
              "viLabel": "Cảm ơn vì mọi chuyện"
            },
            {
              "silent": true,
              "label": "Cảm ơn vì đã…",
              "vi": "(cảm ơn vì đã)",
              "templateOverride": [
                {
                  "slot": "action",
                  "particle": null
                },
                {
                  "text": "くれて",
                  "kana": "くれて",
                  "roma": "kurete",
                  "viPron": "cư-rê-tê",
                  "vi": "đã… cho tôi",
                  "role": "expression"
                },
                {
                  "text": "ありがとうございます",
                  "kana": "ありがとうございます",
                  "roma": "arigatougozaimasu",
                  "viPron": "a-ri-ga-tô-u-gô-za-i-ma-xư",
                  "vi": "cảm ơn",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "Cảm ơn vì đã {action}",
              "next": "s-thanks-do",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Cảm ơn vì đã…"
            }
          ]
        },
        "s-thanks-do": {
          "prompt": "Cảm ơn vì đã làm gì?",
          "slot": "action",
          "options": [
            {
              "ref": "v-oshieru",
              "form": "te",
              "vi": "chỉ đường cho tôi",
              "next": null,
              "jp": "教えて",
              "kana": "おしえて",
              "roma": "oshiete",
              "viPron": "ô-xi-ê-tê",
              "viLabel": "chỉ đường cho tôi",
              "posVi": "động từ",
              "formNote": "thể て",
              "grammarHint": "te-kudasai",
              "role": "verb"
            },
            {
              "ref": "v-miseru",
              "form": "te",
              "vi": "cho tôi xem",
              "next": null,
              "jp": "見せて",
              "kana": "みせて",
              "roma": "misete",
              "viPron": "mi-xê-tê",
              "viLabel": "cho tôi xem",
              "posVi": "động từ",
              "formNote": "thể て",
              "grammarHint": "te-kudasai",
              "role": "verb"
            },
            {
              "ref": "v-toru",
              "form": "te",
              "vi": "chụp ảnh cho tôi",
              "next": null,
              "jp": "撮って",
              "kana": "とって",
              "roma": "totte",
              "viPron": "tôt-tê",
              "viLabel": "chụp ảnh cho tôi",
              "posVi": "động từ",
              "formNote": "thể て",
              "grammarHint": "te-kudasai",
              "role": "verb"
            },
            {
              "ref": "v-yobu",
              "form": "te",
              "vi": "gọi giúp tôi",
              "next": null,
              "jp": "呼んで",
              "kana": "よんで",
              "roma": "yonde",
              "viPron": "yôn-đê",
              "viLabel": "gọi giúp tôi",
              "posVi": "động từ",
              "formNote": "thể て",
              "grammarHint": "te-kudasai",
              "role": "verb"
            },
            {
              "ref": "v-matsu",
              "form": "te",
              "vi": "đợi tôi",
              "next": null,
              "jp": "待って",
              "kana": "まって",
              "roma": "matte",
              "viPron": "mat-tê",
              "viLabel": "đợi tôi",
              "posVi": "động từ",
              "formNote": "thể て",
              "grammarHint": "te-kudasai",
              "role": "verb"
            },
            {
              "ref": "v-tasukeru",
              "form": "te",
              "vi": "giúp tôi",
              "next": null,
              "jp": "助けて",
              "kana": "たすけて",
              "roma": "tasukete",
              "viPron": "ta-xư-kê-tê",
              "viLabel": "giúp tôi",
              "posVi": "động từ",
              "formNote": "thể て",
              "grammarHint": "te-kudasai",
              "role": "verb"
            }
          ]
        },
        "s-sorry": {
          "prompt": "Xin lỗi kiểu nào?",
          "options": [
            {
              "jp": "すみません",
              "kana": "すみません",
              "vi": "Xin lỗi / cho hỏi",
              "note": "Đa dụng nhất",
              "next": null,
              "roma": "sumimasen",
              "viPron": "xư-mi-ma-xên",
              "viLabel": "Xin lỗi / cho hỏi"
            },
            {
              "jp": "ごめんなさい",
              "kana": "ごめんなさい",
              "vi": "Xin lỗi (khi mắc lỗi)",
              "next": null,
              "roma": "gomennasai",
              "viPron": "gô-mên-na-xa-i",
              "viLabel": "Xin lỗi (khi mắc lỗi)"
            },
            {
              "jp": "遅れてすみません",
              "kana": "おくれてすみません",
              "vi": "Xin lỗi vì đến muộn",
              "next": null,
              "roma": "okuretesumimasen",
              "viPron": "ô-cư-rê-tê-xư-mi-ma-xên",
              "viLabel": "Xin lỗi vì đến muộn"
            },
            {
              "jp": "ご迷惑をおかけしました",
              "kana": "ごめいわくをおかけしました",
              "vi": "Xin lỗi vì đã làm phiền",
              "note": "Trang trọng",
              "next": null,
              "roma": "gomeiwakuookakeshimashita",
              "viPron": "gô-mê-i-oa-cư-ô-ô-ka-kê-xi-ma-xi-ta",
              "viLabel": "Xin lỗi vì đã làm phiền"
            }
          ]
        },
        "s-polite": {
          "prompt": "Câu lịch sự nào?",
          "options": [
            {
              "jp": "お願いします",
              "kana": "おねがいします",
              "vi": "Nhờ anh/chị ạ",
              "next": null,
              "roma": "onegaishimasu",
              "viPron": "ô-nê-ga-i-xi-ma-xư",
              "viLabel": "Nhờ anh/chị ạ"
            },
            {
              "jp": "どうぞ",
              "kana": "どうぞ",
              "vi": "Xin mời",
              "next": null,
              "roma": "douzo",
              "viPron": "đô-u-zô",
              "viLabel": "Xin mời"
            },
            {
              "jp": "失礼します",
              "kana": "しつれいします",
              "vi": "Xin phép",
              "next": null,
              "roma": "shitsureishimasu",
              "viPron": "xi-tsư-rê-i-xi-ma-xư",
              "viLabel": "Xin phép"
            },
            {
              "jp": "お邪魔します",
              "kana": "おじゃまします",
              "vi": "Xin phép làm phiền",
              "note": "Khi vào nhà/phòng riêng",
              "next": null,
              "roma": "ojamashimasu",
              "viPron": "ô-ja-ma-xi-ma-xư",
              "viLabel": "Xin phép làm phiền"
            },
            {
              "jp": "お先に失礼します",
              "kana": "おさきにしつれいします",
              "vi": "Tôi xin phép về trước",
              "next": null,
              "roma": "osakinishitsureishimasu",
              "viPron": "ô-xa-ki-ni-xi-tsư-rê-i-xi-ma-xư",
              "viLabel": "Tôi xin phép về trước"
            }
          ]
        },
        "s-meal": {
          "prompt": "Câu cho bữa ăn?",
          "options": [
            {
              "jp": "いただきます",
              "kana": "いただきます",
              "vi": "Con xin phép dùng bữa",
              "note": "Nói trước khi ăn",
              "next": null,
              "roma": "itadakimasu",
              "viPron": "i-ta-đa-ki-ma-xư",
              "viLabel": "Con xin phép dùng bữa"
            },
            {
              "jp": "ごちそうさまでした",
              "kana": "ごちそうさまでした",
              "vi": "Cảm ơn vì bữa ăn",
              "note": "Nói sau khi ăn xong",
              "next": null,
              "roma": "gochisousamadeshita",
              "viPron": "gô-chi-xô-u-xa-ma-đê-xi-ta",
              "viLabel": "Cảm ơn vì bữa ăn"
            },
            {
              "jp": "美味しいです",
              "kana": "おいしいです",
              "vi": "Ngon quá!",
              "next": null,
              "roma": "oishiidesu",
              "viPron": "ô-i-xi-i-đê-xư",
              "viLabel": "Ngon quá!"
            }
          ]
        }
      },
      "viTemplate": null,
      "grammar": [
        "te-kudasai",
        "kudasai-onegai"
      ],
      "tip": "Mẫu 〜てくれてありがとう: động từ thể て + くれて + ありがとうございます — cảm ơn vì ai đó đã làm gì cho mình."
    },
    {
      "id": "i-hotel",
      "emoji": "🏨",
      "label": "Khách sạn",
      "desc": "Nhận phòng, tiện nghi, nhờ lễ tân, sự cố trong phòng",
      "group": "Đi lại & khách sạn",
      "start": "s-kind",
      "steps": {
        "s-kind": {
          "prompt": "Cần gì ở khách sạn?",
          "options": [
            {
              "silent": true,
              "label": "Nhận phòng / trả phòng",
              "vi": "(thủ tục)",
              "next": "s-check",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Nhận phòng / trả phòng"
            },
            {
              "silent": true,
              "label": "Hỏi tiện nghi",
              "vi": "(tiện nghi)",
              "next": "s-room",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Hỏi tiện nghi"
            },
            {
              "silent": true,
              "label": "Nhờ giúp",
              "vi": "(nhờ giúp)",
              "next": "s-help",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Nhờ giúp"
            },
            {
              "silent": true,
              "label": "Sự cố trong phòng",
              "vi": "(sự cố)",
              "templateOverride": [
                {
                  "slot": "equip",
                  "particle": {
                    "jp": "が",
                    "kana": "が",
                    "roma": "ga",
                    "viPron": "ga",
                    "vi": "～ (chủ ngữ / thứ được thích, muốn)",
                    "note": "trợ từ chủ ngữ",
                    "grammar": "particle-ga",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "動きません",
                  "kana": "うごきません",
                  "roma": "ugokimasen",
                  "viPron": "ư-gô-ki-ma-xên",
                  "vi": "không hoạt động",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "Trong phòng: {equip} không hoạt động",
              "next": "s-equip",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Sự cố trong phòng"
            }
          ]
        },
        "s-check": {
          "prompt": "Thủ tục gì?",
          "options": [
            {
              "jp": "チェックインをお願いします",
              "kana": "チェックインをおねがいします",
              "vi": "Tôi muốn làm thủ tục nhận phòng",
              "next": null,
              "roma": "chekkuinoonegaishimasu",
              "viPron": "chêk-cư-in-ô-ô-nê-ga-i-xi-ma-xư",
              "viLabel": "Tôi muốn làm thủ tục nhận phòng"
            },
            {
              "jp": "チェックアウトをお願いします",
              "kana": "チェックアウトをおねがいします",
              "vi": "Cho tôi làm thủ tục trả phòng",
              "next": null,
              "roma": "chekkuautooonegaishimasu",
              "viPron": "chêk-cư-a-u-tô-ô-ô-nê-ga-i-xi-ma-xư",
              "viLabel": "Cho tôi làm thủ tục trả phòng"
            },
            {
              "jp": "予約しています",
              "kana": "よやくしています",
              "vi": "Tôi có đặt phòng trước",
              "next": null,
              "roma": "yoyakushiteimasu",
              "viPron": "yô-ya-cư-xi-tê-i-ma-xư",
              "viLabel": "Tôi có đặt phòng trước"
            }
          ]
        },
        "s-room": {
          "prompt": "Hỏi gì về tiện nghi?",
          "options": [
            {
              "jp": "Wi-Fiのパスワードは何ですか",
              "kana": "ワイファイのパスワードはなんですか",
              "vi": "Mật khẩu Wi-Fi là gì?",
              "roma": "waifainopasuwaadohanandesuka",
              "viPron": "oa-i-pha-i-nô-pa-xư-oaa-đô-ha-nan-đê-xư-ka",
              "next": null,
              "viLabel": "Mật khẩu Wi-Fi là gì?"
            },
            {
              "jp": "チェックアウトは何時ですか",
              "kana": "チェックアウトはなんじですか",
              "vi": "Trả phòng lúc mấy giờ?",
              "roma": "chekkuautohananjidesuka",
              "viPron": "chêk-cư-a-u-tô-ha-nan-ji-đê-xư-ka",
              "next": null,
              "viLabel": "Trả phòng lúc mấy giờ?"
            },
            {
              "jp": "朝食は何時からですか",
              "kana": "ちょうしょくはなんじからですか",
              "vi": "Bữa sáng từ mấy giờ?",
              "roma": "choushokuhananjikaradesuka",
              "viPron": "chô-u-xô-cư-ha-nan-ji-ka-ra-đê-xư-ka",
              "next": null,
              "viLabel": "Bữa sáng từ mấy giờ?"
            }
          ]
        },
        "s-help": {
          "prompt": "Nhờ lễ tân điều gì?",
          "options": [
            {
              "jp": "荷物を預かってもらえますか",
              "kana": "にもつをあずかってもらえますか",
              "vi": "Gửi hành lý giúp tôi được không?",
              "next": null,
              "roma": "nimotsuoazukattemoraemasuka",
              "viPron": "ni-mô-tsư-ô-a-zư-kat-tê-mô-ra-ê-ma-xư-ka",
              "viLabel": "Gửi hành lý giúp tôi được không?"
            },
            {
              "jp": "部屋を見せてもらえますか",
              "kana": "へやをみせてもらえますか",
              "vi": "Cho tôi xem phòng được không?",
              "next": null,
              "roma": "heyaomisetemoraemasuka",
              "viPron": "hê-ya-ô-mi-xê-tê-mô-ra-ê-ma-xư-ka",
              "viLabel": "Cho tôi xem phòng được không?"
            },
            {
              "jp": "タオルをもう一枚ください",
              "kana": "タオルをもういちまいください",
              "vi": "Cho tôi thêm một cái khăn",
              "next": null,
              "roma": "taoruomouichimaikudasai",
              "viPron": "ta-ô-rư-ô-mô-u-i-chi-ma-i-cư-đa-xa-i",
              "viLabel": "Cho tôi thêm một cái khăn"
            },
            {
              "jp": "静かな部屋に変えてもらえますか",
              "kana": "しずかなへやにかえてもらえますか",
              "vi": "Đổi cho tôi phòng yên tĩnh được không?",
              "next": null,
              "roma": "shizukanaheyanikaetemoraemasuka",
              "viPron": "xi-zư-ka-na-hê-ya-ni-ka-ê-tê-mô-ra-ê-ma-xư-ka",
              "viLabel": "Đổi cho tôi phòng yên tĩnh được không?"
            },
            {
              "jp": "荷物をここに置いてもいいですか",
              "kana": "にもつをここにおいてもいいですか",
              "vi": "Tôi để hành lý ở đây được không?",
              "next": null,
              "roma": "nimotsuokokonioitemoiidesuka",
              "viPron": "ni-mô-tsư-ô-kô-kô-ni-ô-i-tê-mô-i-i-đê-xư-ka",
              "viLabel": "Tôi để hành lý ở đây được không?"
            }
          ]
        },
        "s-equip": {
          "prompt": "Thứ gì không hoạt động?",
          "slot": "equip",
          "options": [
            {
              "ref": "n-eakon",
              "next": null,
              "jp": "エアコン",
              "kana": "エアコン",
              "roma": "eakon",
              "viPron": "ê-a-kôn",
              "vi": "điều hòa",
              "viLabel": "điều hòa",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-denki",
              "next": null,
              "jp": "電気",
              "kana": "でんき",
              "roma": "denki",
              "viPron": "đêng-ki",
              "vi": "đèn / điện",
              "viLabel": "đèn / điện",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-oyu",
              "next": null,
              "jp": "お湯",
              "kana": "おゆ",
              "roma": "oyu",
              "viPron": "ô-yu",
              "vi": "nước nóng",
              "viLabel": "nước nóng",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            }
          ]
        }
      },
      "viTemplate": null,
      "grammar": [
        "particle-ga",
        "masu-form",
        "te-mo-ii"
      ],
      "tip": "Nhận phòng thường cần hộ chiếu. 荷物を預かってもらえますか dùng được cả trước khi nhận phòng lẫn sau khi trả phòng."
    },
    {
      "id": "i-health",
      "emoji": "🚑",
      "label": "Sức khỏe & sự cố",
      "desc": "Đau ốm, mua thuốc, mất đồ, gọi giúp khẩn cấp",
      "group": "Sức khỏe & sự cố",
      "start": "s-kind",
      "steps": {
        "s-kind": {
          "prompt": "Chuyện gì vậy?",
          "options": [
            {
              "silent": true,
              "label": "Tôi bị đau…",
              "vi": "(đau ở đâu)",
              "templateOverride": [
                {
                  "slot": "where",
                  "particle": {
                    "jp": "が",
                    "kana": "が",
                    "roma": "ga",
                    "viPron": "ga",
                    "vi": "～ (chủ ngữ / thứ được thích, muốn)",
                    "note": "trợ từ chủ ngữ",
                    "grammar": "particle-ga",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "痛いです",
                  "kana": "いたいです",
                  "roma": "itaidesu",
                  "viPron": "i-ta-i-đê-xư",
                  "vi": "đau",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "Tôi bị đau {where}",
              "next": "s-pain",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Tôi bị đau…"
            },
            {
              "silent": true,
              "label": "Triệu chứng khác",
              "vi": "(triệu chứng)",
              "next": "s-symptom",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Triệu chứng khác"
            },
            {
              "silent": true,
              "label": "Mua thuốc",
              "vi": "(mua thuốc)",
              "next": "s-medicine",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Mua thuốc"
            },
            {
              "silent": true,
              "label": "Tôi bị mất…",
              "vi": "(mất đồ)",
              "templateOverride": [
                {
                  "slot": "item",
                  "particle": {
                    "jp": "を",
                    "kana": "を",
                    "roma": "o",
                    "viPron": "ô",
                    "vi": "～ (đối tượng của hành động)",
                    "note": "trợ từ tân ngữ, đọc là 'ô'",
                    "grammar": "particle-wo",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "なくしました",
                  "kana": "なくしました",
                  "roma": "nakushimashita",
                  "viPron": "na-cư-xi-ma-xi-ta",
                  "vi": "đã làm mất",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "Tôi bị mất {item}",
              "next": "s-items",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Tôi bị mất…"
            },
            {
              "silent": true,
              "label": "Tôi bị trộm…",
              "vi": "(bị trộm)",
              "templateOverride": [
                {
                  "slot": "item",
                  "particle": {
                    "jp": "を",
                    "kana": "を",
                    "roma": "o",
                    "viPron": "ô",
                    "vi": "～ (đối tượng của hành động)",
                    "note": "trợ từ tân ngữ, đọc là 'ô'",
                    "grammar": "particle-wo",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "盗まれました",
                  "kana": "ぬすまれました",
                  "roma": "nusumaremashita",
                  "viPron": "nư-xư-ma-rê-ma-xi-ta",
                  "vi": "bị lấy cắp",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "Tôi bị mất trộm {item}",
              "next": "s-items",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Tôi bị trộm…"
            },
            {
              "silent": true,
              "label": "Gọi giúp khẩn cấp",
              "vi": "(gọi giúp)",
              "templateOverride": [
                {
                  "slot": "item",
                  "particle": {
                    "jp": "を",
                    "kana": "を",
                    "roma": "o",
                    "viPron": "ô",
                    "vi": "～ (đối tượng của hành động)",
                    "note": "trợ từ tân ngữ, đọc là 'ô'",
                    "grammar": "particle-wo",
                    "role": "particle",
                    "isParticle": true
                  }
                },
                {
                  "text": "呼んでください",
                  "kana": "よんでください",
                  "roma": "yondekudasai",
                  "viPron": "yôn-đê-cư-đa-xa-i",
                  "vi": "gọi giúp tôi",
                  "role": "expression"
                }
              ],
              "viTemplateOverride": "Gọi {item} giúp tôi",
              "next": "s-call-what",
              "jp": "",
              "kana": "",
              "roma": "",
              "viPron": "",
              "viLabel": "Gọi giúp khẩn cấp"
            }
          ]
        },
        "s-pain": {
          "prompt": "Đau ở đâu?",
          "slot": "where",
          "options": [
            {
              "ref": "n-atama",
              "next": null,
              "jp": "頭",
              "kana": "あたま",
              "roma": "atama",
              "viPron": "a-ta-ma",
              "vi": "đầu",
              "viLabel": "đầu",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-onaka",
              "next": null,
              "jp": "お腹",
              "kana": "おなか",
              "roma": "onaka",
              "viPron": "ô-na-ka",
              "vi": "bụng",
              "viLabel": "bụng",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-nodo",
              "next": null,
              "jp": "のど",
              "kana": "のど",
              "roma": "nodo",
              "viPron": "nô-đô",
              "vi": "cổ họng",
              "viLabel": "cổ họng",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-ha",
              "next": null,
              "jp": "歯",
              "kana": "は",
              "roma": "ha",
              "viPron": "ha",
              "vi": "răng",
              "viLabel": "răng",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-ashi",
              "next": null,
              "jp": "足",
              "kana": "あし",
              "roma": "ashi",
              "viPron": "a-xi",
              "vi": "chân",
              "viLabel": "chân",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            }
          ]
        },
        "s-symptom": {
          "prompt": "Triệu chứng nào?",
          "options": [
            {
              "jp": "熱があります",
              "kana": "ねつがあります",
              "vi": "Tôi bị sốt",
              "next": null,
              "roma": "netsugaarimasu",
              "viPron": "nê-tsư-ga-a-ri-ma-xư",
              "viLabel": "Tôi bị sốt"
            },
            {
              "jp": "めまいがします",
              "kana": "めまいがします",
              "vi": "Tôi thấy chóng mặt",
              "next": null,
              "roma": "memaigashimasu",
              "viPron": "mê-ma-i-ga-xi-ma-xư",
              "viLabel": "Tôi thấy chóng mặt"
            },
            {
              "jp": "気分が悪いです",
              "kana": "きぶんがわるいです",
              "vi": "Tôi thấy không khỏe",
              "next": null,
              "roma": "kibungawaruidesu",
              "viPron": "ki-bưng-ga-oa-rư-i-đê-xư",
              "viLabel": "Tôi thấy không khỏe"
            }
          ]
        },
        "s-medicine": {
          "prompt": "Cần thuốc gì?",
          "options": [
            {
              "jp": "風邪薬はありますか",
              "kana": "かぜぐすりはありますか",
              "vi": "Có thuốc cảm không?",
              "roma": "kazegusurihaarimasuka",
              "viPron": "ka-zê-gư-xư-ri-ha-a-ri-ma-xư-ka",
              "next": null,
              "viLabel": "Có thuốc cảm không?"
            },
            {
              "jp": "頭痛薬をください",
              "kana": "ずつうやくをください",
              "vi": "Cho tôi thuốc đau đầu",
              "next": null,
              "roma": "zutsuuyakuokudasai",
              "viPron": "zư-tsư-u-ya-cư-ô-cư-đa-xa-i",
              "viLabel": "Cho tôi thuốc đau đầu"
            },
            {
              "jp": "痛み止めはありますか",
              "kana": "いたみどめはありますか",
              "vi": "Có thuốc giảm đau không?",
              "roma": "itamidomehaarimasuka",
              "viPron": "i-ta-mi-đô-mê-ha-a-ri-ma-xư-ka",
              "next": null,
              "viLabel": "Có thuốc giảm đau không?"
            },
            {
              "jp": "絆創膏をください",
              "kana": "ばんそうこうをください",
              "vi": "Cho tôi băng cá nhân",
              "next": null,
              "roma": "bansoukouokudasai",
              "viPron": "ban-xô-u-kô-u-ô-cư-đa-xa-i",
              "viLabel": "Cho tôi băng cá nhân"
            },
            {
              "jp": "薬アレルギーがあります",
              "kana": "くすりアレルギーがあります",
              "vi": "Tôi bị dị ứng thuốc",
              "next": null,
              "roma": "kusuriarerugiigaarimasu",
              "viPron": "cư-xư-ri-a-rê-rư-gii-ga-a-ri-ma-xư",
              "viLabel": "Tôi bị dị ứng thuốc"
            },
            {
              "jp": "この薬はどうやって飲みますか",
              "kana": "このくすりはどうやってのみますか",
              "vi": "Thuốc này uống thế nào?",
              "roma": "konokusurihadouyattenomimasuka",
              "viPron": "kô-nô-cư-xư-ri-ha-đô-u-yat-tê-nô-mi-ma-xư-ka",
              "next": null,
              "viLabel": "Thuốc này uống thế nào?"
            },
            {
              "jp": "処方箋なしで買えますか",
              "kana": "しょほうせんなしでかえますか",
              "vi": "Mua không cần đơn thuốc được không?",
              "next": null,
              "roma": "shohousennashidekaemasuka",
              "viPron": "xô-hô-u-xên-na-xi-đê-ka-ê-ma-xư-ka",
              "viLabel": "Mua không cần đơn thuốc được không?"
            }
          ]
        },
        "s-items": {
          "prompt": "Mất gì?",
          "slot": "item",
          "options": [
            {
              "ref": "n-saifu",
              "next": null,
              "jp": "財布",
              "kana": "さいふ",
              "roma": "saifu",
              "viPron": "xa-i-phư",
              "vi": "ví",
              "viLabel": "ví",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-sumaho",
              "next": null,
              "jp": "スマホ",
              "kana": "スマホ",
              "roma": "sumaho",
              "viPron": "xư-ma-hô",
              "vi": "điện thoại thông minh",
              "viLabel": "điện thoại thông minh",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-pasupooto",
              "next": null,
              "jp": "パスポート",
              "kana": "パスポート",
              "roma": "pasupooto",
              "viPron": "pa-xư-pôô-tô",
              "vi": "hộ chiếu",
              "viLabel": "hộ chiếu",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-kaban",
              "next": null,
              "jp": "かばん",
              "kana": "かばん",
              "roma": "kaban",
              "viPron": "ka-ban",
              "vi": "túi xách",
              "viLabel": "túi xách",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            }
          ]
        },
        "s-call-what": {
          "prompt": "Gọi ai / cái gì?",
          "slot": "item",
          "options": [
            {
              "ref": "n-keisatsu",
              "next": null,
              "jp": "警察",
              "kana": "けいさつ",
              "roma": "keisatsu",
              "viPron": "kê-i-xa-tsư",
              "vi": "cảnh sát",
              "viLabel": "cảnh sát",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-kyuukyuusha",
              "next": null,
              "jp": "救急車",
              "kana": "きゅうきゅうしゃ",
              "roma": "kyuukyuusha",
              "viPron": "kiu-u-kiu-u-xa",
              "vi": "xe cứu thương",
              "viLabel": "xe cứu thương",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-isha",
              "next": null,
              "jp": "医者",
              "kana": "いしゃ",
              "roma": "isha",
              "viPron": "i-xa",
              "vi": "bác sĩ",
              "viLabel": "bác sĩ",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            },
            {
              "ref": "n-takushii",
              "next": null,
              "jp": "タクシー",
              "kana": "タクシー",
              "roma": "takushii",
              "viPron": "ta-cư-xii",
              "vi": "taxi",
              "viLabel": "taxi",
              "posVi": "danh từ",
              "grammarHint": null,
              "role": "noun"
            }
          ]
        }
      },
      "viTemplate": null,
      "grammar": [
        "particle-ga",
        "particle-wo",
        "te-kudasai",
        "potential"
      ],
      "tip": "Khẩn cấp: 119 (cứu thương), 110 (cảnh sát). Nếu nguy hiểm, nói to 助けて！"
    }
  ]
};
