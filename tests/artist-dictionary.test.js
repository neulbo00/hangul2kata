import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { convert } from "../src/index.js";
import { toRubyHtml } from "../src/ruby.js";

const groups = ["VERIVERY", "EVNNE", "tripleS"];

for (const group of groups) {
  test(`loads the ${group} artist dictionary and applies it to conversion and ruby`, async () => {
    const file = new URL(`../web/dictionaries/${group}.json`, import.meta.url);
    const data = JSON.parse(await readFile(file, "utf8"));

    assert.equal(typeof data.group, "string");
    assert.equal(typeof data.source, "string");
    assert.equal(data.entries[data.korean], data.officialJapanese);
    assert.equal(convert(data.korean, { dictionary: data.entries }), data.officialJapanese);
    assert.match(toRubyHtml(data.korean, { dictionary: data.entries }), new RegExp(data.officialJapanese));
  });
}
