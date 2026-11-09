import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { convert } from "../src/index.js";
import { toRubyHtml } from "../src/ruby.js";

const groups = ["VERIVERY", "EVNNE", "tripleS"];

for (const group of groups) {
  test(`loads the ${group} artist dictionary and applies all names`, async () => {
    const file = new URL(`../web/dictionaries/${group}.json`, import.meta.url);
    const data = JSON.parse(await readFile(file, "utf8"));

    assert.equal(typeof data.group, "string");
    assert.equal(typeof data.source, "string");
    assert.ok(Array.isArray(data.members) && data.members.length > 0);
    assert.equal(data.entries[data.korean], data.officialJapanese);
    for (const member of data.members) {
      assert.equal(data.entries[member.hangul], member.kana);
      assert.equal(convert(member.hangul, { dictionary: data.entries }), member.kana);
    }
  });
}

test("applies artist names inside sentences and before Korean particles", () => {
  const dictionary = {
    "베리베리": "ベリベリ",
    "강민": "カンミン",
    "박한빈": "パク・ハンビン",
    "윤서연": "ユン・ソヨン"
  };
  const output = convert("베리베리가 강민은 박한빈을 만났어요. 윤서연도 왔어요!", { dictionary });
  assert.match(output, /ベリベリガ/u);
  assert.match(output, /カンミヌン/u);
  assert.match(output, /パク・ハンビン/u);
  assert.match(output, /ユン・ソヨン/u);
  assert.doesNotMatch(output, /베리베리|강민|박한빈|윤서연/u);
});

test("personal dictionary overrides built-in artist dictionary", () => {
  const dictionary = { "강민": "カンミン" };
  const personal = { "강민": "カンミンくん" };
  assert.equal(convert("강민은", { dictionary: { ...dictionary, ...personal } }), "カンミンくんウン");
});

test("ruby preview uses artist dictionary matches with particles", () => {
  const html = toRubyHtml("베리베리가 강민은", {
    dictionary: { "베리베리": "ベリベリ", "강민": "カンミン" }
  });
  const readings = [...html.matchAll(/<rt lang="ja">([^<]*)<\/rt>/gu)].map((match) => match[1]).join("");
  assert.match(readings, /ベリベリガ/u);
  assert.match(readings, /カンミンウン/u);
});


test("voices initial lax consonants in particles after vowel-final dictionary names", () => {
  const dictionary = { "베리베리": "ベリベリ" };
  assert.equal(convert("베리베리가", { dictionary }), "ベリベリガ");
  assert.equal(convert("베리베리도", { dictionary }), "ベリベリド");
  assert.equal(convert("베리베리과", { dictionary }), "ベリベリグァ");
});

test("links consonant-final dictionary names to vowel-initial particles", () => {
  const dictionary = { "강민": "カンミン" };
  assert.equal(convert("강민이", { dictionary }), "カンミニ");
});


test("moves dictionary-name codas onto vowel-initial particles", () => {
  const dictionary = {
    "강민": "カンミン",
    "윤서연": "ユン・ソヨン",
    "길": "キル"
  };
  assert.equal(convert("강민이", { dictionary }), "カンミニ");
  assert.equal(convert("강민이가", { dictionary }), "カンミニガ");
  assert.equal(convert("강민은", { dictionary }), "カンミヌン");
  assert.equal(convert("강민을", { dictionary }), "カンミヌㇽ");
  assert.equal(convert("강민에", { dictionary }), "カンミネ");
  assert.equal(convert("강민으로", { dictionary }), "カンミヌロ");
  assert.equal(convert("윤서연이", { dictionary }), "ユン・ソヨニ");
  assert.equal(convert("길이", { dictionary }), "キリ");
});

test("voices particles after dictionary names ending in sonorant codas", () => {
  const dictionary = { "강민": "カンミン", "윤서연": "ユン・ソヨン" };
  assert.equal(convert("강민도", { dictionary }), "カンミンド");
  assert.equal(convert("윤서연도", { dictionary }), "ユン・ソヨンド");
});

test("user dictionary entries use the same sonorant-coda particle voicing", () => {
  const dictionary = { "강민": "カンミン" };
  assert.equal(convert("강민도", { dictionary }), "カンミンド");
});

test("ordinary words voice particles after sonorant codas", () => {
  assert.equal(convert("강민도",), "カンミンド");
  assert.equal(convert("사과도"), "サグァド");
});

test("ruby preview applies coda liaison after dictionary names", () => {
  const html = toRubyHtml("강민이가", { dictionary: { "강민": "カンミン" } });
  const readings = [...html.matchAll(/<rt lang="ja">([^<]*)<\/rt>/gu)].map(match => match[1]).join("");
  assert.equal(readings, "カンミニガ");
});

test("ruby preview preserves sonorant-coda voicing after dictionary names", () => {
  const html = toRubyHtml("강민도", { dictionary: { "강민": "カンミン" } });
  const readings = [...html.matchAll(/<rt lang="ja">([^<]*)<\/rt>/gu)].map(match => match[1]).join("");
  assert.match(readings, /カンミンド/u);
});
