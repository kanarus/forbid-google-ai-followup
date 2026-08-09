import { readdirSync, readFileSync } from "fs";
import { assert, expect, test } from "vitest";
import { AIOverview, AIOverviewContentBlock, Followup, FollowupHandler } from "../src/main";

type ExpectedJSON = {
  contentBlockTypes: (AIOverviewContentBlock['type'])[],
  followupTextContentFirstline: string,
};

const domParser = new DOMParser();

const testForType = (t: Followup['type']) => {
  for (const sample of readdirSync(`samples/${t}`).filter(name => name.endsWith(".html"))) {
    const MESSAGE = `sample: ${sample}`;

    const sample_html = readFileSync(`samples/${t}/${sample}`).toString();
    const sample_document = domParser.parseFromString(sample_html, "text/html");

    const expected_json = readFileSync(`samples/${t}/${sample.replace(".html", ".expected.json")}`).toString();
    const expected = JSON.parse(expected_json) as ExpectedJSON;

    const ao = AIOverview.fromDocument(sample_document);
    assert(ao !== null, MESSAGE);
    expect(ao.contentBlocks.map(cb => cb.type), MESSAGE).toEqual(expected.contentBlockTypes);

    const f = ao.detectFollowup();
    assert(f !== null, MESSAGE);
    const fh = new FollowupHandler(f);
    expect(fh.followup.type, MESSAGE).toEqual(t);
    // HTML formatter casually inserts whitespaces or newlines,
    // so such workaround is needed to test textContent
    expect(fh.textContent.trim().split("\n")[0].trim(), MESSAGE)
      .toEqual(expected.followupTextContentFirstline);
  }
};

// test('Document -> AIOverview -> Followup detection correctness [single_text]', () => {
//   testForType('single_text');
// });
// test('Document -> AIOverview -> Followup detection correctness [composite_block]', () => {
//   testForType('composite_block');
// });
// test('Document -> AIOverview -> Followup detection correctness [text_with_list]', () => {
//   testForType('text_with_list');
// });
test('Document -> AIOverview -> Followup detection correctness [texts_sandwitch_list]', () => {
  testForType('texts_sandwitch_list');
});
