import { normalizeSyllables } from "./phonology.js";

const ONSET_KATAKANA = {
  "ㄱ":["カ","ガ"],"ㄲ":["ッカ","ッガ"],"ㄴ":["ナ","ナ"],"ㄷ":["タ","ダ"],"ㄸ":["ッタ","ッダ"],
  "ㄹ":["ラ","ラ"],"ㅁ":["マ","マ"],"ㅂ":["パ","バ"],"ㅃ":["ッパ","ッバ"],"ㅅ":["サ","サ"],
  "ㅆ":["ッサ","ッサ"],"ㅇ":["",""],"ㅈ":["チャ","ジャ"],"ㅉ":["ッチャ","ッジャ"],
  "ㅊ":["チャ","チャ"],"ㅋ":["カ","カ"],"ㅌ":["タ","タ"],"ㅍ":["パ","パ"],"ㅎ":["ハ","ハ"]
};
const VOWEL_KATAKANA = {
  "ㅏ":"ア","ㅐ":"エ","ㅑ":"ヤ","ㅒ":"イェ","ㅓ":"オ","ㅔ":"エ","ㅕ":"ヨ","ㅖ":"イェ",
  "ㅗ":"オ","ㅘ":"ワ","ㅙ":"ウェ","ㅚ":"ウェ","ㅛ":"ヨ","ㅜ":"ウ","ㅝ":"ウォ","ㅞ":"ウェ",
  "ㅟ":"ウィ","ㅠ":"ユ","ㅡ":"ウ","ㅢ":"ウィ","ㅣ":"イ"
};
const CODA_SMALL = {"ㄱ":"ㇰ","ㄴ":"ン","ㄷ":"ッ","ㄹ":"ㇽ","ㅁ":"ㇺ","ㅂ":"ㇷ゚","ㅇ":"ン"};
const CODA_FULL = {"ㄱ":"ク","ㄴ":"ン","ㄷ":"ッ","ㄹ":"ル","ㅁ":"ム","ㅂ":"プ","ㅇ":"ン"};
const VOICING_CODAS = new Set(["","ㄴ","ㄹ","ㅁ","ㅇ"]);

function renderOnset(unit, previous) {
  const pair = ONSET_KATAKANA[unit.onset] ?? ["",""];
  const voiced = previous && previous.vowel && VOICING_CODAS.has(previous.coda ?? "");
  return pair[voiced ? 1 : 0];
}

export function convert(text, options = {}) {
  const { ng_style = "na", final_style = "small", boundary_mode = "independent", dictionary = {} } = options;
  const words = text.split(/(\\s+)/u);
  return words.map(word => {
    if (!word || /^\\s+$/u.test(word)) return word;
    if (Object.prototype.hasOwnProperty.call(dictionary, word)) return dictionary[word];
    const units = normalizeSyllables(word, boundary_mode);
    let previous = null;
    return units.map(unit => {
      if (unit.raw !== undefined) { previous = null; return unit.raw; }
      const onset = renderOnset(unit, previous);
      const vowel = VOWEL_KATAKANA[unit.vowel] ?? "";
      const table = final_style === "full" ? CODA_FULL : CODA_SMALL;
      const coda = unit.coda ? (table[unit.coda] ?? "") : "";
      let rendered = onset + vowel + coda;
      if (ng_style === "ng" && unit.onset === "ㅇ" && unit.vowel) rendered = "ン" + vowel;
      previous = unit;
      return rendered;
    }).join("");
  }).join("");
}

export function convertWithDetails(text, options = {}) {
  return {
    input: text,
    output: convert(text, options),
    options: {
      ng_style: options.ng_style ?? "na",
      final_style: options.final_style ?? "small",
      boundary_mode: options.boundary_mode ?? "independent"
    }
  };
}
