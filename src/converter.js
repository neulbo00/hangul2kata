import { normalizeSyllables } from "./phonology.js";

const ROWS = {
  "ㄱ":["カ","ケ","コ","ク","キ"],"ㄲ":["カ","ケ","コ","ク","キ"],"ㄴ":["ナ","ネ","ノ","ヌ","ニ"],
  "ㄷ":["タ","テ","ト","ツ","チ"],"ㄸ":["タ","テ","ト","ツ","チ"],"ㄹ":["ラ","レ","ロ","ル","リ"],
  "ㅁ":["マ","メ","モ","ム","ミ"],"ㅂ":["パ","ペ","ポ","プ","ピ"],"ㅃ":["パ","ペ","ポ","プ","ピ"],
  "ㅅ":["サ","セ","ソ","ス","シ"],"ㅆ":["サ","セ","ソ","ス","シ"],"ㅇ":["ア","エ","オ","ウ","イ"],
  "ㅈ":["チャ","チェ","チョ","チュ","チ"],"ㅉ":["チャ","チェ","チョ","チュ","チ"],"ㅊ":["チャ","チェ","チョ","チュ","チ"],
  "ㅋ":["カ","ケ","コ","ク","キ"],"ㅌ":["タ","テ","ト","ツ","チ"],"ㅍ":["パ","ペ","ポ","プ","ピ"],
  "ㅎ":["ハ","ヘ","ホ","フ","ヒ"]
};
const VOICED_ROWS = {
  "ㄱ":["ガ","ゲ","ゴ","グ","ギ"],"ㄷ":["ダ","デ","ド","ヅ","ヂ"],
  "ㅂ":["バ","ベ","ボ","ブ","ビ"],"ㅈ":["ジャ","ジェ","ジョ","ジュ","ジ"]
};
const PALATAL_ROWS = {
  "ㄱ":["キャ","キェ","キョ","キュ"],"ㄲ":["キャ","キェ","キョ","キュ"],
  "ㄴ":["ニャ","ニェ","ニョ","ニュ"],"ㄷ":["チャ","チェ","チョ","チュ"],
  "ㄸ":["チャ","チェ","チョ","チュ"],"ㄹ":["リャ","リェ","リョ","リュ"],
  "ㅁ":["ミャ","ミェ","ミョ","ミュ"],"ㅂ":["ピャ","ピェ","ピョ","ピュ"],
  "ㅃ":["ピャ","ピェ","ピョ","ピュ"],"ㅅ":["シャ","シェ","ショ","シュ"],
  "ㅆ":["シャ","シェ","ショ","シュ"],"ㅈ":["チャ","チェ","チョ","チュ"],
  "ㅉ":["チャ","チェ","チョ","チュ"],"ㅊ":["チャ","チェ","チョ","チュ"],
  "ㅋ":["キャ","キェ","キョ","キュ"],"ㅌ":["チャ","チェ","チョ","チュ"],
  "ㅍ":["ピャ","ピェ","ピョ","ピュ"],"ㅎ":["ヒャ","ヒェ","ヒョ","ヒュ"]
};
const VOICED_PALATAL_ROWS = {
  "ㄱ":["ギャ","ギェ","ギョ","ギュ"],"ㄷ":["ジャ","ジェ","ジョ","ジュ"],
  "ㅂ":["ビャ","ビェ","ビョ","ビュ"],"ㅈ":["ジャ","ジェ","ジョ","ジュ"]
};
const VOWEL_INDEX = {"ㅏ":0,"ㅐ":1,"ㅓ":2,"ㅔ":1,"ㅗ":2,"ㅜ":3,"ㅡ":3,"ㅣ":4};
const PALATAL_INDEX = {"ㅑ":0,"ㅒ":1,"ㅕ":2,"ㅖ":1,"ㅛ":2,"ㅠ":3};
const COMPOUND_SUFFIX = {"ㅘ":"ァ","ㅙ":"ェ","ㅚ":"ェ","ㅝ":"ォ","ㅞ":"ェ","ㅟ":"ィ","ㅢ":"ィ"};
const STANDALONE_VOWELS = {
  "ㅏ":"ア","ㅐ":"エ","ㅑ":"ヤ","ㅒ":"イェ","ㅓ":"オ","ㅔ":"エ","ㅕ":"ヨ","ㅖ":"イェ",
  "ㅗ":"オ","ㅘ":"ワ","ㅙ":"ウェ","ㅚ":"ウェ","ㅛ":"ヨ","ㅜ":"ウ","ㅝ":"ウォ","ㅞ":"ウェ",
  "ㅟ":"ウィ","ㅠ":"ユ","ㅡ":"ウ","ㅢ":"ウィ","ㅣ":"イ"
};
const CODA_SMALL = {"ㄱ":"ㇰ","ㄴ":"ン","ㄷ":"ッ","ㄹ":"ㇽ","ㅁ":"ㇺ","ㅂ":"ㇷ゚","ㅇ":"ン"};
const CODA_FULL = {"ㄱ":"ク","ㄴ":"ン","ㄷ":"ッ","ㄹ":"ル","ㅁ":"ム","ㅂ":"プ","ㅇ":"ン"};
const VOICING_CODAS = new Set(["","ㄴ","ㄹ","ㅁ","ㅇ"]);
const TENSE_ONSETS = new Set(["ㄲ","ㄸ","ㅃ","ㅆ","ㅉ"]);

function renderOnset(unit, previous) {
  // Initial ㅇ is a silent placeholder. A coda ㅇ is rendered separately as ン.
  if (unit.onset === "ㅇ") {
    return STANDALONE_VOWELS[unit.vowel] ?? "";
  }

  const voiced = previous && previous.vowel && VOICING_CODAS.has(previous.coda ?? "");
  if (Object.hasOwn(PALATAL_INDEX, unit.vowel)) {
    const palatal = voiced && VOICED_PALATAL_ROWS[unit.onset]
      ? VOICED_PALATAL_ROWS[unit.onset]
      : PALATAL_ROWS[unit.onset];
    if (palatal) return (TENSE_ONSETS.has(unit.onset) && previous ? "ッ" : "") + palatal[PALATAL_INDEX[unit.vowel]];
  }

  if (Object.hasOwn(COMPOUND_SUFFIX, unit.vowel)) {
    const uRow = ROWS[unit.onset]?.[3] ?? "";
    return (TENSE_ONSETS.has(unit.onset) && previous ? "ッ" : "") + uRow + COMPOUND_SUFFIX[unit.vowel];
  }

  const index = VOWEL_INDEX[unit.vowel];
  if (index === undefined) return "";
  if (TENSE_ONSETS.has(unit.onset) && previous) return "ッ" + (ROWS[unit.onset]?.[index] ?? "");
  const row = voiced && VOICED_ROWS[unit.onset] ? VOICED_ROWS[unit.onset] : ROWS[unit.onset];
  return row?.[index] ?? "";
}

function convertPlain(text, final_style, boundary_mode) {
  const units = normalizeSyllables(text, boundary_mode);
  let previous = null;
  return units.map(unit => {
    if (unit.raw !== undefined) { previous = null; return unit.raw; }
    const onset = renderOnset(unit, previous);
    const table = final_style === "full" ? CODA_FULL : CODA_SMALL;
    const coda = unit.coda ? (table[unit.coda] ?? "") : "";
    previous = unit;
    return onset + coda;
  }).join("");
}

function escapeRegExp(value) {
  return value.split("").map(char => "\\^$.*+?()[]{}|".includes(char) ? "\\" + char : char).join("");
}

function convertWord(word, dictionary, final_style, boundary_mode) {
  const keys = Object.keys(dictionary).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!keys.length) return convertPlain(word, final_style, boundary_mode);

  // Match dictionary names at token start or after opening punctuation.
  // Permit common Korean particles and closing punctuation after the name.
  const opening = "「『([{\\\"'“‘";
  const trailing = "은는이가을를과와도만의에에서로으로께께서랑하고며요!?.,:;」』)]}\\\"'”’";
  const pattern = new RegExp("(^|[" + escapeRegExp(opening) + "])(" +
    keys.map(escapeRegExp).join("|") + ")(?=$|[" + escapeRegExp(trailing) + "])", "gu");
  let output = "";
  let cursor = 0;
  for (const match of word.matchAll(pattern)) {
    const start = match.index;
    const full = match[0];
    const prefix = match[1] ?? "";
    const key = match[2];
    const keyStart = start + prefix.length;
    output += convertPlain(word.slice(cursor, keyStart), final_style, boundary_mode);
    output += dictionary[key];
    cursor = keyStart + key.length;
  }
  output += convertPlain(word.slice(cursor), final_style, boundary_mode);
  return output;
}

export function convert(text, options = {}) {
  const { final_style = "small", boundary_mode = "independent", dictionary = {} } = options;
  const words = text.split(/(\s+)/u);
  return words.map(word => {
    if (!word || /^\s+$/u.test(word)) return word;
    return convertWord(word, dictionary, final_style, boundary_mode);
  }).join("");
}

export function convertWithDetails(text, options = {}) {
  return {
    input: text,
    output: convert(text, options),
    options: {
      final_style: options.final_style ?? "small",
      boundary_mode: options.boundary_mode ?? "independent"
    }
  };
}
