import { convert, getParticleVoicingContext } from "./converter.js";

const HANGUL_PATTERN = /[가-힣ㄱ-ㅎㅏ-ㅣ]/u;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/gu, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderRuby(base, reading) {
  return `<ruby>${escapeHtml(base)}<rp>（</rp><rt lang="ja">${escapeHtml(reading)}</rt><rp>）</rp></ruby>`;
}

function renderToken(token, options) {
  const dictionary = options.dictionary ?? {};
  const keys = Object.keys(dictionary).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!keys.length) {
    const reading = convert(token, { ...options, dictionary: {} });
    return reading && reading !== token ? renderRuby(token, reading) : escapeHtml(token);
  }
  const opening = "「『([{\\\"'“‘";
  const trailing = "은는이가을를과와도만의에에서로으로께께서랑하고며요!?.,:;」』)]}\\\"'”’";
  const escapeRegExp = (value) => value.split("").map(char => "\\^$.*+?()[]{}|".includes(char) ? "\\" + char : char).join("");
  const pattern = new RegExp("(^|[" + escapeRegExp(opening) + "])(" + keys.map(escapeRegExp).join("|") + ")(?=$|[" + escapeRegExp(trailing) + "])", "gu");
  let html = "";
  let cursor = 0;
  let lastMatchedKey = null;
  for (const match of token.matchAll(pattern)) {
    const prefix = match[1] ?? "";
    const key = match[2];
    lastMatchedKey = key;
    const keyStart = match.index + prefix.length;
    const before = token.slice(cursor, keyStart);
    if (before) {
      const reading = convert(before, { ...options, dictionary: {} });
      html += HANGUL_PATTERN.test(before) && reading !== before ? renderRuby(before, reading) : escapeHtml(before);
    }
    html += renderRuby(key, String(dictionary[key]));
    cursor = keyStart + key.length;
  }
  const rest = token.slice(cursor);
  if (rest) {
    const context = lastMatchedKey && getParticleVoicingContext(lastMatchedKey, rest) ? "vowel" : null;
    const reading = convert(rest, { ...options, dictionary: {}, initial_context: context });
    html += HANGUL_PATTERN.test(rest) && reading !== rest ? renderRuby(rest, reading) : escapeHtml(rest);
  }
  return html || escapeHtml(token);
}

/**
 * Builds a safe, word-level HTML ruby fragment from the original Korean text.
 * Whitespace is copied verbatim and preserved by the wrapper's pre-wrap style.
 */
export function toRubyHtml(text, options = {}) {
  const parts = String(text).split(/(\s+)/u);
  const body = parts.map((part) => {
    if (!part || /^\s+$/u.test(part)) return escapeHtml(part);
    return renderToken(part, options);
  }).join("");

  return `<span lang="ko" style="white-space: pre-wrap;">${body}</span>`;
}
