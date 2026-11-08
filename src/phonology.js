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
  "ㅅ":"ㄷ","ㅈ":"ㄷ","ㅊ":"ㄷ","ㅋ":"ㄱ","ㅌ":"ㄷ","ㅍ":"ㅂ"
};
const COMPLEX_LIAISON = {
  "ㄳ":["ㄱ","ㅅ"],"ㄵ":["ㄴ","ㅈ"],"ㄶ":["ㄴ","ㅎ"],"ㄺ":["ㄹ","ㄱ"],
  "ㄻ":["ㄹ","ㅁ"],"ㄼ":["ㄹ","ㅂ"],"ㄽ":["ㄹ","ㅅ"],"ㄾ":["ㄹ","ㅌ"],
  "ㄿ":["ㄹ","ㅍ"],"ㅀ":["ㄹ","ㅎ"],"ㅄ":["ㅂ","ㅅ"]
};
const ASPIRATED = {"ㄱ":"ㅋ","ㄷ":"ㅌ","ㅂ":"ㅍ","ㅈ":"ㅊ"};
const ASPIRATION_CODAS = new Set(["ㅎ","ㄶ","ㅀ"]);
const LIAISON_CODAS = new Set(["ㄱ","ㄲ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ"]);

function isVowelOnset(s) { return s && s.onset === "ㅇ"; }
function hasVowel(s) { return s && s.vowel; }

// Only local, explicitly defined patterns are applied. Morphology-dependent
// and cross-word rules are intentionally not inferred in this version.
export function applyPronunciation(input, boundaryMode = "independent") {
  const units = input.map(x => ({ ...x }));

  // ㅎ coda aspiration before an obstruent.
  for (let i = 0; i < units.length - 1; i++) {
    const a = units[i], b = units[i + 1];
    if (!a.coda || !b.onset) continue;
    if (boundaryMode === "independent" && a.wordId !== b.wordId) continue;
    if (ASPIRATION_CODAS.has(a.coda) && ASPIRATED[b.onset]) {
      if (a.coda === "ㄶ") a.coda = "ㄴ";
      else if (a.coda === "ㅀ") a.coda = "ㄹ";
      else a.coda = "";
      b.onset = ASPIRATED[b.onset];
    }
  }

  // Liaison before a vowel-initial syllable.
  for (let i = 0; i < units.length - 1; i++) {
    const a = units[i], b = units[i + 1];
    if (!a.coda || !hasVowel(b) || !isVowelOnset(b)) continue;
    if (boundaryMode === "independent" && a.wordId !== b.wordId) continue;

    const complex = COMPLEX_LIAISON[a.coda];
    if (complex) {
      if (complex[1] === "ㅎ") {
        a.coda = "";
        b.onset = complex[0];
      } else {
        a.coda = complex[0];
        b.onset = complex[1];
      }
      continue;
    }
    if (a.coda === "ㅎ") {
      a.coda = "";
      continue;
    }
    if (LIAISON_CODAS.has(a.coda)) {
      b.onset = a.coda;
      a.coda = "";
    }
  }

  // Neutralize codas that remain in syllable-final position.
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
  const parts = text.match(/\\s+|[^\\s]+/gu) ?? [];
  let wordId = 0;
  const result = [];
  for (const part of parts) {
    if (/^\\s+$/u.test(part)) {
      result.push(...Array.from(part, raw => ({ raw })));
      wordId++;
    } else {
      const decomposed = decompose(part).map(x => ({ ...x, wordId }));
      result.push(...applyPronunciation(decomposed, boundaryMode));
    }
  }
  return result;
}
