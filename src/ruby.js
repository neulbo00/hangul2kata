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

function renderConvertedSegments(value, options, initialContext = null) {
  const parts = String(value).split(/([가-힣ㄱ-ㅎㅏ-ㅣ]+)/gu);
  let context = initialContext;
  return parts.map((part) => {
    if (!part) return "";
    if (!HANGUL_PATTERN.test(part)) return escapeHtml(part);
    const reading = convert(part, { ...options, dictionary: {}, initial_context: context });
    context = null;
    return reading !== part ? renderRuby(part, reading) : escapeHtml(part);
  }).join("");
}

function renderToken(token, options) {
  const dictionary = options.dictionary ?? {};
  const keys = Object.keys(dictionary).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!keys.length) return renderConvertedSegments(token, options);

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
    const keyStart = match.index + prefix.length;
    const suffix = token.slice(keyStart + key.length);
    // A dictionary name may be followed by a recognized particle, but punctuation alone
    // must remain outside the dictionary match (and outside the ruby annotation).
    if (suffix && !HANGUL_PATTERN.test(suffix)) continue;
    html += renderConvertedSegments(token.slice(cursor, keyStart), options);
    html += renderRuby(key, String(dictionary[key]));
    cursor = keyStart + key.length;
    lastMatchedKey = key;
  }
  const rest = token.slice(cursor);
  if (rest) {
    const context = lastMatchedKey && getParticleVoicingContext(lastMatchedKey, rest) ? "vowel" : null;
    html += renderConvertedSegments(rest, options, context);
  }
  return html || renderConvertedSegments(token, options);
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
