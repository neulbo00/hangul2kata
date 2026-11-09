import { convert } from "./converter.js";

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

  // Honor an exact dictionary entry for the complete whitespace-delimited token.
  if (Object.prototype.hasOwnProperty.call(dictionary, token) && HANGUL_PATTERN.test(token)) {
    const reading = String(dictionary[token]);
    return reading && reading !== token ? renderRuby(token, reading) : escapeHtml(token);
  }

  const matches = Array.from(token.matchAll(/[가-힣ㄱ-ㅎㅏ-ㅣ]/gu));
  if (matches.length === 0) return escapeHtml(token);

  const first = matches[0].index;
  const last = matches[matches.length - 1];
  const end = last.index + last[0].length;
  const prefix = token.slice(0, first);
  const base = token.slice(first, end);
  const suffix = token.slice(end);
  // Match the converter's exact-token dictionary rule. Do not apply a bare-word
  // dictionary key after punctuation has been split away for ruby placement.
  const reading = convert(base, { ...options, dictionary: {} });

  if (!reading || reading === base) return escapeHtml(token);
  return escapeHtml(prefix) + renderRuby(base, reading) + escapeHtml(suffix);
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
