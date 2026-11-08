import test from "node:test";
import assert from "node:assert/strict";
import { convert } from "../src/index.js";

test("preserves non-Hangul text and whitespace", () => {
  assert.equal(convert("Love 한글 123!"), "Loveハンガウㇽ 123!");
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
  assert.equal(convert("한글"), "ハンガウㇽ");
});


test("supports silent initial ieung as an alternate style", () => {
  assert.equal(convert("안녕", { ng_style: "ng" }), "アンニョン");
});
