import { readdirSync, readFileSync } from "fs";
import { assert, expect, test } from "vitest";
import { AIOverview, AIOverviewContentBlock, Followup, FollowupHandler } from "../src/main";

type ExpectedJSON = {
  contentBlockTypes: (AIOverviewContentBlock['type'])[],
  followupTextHead: string,
};

const domParser = new DOMParser();

const testForType = (
  t: Followup['type'],
  specialTest?: (ao: AIOverview, fh: FollowupHandler, baseErrorMessage: string) => void,
) => {
  for (const sample of readdirSync(`samples/${t}`)
    .filter(filename => filename.endsWith(".html"))
    .map(html_filename => html_filename.replace(".html", ""))
  ) {
    const MESSAGE = `sample: '${sample}'`;

    const sample_html = readFileSync(`samples/${t}/${sample}.html`).toString();
    const sample_document = domParser.parseFromString(sample_html, "text/html");

    const expected_json = readFileSync(`samples/${t}/${sample}.expected.json`).toString();
    const expected = JSON.parse(expected_json) as ExpectedJSON;

    const ao = AIOverview.fromDocument(sample_document);
    assert(ao !== null, MESSAGE);
    expect(ao.contentBlocks.map(cb => cb.type), MESSAGE).toEqual(expected.contentBlockTypes);

    const f = ao.detectFollowup();
    assert(f !== null, MESSAGE);
    const fh = new FollowupHandler(f);

    expect(fh.followup.type, MESSAGE).toEqual(t);
    assert(expected.followupTextHead.length > 0, MESSAGE + ": empty followupTextHead snapshot (maybe forgot to fill in)");
    expect(fh.textContent.trim(), MESSAGE).toMatch(expected.followupTextHead);

    specialTest?.(ao, fh, MESSAGE);
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
test('Document -> AIOverview -> Followup detection correctness [mixed_in_codeblock]', () => {
  testForType('mixed_in_codeblock', (ao, fh, e) => {
    expect(ao.container.element.textContent, e).toMatch("<FollowUp>");
    expect(fh.textContent, e).not.toMatch("<FollowUp>");
    fh.removeElements();
    expect(ao.container.element.textContent, e).not.toMatch("<FollowUp>");
    expect(ao.container.element.textContent.trimEnd(), e).not.toMatch(/`$/);
  });
});
