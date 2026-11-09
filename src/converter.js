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
    const row = voiced && VOICED_ROWS[unit.onset] ? VOICED_ROWS[unit.onset] : ROWS[unit.onset];
    const uRow = row?.[3] ?? "";
    return (TENSE_ONSETS.has(unit.onset) && previous ? "ッ" : "") + uRow + COMPOUND_SUFFIX[unit.vowel];
  }

  const index = VOWEL_INDEX[unit.vowel];
  if (index === undefined) return "";
  if (TENSE_ONSETS.has(unit.onset) && previous) return "ッ" + (ROWS[unit.onset]?.[index] ?? "");
  const row = voiced && VOICED_ROWS[unit.onset] ? VOICED_ROWS[unit.onset] : ROWS[unit.onset];
  return row?.[index] ?? "";
}

function convertPlain(text, final_style, boundary_mode, initialPrevious = null) {
  const units = normalizeSyllables(text, boundary_mode);
  let previous = initialPrevious;
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

function hasOpenVowelEnding(korean) {
  const last = Array.from(korean).at(-1);
  if (!last) return false;
  const code = last.codePointAt(0);
  return code >= 0xAC00 && code <= 0xD7A3 && (code - 0xAC00) % 28 === 0;
}

function isParticleSuffix(suffix) {
  const particle = ["께서","에서","으로","하고","께","이","가","은","는","을","를","과","와","도","만","의","에","로","랑","며"]
    .find(candidate => suffix.startsWith(candidate));
  if (!particle) return false;
  const next = suffix.slice(particle.length, particle.length + 1);
  return !next || "!?.,:;」』)}]\\\"'”’".includes(next);
}

export function getParticleVoicingContext(koreanName, suffix) {
  return hasOpenVowelEnding(koreanName) && isParticleSuffix(suffix)
    ? { vowel: "ㅏ", coda: "" }
    : null;
}

function convertWord(word, dictionary, final_style, boundary_mode, initialPrevious = null) {
  const keys = Object.keys(dictionary).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!keys.length) return convertPlain(word, final_style, boundary_mode, initialPrevious);

  const opening = "「『([{\\\"'“‘";
  const trailing = "은는이가을를과와도만의에에서로으로께께서랑하고며요!?.,:;」』)]}\\\"'”’";
  const pattern = new RegExp("(^|[" + escapeRegExp(opening) + "])(" +
    keys.map(escapeRegExp).join("|") + ")(?=$|[" + escapeRegExp(trailing) + "])", "gu");
  let output = "";
  let cursor = 0;
  let previous = initialPrevious;
  for (const match of word.matchAll(pattern)) {
    const prefix = match[1] ?? "";
    const key = match[2];
    const keyStart = match.index + prefix.length;
    output += convertPlain(word.slice(cursor, keyStart), final_style, boundary_mode, previous);
    previous = null;
    output += dictionary[key];
    cursor = keyStart + key.length;
    previous = getParticleVoicingContext(key, word.slice(cursor));
  }
  output += convertPlain(word.slice(cursor), final_style, boundary_mode, previous);
  return output;
}

export function convert(text, options = {}) {
  const { final_style = "small", boundary_mode = "independent", dictionary = {}, initial_context = null } = options;
  const words = text.split(/(\s+)/u);
  let context = initial_context;
  return words.map(word => {
    if (!word || /^\s+$/u.test(word)) return word;
    const previous = context === "vowel" ? { vowel: "ㅏ", coda: "" } : null;
    context = null;
    return convertWord(word, dictionary, final_style, boundary_mode, previous);
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
