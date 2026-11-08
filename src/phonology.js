const ONSET = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const VOWEL = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const CODA = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

export function decompose(text) {
  return Array.from(text, (char) => {
    const code = char.codePointAt(0);
    if (code < 0xAC00 || code > 0xD7A3) return { raw: char };
    const n = code - 0xAC00;
    return {
      onset: ONSET[Math.floor(n / 588)],
      vowel: VOWEL[Math.floor((n % 588) / 28)],
      coda: CODA[n % 28],
      source: char
    };
  });
}

const SIMPLE_CODA = {
  "ㄳ":"ㄱ","ㄵ":"ㄴ","ㄶ":"ㄴ","ㄺ":"ㄱ","ㄻ":"ㅁ","ㄼ":"ㄹ","ㄽ":"ㄹ",
  "ㄾ":"ㄹ","ㄿ":"ㅂ","ㅀ":"ㄹ","ㅄ":"ㅂ","ㄲ":"ㄱ","ㅆ":"ㄷ",
  "ㅅ":"ㄷ","ㅈ":"ㄷ","ㅊ":"ㄷ","ㅋ":"ㄱ","ㅌ":"ㄷ","ㅍ":"ㅂ","ㅎ":"ㄷ"
};

function isVowelOnset(s) { return s && s.onset === "ㅇ"; }
function hasVowel(s) { return s && s.vowel; }

// This pass intentionally handles only well-defined local patterns.
// Morphology-dependent and phrase-level rules are not inferred.
export function applyPronunciation(input, boundaryMode = "independent") {
  const units = input.map(x => ({ ...x }));
  for (let i = 0; i < units.length - 1; i++) {
    const a = units[i], b = units[i + 1];
    if (!a.coda || !hasVowel(b)) continue;
    if (boundaryMode === "independent" && a.wordId !== b.wordId) continue;

    // Basic liaison for single consonant codas before a zero onset.
    if (isVowelOnset(b) && ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ"].includes(a.coda)) {
      b.onset = SIMPLE_CODA[a.coda] ?? a.coda;
      a.coda = "";
    } else if (isVowelOnset(b) && a.coda === "ㅎ") {
      a.coda = "";
    }
  }

  // Coda neutralization for the remaining closed syllables.
  for (const unit of units) {
    if (unit.coda) unit.coda = SIMPLE_CODA[unit.coda] ?? unit.coda;
  }

  // Nasal assimilation: ㄱ/ㄷ/ㅂ + ㄴ/ㅁ.
  for (let i = 0; i < units.length - 1; i++) {
    const a = units[i], b = units[i + 1];
    if (!a.coda || !b.onset) continue;
    if (boundaryMode === "independent" && a.wordId !== b.wordId) continue;
    if (["ㄴ","ㅁ"].includes(b.onset)) {
      if (a.coda === "ㄱ") a.coda = "ㅇ";
      if (a.coda === "ㄷ") a.coda = "ㄴ";
      if (a.coda === "ㅂ") a.coda = "ㅁ";
    }
  }

  // Conservative tensification after selected obstruent codas.
  for (let i = 0; i < units.length - 1; i++) {
    const a = units[i], b = units[i + 1];
    if (!a.coda || !b.onset) continue;
    if (boundaryMode === "independent" && a.wordId !== b.wordId) continue;
    const tense = { "ㄱ":"ㄲ", "ㄷ":"ㄸ", "ㅂ":"ㅃ", "ㅅ":"ㅆ", "ㅈ":"ㅉ" };
    if (["ㄱ","ㄷ","ㅂ"].includes(a.coda) && tense[b.onset]) b.onset = tense[b.onset];
  }
  return units;
}

export function normalizeSyllables(text, boundaryMode = "independent") {
  // Split at whitespace but preserve every original separator exactly.
  const parts = text.match(/\s+|[^\s]+/gu) ?? [];
  let wordId = 0;
  const result = [];
  for (const part of parts) {
    if (/^\s+$/u.test(part)) {
      result.push(...Array.from(part, raw => ({ raw })));
      wordId++;
    } else {
      const decomposed = decompose(part).map(x => ({ ...x, wordId }));
      result.push(...applyPronunciation(decomposed, boundaryMode));
    }
  }
  return result;
}
