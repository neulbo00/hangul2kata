import test from "node:test";
import assert from "node:assert/strict";
import { toRubyHtml } from "../src/ruby.js";

test("adds word-level ruby while preserving spaces and line breaks", () => {
  assert.equal(
    toRubyHtml("안녕  세상\n아"),
    '<span lang="ko" style="white-space: pre-wrap;"><ruby>안녕<rp>（</rp><rt lang="ja">アンニョン</rt><rp>）</rp></ruby>  <ruby>세상<rp>（</rp><rt lang="ja">セサン</rt><rp>）</rp></ruby>\n<ruby>아<rp>（</rp><rt lang="ja">ア</rt><rp>）</rp></ruby></span>'
  );
});

test("does not add ruby to Latin text or numbers", () => {
  assert.equal(
    toRubyHtml("Hello 123"),
    '<span lang="ko" style="white-space: pre-wrap;">Hello 123</span>'
  );
});

test("keeps punctuation outside the ruby annotation", () => {
  assert.equal(
    toRubyHtml("<안녕!>"),
    '<span lang="ko" style="white-space: pre-wrap;">&lt;<ruby>안녕<rp>（</rp><rt lang="ja">アンニョン</rt><rp>）</rp></ruby>!&gt;</span>'
  );
});

test("uses the user dictionary reading in ruby output", () => {
  assert.equal(
    toRubyHtml("안녕", { dictionary: { "안녕": "アンニョン(辞書)" } }),
    '<span lang="ko" style="white-space: pre-wrap;"><ruby>안녕<rp>（</rp><rt lang="ja">アンニョン(辞書)</rt><rp>）</rp></ruby></span>'
  );
});

test("escapes HTML in the original text and generated reading", () => {
  assert.equal(
    toRubyHtml("안녕", { dictionary: { "안녕": "<script>alert(1)</script>" } }),
    '<span lang="ko" style="white-space: pre-wrap;"><ruby>안녕<rp>（</rp><rt lang="ja">&lt;script&gt;alert(1)&lt;/script&gt;</rt><rp>）</rp></ruby></span>'
  );
});

test("does not apply a dictionary key to a token with extra punctuation", () => {
  assert.equal(
    toRubyHtml("안녕!", { dictionary: { "안녕": "辞書読み" } }),
    '<span lang="ko" style="white-space: pre-wrap;"><ruby>안녕<rp>（</rp><rt lang="ja">アンニョン</rt><rp>）</rp></ruby>!</span>'
  );
});
