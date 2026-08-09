import { readdirSync, readFileSync } from "fs";
import { assert, test } from "vitest";
import { AIOverview, Followup } from "../src/main";

const domParser = new DOMParser();

const testForType = (t: Followup['type']) => {
  for (const sample of readdirSync(`samples/${t}`)) {
    const sample_html = readFileSync(`samples/${t}/${sample}`).toString();
    const sample_document = domParser.parseFromString(sample_html, "text/html");

    const ao = AIOverview.fromDocument(sample_document);
    assert(ao !== null);

    ao.dumpBlocks();

    const f = ao.detectFollowup();
    assert(f !== null);

    assert(f.type === t);
  }
};

test('Document -> AIOverview -> Followup detection correctness [single_text]', () => {
  testForType('single_text');
});
test('Document -> AIOverview -> Followup detection correctness [composite_block]', () => {
  testForType('composite_block');
});
test('Document -> AIOverview -> Followup detection correctness [text_with_list]', () => {
  testForType('text_with_list');
});
test('Document -> AIOverview -> Followup detection correctness [texts_sandwitch_list]', () => {
  testForType('texts_sandwitch_list');
});
