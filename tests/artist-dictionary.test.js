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
  assert.match(output, /カンミンウン/u);
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

test("does not voice particles after consonant-final dictionary names", () => {
  const dictionary = { "강민": "カンミン" };
  assert.equal(convert("강민이", { dictionary }), "カンミンイ");
});
