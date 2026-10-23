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
  specialTest?: (ao: AIOverview, fh: FollowupHandler, ERR: (msg: string) => string) => void,
) => {
  for (const sample of readdirSync(`samples/${t}`)
    .filter(filename => filename.endsWith(".html"))
    .map(html_filename => html_filename.replace(".html", ""))
  ) {
    const ERR = (msg: string) => `sample '${sample}': ${msg}`;

    const sample_html = readFileSync(`samples/${t}/${sample}.html`).toString();
    const sample_document = domParser.parseFromString(sample_html, "text/html");

    const expected_json = readFileSync(`samples/${t}/${sample}.expected.json`).toString();
    const expected = JSON.parse(expected_json) as ExpectedJSON;

    assert(AIOverview.streamingIsComplete(sample_document), ERR('incomplete AIOvewview streaming'));
    const ao = AIOverview.fromDocument(sample_document);
    assert(ao !== null, ERR('AIOvewview not found'));
    expect(ao.contentBlocks.map(cb => cb.type), ERR('AIOvewview structure mismatch'))
      .toEqual(expected.contentBlockTypes);

    const f = ao.detectFollowup();
    assert(f !== null, ERR('Followup not found'));
    const fh = new FollowupHandler(f);

    expect(fh.followup.type, ERR('Followup type mismatch')).toEqual(t);
    assert(expected.followupTextHead.length > 0, ERR('empty followupTextHead snapshot (maybe forgot to fill in)'));
    expect(fh.textContent.trim(), ERR('Followup text mismatch')).toMatch(expected.followupTextHead);

    specialTest?.(ao, fh, ERR);
  }
};

test('Document -> AIOverview -> Followup detection correctness [single_text]', () => {
  testForType('single_text');
});
test('Document -> AIOverview -> Followup detection correctness [double_texts]', () => {
  testForType('double_texts');
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
  testForType('mixed_in_codeblock', (ao, fh, ERR) => {
    expect(fh.textContent, ERR('<Followup> contamination in textContent before remove')).not.toMatch("<FollowUp>");
    expect(ao.container.element.textContent, ERR('<Followup> not found before remove')).toMatch("<FollowUp>");
    fh.remove();
    expect(ao.container.element.textContent, ERR('<Followup> remaining after remove')).not.toMatch("<FollowUp>");
    expect(ao.container.element.textContent.trimEnd(), ERR('textContent ending with backquote after remove')).not.toMatch(/`$/);
  });
});
