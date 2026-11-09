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
  assert.equal(
    convert("베리베리가 강민은 박한빈을 만났어요. 윤서연도 왔어요!", { dictionary }),
    "ベリベリガ カンミンウン パク・ハンビンヲ マンナッソヨ. ユン・ソヨンモ ワッソヨ!"
  );
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
  assert.match(html, /ベリベリガ/u);
  assert.match(html, /カンミンウン/u);
});
