import { normalizeSyllables } from "./phonology.js";

const ONSET_KATAKANA = {
  "ㄱ":"カ","ㄲ":"ッカ","ㄴ":"ナ","ㄷ":"タ","ㄸ":"ッタ","ㄹ":"ラ","ㅁ":"マ",
  "ㅂ":"パ","ㅃ":"ッパ","ㅅ":"サ","ㅆ":"ッサ","ㅇ":"","ㅈ":"チャ","ㅉ":"ッチャ",
  "ㅊ":"チャ","ㅋ":"カ","ㅌ":"タ","ㅍ":"パ","ㅎ":"ハ"
};
const VOWEL_KATAKANA = {
  "ㅏ":"ア","ㅐ":"エ","ㅑ":"ヤ","ㅒ":"イェ","ㅓ":"オ","ㅔ":"エ","ㅕ":"ヨ","ㅖ":"イェ",
  "ㅗ":"オ","ㅘ":"ワ","ㅙ":"ウェ","ㅚ":"ウェ","ㅛ":"ヨ","ㅜ":"ウ","ㅝ":"ウォ","ㅞ":"ウェ",
  "ㅟ":"ウィ","ㅠ":"ユ","ㅡ":"ウ","ㅢ":"ウィ","ㅣ":"イ"
};
const CODA_SMALL = {
  "ㄱ":"ㇰ","ㄴ":"ン","ㄷ":"ッ","ㄹ":"ㇽ","ㅁ":"ㇺ","ㅂ":"ㇷ゚","ㅇ":"ン"
};
const CODA_FULL = {
  "ㄱ":"ク","ㄴ":"ン","ㄷ":"ッ","ㄹ":"ル","ㅁ":"ム","ㅂ":"プ","ㅇ":"ン"
};

export function convert(text, options = {}) {
  const {
    ng_style = "na",
    final_style = "small",
    boundary_mode = "independent",
    dictionary = {}
  } = options;

  const words = text.split(/(\s+)/u);
  const output = words.map(word => {
    if (!word || /^\s+$/u.test(word)) return word;
    if (Object.prototype.hasOwnProperty.call(dictionary, word)) return dictionary[word];
    const units = normalizeSyllables(word, boundary_mode);
    return units.map(unit => {
      if (unit.raw !== undefined) return unit.raw;
      const onset = ONSET_KATAKANA[unit.onset] ?? "";
      const vowel = VOWEL_KATAKANA[unit.vowel] ?? "";
      let coda = "";
      if (unit.coda) {
        const table = final_style === "full" ? CODA_FULL : CODA_SMALL;
        coda = table[unit.coda] ?? "";
      }
      // ㅇ before a vowel is silent. For coda ㅇ, the standard nasal sign is ン.
      let syllable = onset + vowel + coda;
      if (ng_style === "ng" && unit.onset === "ㅇ" && unit.vowel) syllable = "ン" + vowel;
      return syllable;
    }).join("");
  }).join("");
  return output;
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
