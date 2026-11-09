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

const CODA_BY_INDEX = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const SIMPLE_CODA = {"ㄳ":"ㄱ","ㄵ":"ㄴ","ㄶ":"ㄴ","ㄺ":"ㄱ","ㄻ":"ㅁ","ㄼ":"ㄹ","ㄽ":"ㄹ","ㄾ":"ㄹ","ㄿ":"ㅂ","ㅀ":"ㄹ","ㅄ":"ㅂ","ㄲ":"ㄱ","ㅆ":"ㄷ","ㅅ":"ㄷ","ㅈ":"ㄷ","ㅊ":"ㄷ","ㅋ":"ㄱ","ㅌ":"ㄷ","ㅍ":"ㅂ","ㅎ":"ㄷ"};

function getFinalPronunciationCoda(korean) {
  const last = Array.from(korean).at(-1);
  if (!last) return null;
  const code = last.codePointAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return null;
  const rawCoda = CODA_BY_INDEX[(code - 0xAC00) % 28];
  return SIMPLE_CODA[rawCoda] ?? rawCoda;
}

const LIAISON_ONSET = { "ㄱ":"ㄱ","ㄲ":"ㄲ","ㄴ":"ㄴ","ㄷ":"ㄷ","ㄹ":"ㄹ","ㅁ":"ㅁ","ㅂ":"ㅂ","ㅅ":"ㅅ","ㅆ":"ㅆ","ㅈ":"ㅈ","ㅊ":"ㅊ","ㅋ":"ㅋ","ㅌ":"ㅌ","ㅍ":"ㅍ" };
const ONSET_INDEX = { "ㄱ":0,"ㄲ":1,"ㄴ":2,"ㄷ":3,"ㄸ":4,"ㄹ":5,"ㅁ":6,"ㅂ":7,"ㅃ":8,"ㅅ":9,"ㅆ":10,"ㅇ":11,"ㅈ":12,"ㅉ":13,"ㅊ":14,"ㅋ":15,"ㅌ":16,"ㅍ":17,"ㅎ":18 };
const LIAISON_CODA_KANA = {
  "ㄱ": ["ㇰ","ク"], "ㄲ": ["ㇰ","ク"], "ㄴ": ["ン","ン"], "ㄷ": ["ッ","ッ"],
  "ㄹ": ["ㇽ","ル"], "ㅁ": ["ㇺ","ム"], "ㅂ": ["ㇷ゚","プ"], "ㅅ": ["ッ","ッ"],
  "ㅆ": ["ッ","ッ"], "ㅈ": ["ッ","ッ"], "ㅊ": ["ッ","ッ"], "ㅋ": ["ㇰ","ク"],
  "ㅌ": ["ッ","ッ"], "ㅍ": ["ㇷ゚","プ"]
};

/**
 * Moves a simple final consonant onto a vowel-initial Korean particle.
 * The dictionary reading is shortened by its coda kana, then the particle's
 * first syllable is rebuilt with the carried consonant as its onset.
 */
export function getDictionaryLiaison(koreanName, dictionaryReading, suffix, options = {}) {
  const particle = ["으로","이","은","을","에","와","의"].find(value => suffix.startsWith(value));
  if (!particle) return null;
  const rest = suffix.slice(particle.length);
  const allowedFollowing = ["가","는","도","를","만","랑","며","요","과","와","에","에서","으로","은","이","을"];
  const firstRestChar = Array.from(rest)[0];
  const punctuation = new Set(["!","?",".",",",":",";","」","』",")","]","}"]);
  if (rest && !allowedFollowing.some(value => rest.startsWith(value)) && !punctuation.has(firstRestChar)) return null;

  const last = Array.from(koreanName).at(-1);
  if (!last) return null;
  const code = last.codePointAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return null;
  const rawCoda = CODA_BY_INDEX[(code - 0xAC00) % 28];
  const onset = LIAISON_ONSET[rawCoda];
  const kana = LIAISON_CODA_KANA[rawCoda];
  if (!onset || !kana || (particle === "으로" && rawCoda === "ㄹ")) return null;

  const codaKana = kana.find(value => dictionaryReading.endsWith(value));
  if (!codaKana) return null;

  const first = particle[0];
  const firstCode = first.codePointAt(0);
  if (firstCode < 0xAC00 || firstCode > 0xD7A3) return null;
  const offset = firstCode - 0xAC00;
  const vowelIndex = Math.floor((offset % 588) / 28);
  const codaIndex = offset % 28;
  const rebuilt = String.fromCodePoint(0xAC00 + ONSET_INDEX[onset] * 588 + vowelIndex * 28 + codaIndex);
  const transformedSuffix = rebuilt + suffix.slice(1);
  return {
    nameReading: dictionaryReading.slice(0, -codaKana.length),
    suffixReading: convertPlain(transformedSuffix, options.final_style ?? "small", options.boundary_mode ?? "independent")
  };
}

function isParticleSuffix(suffix) {
  const particle = ["께서","에서","으로","하고","께","이","가","은","는","을","를","과","와","도","만","의","에","로","랑","며"]
    .find(candidate => suffix.startsWith(candidate));
  if (!particle) return false;
  const next = suffix.slice(particle.length, particle.length + 1);
  return !next || "!?.,:;」』)}\\\"'”’".includes(next);
}

export function getParticleVoicingContext(koreanName, suffix) {
  const coda = getFinalPronunciationCoda(koreanName);
  return coda !== null && VOICING_CODAS.has(coda) && isParticleSuffix(suffix)
    ? { vowel: "ㅏ", coda }
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
    const suffix = word.slice(keyStart + key.length);
    // Keep the dictionary reading intact. Particles are converted separately;
    // dictionary-name codas must not be moved onto vowel-initial particles.
    output += dictionary[key];
    cursor = keyStart + key.length;
    previous = getParticleVoicingContext(key, suffix);
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
    const previous = context === "vowel" ? { vowel: "ㅏ", coda: "" } : (context && typeof context === "object" ? context : null);
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
