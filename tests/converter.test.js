import test from "node:test";
import assert from "node:assert/strict";
import { convert } from "../src/index.js";

test("preserves non-Hangul text and whitespace", () => {
  assert.equal(convert("Love 한글 123!"), "Love ハングㇽ 123!");
});

test("converts basic Hangul syllables", () => {
  assert.equal(convert("가나다"), "カナダ");
});

test("uses small coda characters by default", () => {
  assert.equal(convert("각"), "カㇰ");
});

test("supports full-size coda style", () => {
  assert.equal(convert("각", { final_style: "full" }), "カク");
});

test("preserves punctuation", () => {
  assert.equal(convert("안녕!"), "ンアンニョン!");
});

test("user dictionary overrides a whole whitespace-delimited token", () => {
  assert.equal(convert("안녕 세상", { dictionary: { "안녕": "アンニョン(辞書)" } }), "アンニョン(辞書) セサン");
});

test("voices lenis onset after a sonorant within a word", () => {
  assert.equal(convert("한글"), "ハングㇽ");
});


test("supports silent initial ieung as an alternate style", () => {
  assert.equal(convert("안녕", { ng_style: "ng" }), "アンニョン");
});


test("does not add a small tsu to word-initial tense onsets", () => {
  assert.equal(convert("까"), "カ");
});

test("marks a medial tense onset with a small tsu", () => {
  assert.equal(convert("아까"), "ンアッカ");
});


test("moves the second consonant of a complex coda before a vowel", () => {
  assert.equal(convert("닭이"), "タㇽギ");
});

test("applies ㅎ aspiration before a plain onset", () => {
  assert.equal(convert("좋다"), "チョタ");
});

test("preserves the ㅌ liaison sound before 이", () => {
  assert.equal(convert("밭이"), "パチ");
});


test("deletes ㅎ and links the sonorant from a ㅎ cluster", () => {
  assert.equal(convert("많이"), "マニ");
});


test("keeps the small semi-voiced mark as a separate Unicode code point", () => {
  const points = Array.from(convert("밥")).map(char => char.codePointAt(0));
  assert.deepEqual(points, [0x30D1, 0x31F7, 0x309A]);
});


test("voices ㅈ after an open syllable before a glide vowel", () => {
  assert.equal(convert("가져"), "カジョ");
});


test("preserves Latin s, backslashes, tabs, and line breaks", () => {
  const input = "songs\\set\t한글\nYES";
  assert.equal(convert(input), "songs\\set\tハングㇽ\nYES");
});

test("keeps dictionary optional when no entry matches", () => {
  assert.equal(convert("안녕 세상"), "ンアンニョン セサン");
});

test("applies a dictionary entry only to its exact whitespace-delimited token", () => {
  assert.equal(
    convert("안녕 세상 안녕", { dictionary: { "안녕": "アンニョン(辞書)" } }),
    "アンニョン(辞書) セサン アンニョン(辞書)"
  );
});
