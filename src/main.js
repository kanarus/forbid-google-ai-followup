/**
  * @param {Element} element
  * @returns {element is HTMLDivElement}
  */
function isDiv(element) {
  return element.tagName.toLowerCase() === "div";
}
/**
  * @param {Element} element
  * @returns {element is HTMLUListElement | HTMLOListElement}
  */
function isList(element) {
  const tagname = element.tagName.toLowerCase();
  return (tagname === "ul" || tagname === "ol");
}
/**
  * @param {Element} element
  * @returns {element is HTMLSpanElement}
  */
function isSpan(element) {
  return element.tagName.toLowerCase() === "span";
}

/**
  * @param {Element} element
  * @returns {boolean}
  */
function isSfcCp(element) {
  return element.getAttribute("data-sfc-cp") === "";
}
/**
  * @param {Element} element
  * @returns {boolean}
  */
function isBfc(element) {
  return element.getAttribute("data-bfc") === "";
}
/**
  * @param {HTMLElement} element
  * @returns {boolean}
  */
function isDisplayContents(element) {
  return element.style.display === "contents";
}

/** 
  * @param {HTMLElement} element
  * @returns {boolean}
  */
function mockCheckVisibility(element) {
  if (element.style?.display === "none") {
    return false;
  }
  if (element.parentElement) {
    return mockCheckVisibility(element.parentElement);
  }
  return true;
};
/**
  * @param {HTMLElement} element
  * @returns {boolean}
  */
function isVisible(element) {
  if (getComputedStyle(element).visibility === "hidden") {
    return false;
  }
  if (element.checkVisibility) {
    return element.checkVisibility();
  } else {
    return mockCheckVisibility(element);
  }
}
/**
  * @param {HTMLElement | null | undefined}
  * @returns {boolean}
  */
function existsInvisibly(element) {
  return element && !isVisible(element);
}
/**
  * @param {HTMLElement | null | undefined} element
  * @returns {boolean}
  */
function existsVisibly(element) {
  return element && isVisible(element)
}

/**
  * Judges if self OR a child has the attribute.
  *
  * @param {HTMLElement} containerElement
  * @param {string} key
  * @param {string | undefined} value
  * @param {{ where: (it: HTMLElement) => boolean } | undefined} options
  * @returns {boolean}
  */
function containerContainsAttribute(containerElement, key, value, options) {
  /** @type {HTMLElement | null} */
  let attributeOwner;
  if (value) {
    if (containerElement.getAttribute(key) === value) attributeOwner = containerElement;
    else attributeOwner = containerElement.querySelector(`[${key}="${value}"]`);
  } else {
    if (containerElement.getAttribute(key) !== null) attributeOwner = containerElement;
    else attributeOwner = containerElement.querySelector(`[${key}]`);
  }
  return (attributeOwner !== null) && (options?.where(attributeOwner) || true);
}

/**
  * @typedef {{ type: 'single_text', element: HTMLDivElement } | { type: 'double_texts', first: HTMLDivElement, second: HTMLDivElement } | { type: 'composite_block', element: HTMLDivElement } | { type: 'text_with_list', text: HTMLDivElement, list: HTMLUListElement | HTMLOListElement } | { type: 'text_with_list_and_codetip', text: HTMLDivElement, list: HTMLDivElement, codetip: HTMLDivElement } | { type: 'texts_sandwitch_list', head: HTMLDivElement, list: HTMLUListElement | HTMLOListElement, tail: HTMLDivElement } | { type: 'mixed_in_codeblock', codetag: HTMLElement }} Followup
  */

export class FollowupHandler {
  /** @type {Followup} */
  followup;

  /** @param {Followup} followup */
  constructor(followup) {
    this.followup = followup;
  }

  get textContent() {
    switch (this.followup.type) {
      case "single_text":
        return this.followup.element.textContent;
      case "double_texts":
        return this.followup.first.textContent + this.followup.second.textContent;
      case "composite_block":
        return this.followup.element.textContent;
      case "text_with_list":
        return this.followup.text.textContent + this.followup.list.textContent;
      case "text_with_list_and_codetip":
        return this.followup.text.textContent + this.followup.list.textContent + '[tooltip (code)]';
      case "texts_sandwitch_list":
        return this.followup.head.textContent + this.followup.list.textContent + this.followup.tail.textContent;
      case "mixed_in_codeblock":
        return (this.followup.codetag.textContent
          .split("\n")
          .join("")
          .match(/<FollowUp>(.*)<\/FollowUp>/)?.at(1)
        || "").split("\n").join("").trim();
      default:
        /** @type {never} */ const _ = this.followup.type;
        throw new Error(_);
    }
  }

  /**
    *
    * NOTE: This may be blocked in Chrome.
    *
    * @returns {void}
    */
  dumpElements() {
    switch (this.followup.type) {
      case "single_text":
        console.debug(this.followup.element);
        return;
      case "double_texts":
        console.debug(this.followup.first);
        console.debug(this.followup.second);
      case "composite_block":
        console.debug(this.followup.element);
        return;
      case "text_with_list":
        console.debug(this.followup.text);
        console.debug(this.followup.list);
        return;
      case "text_with_list_and_codetip":
        console.debug(this.followup.text);
        console.debug(this.followup.list);
        console.debug(this.followup.codetip);
        return;
      case "texts_sandwitch_list":
        console.debug(this.followup.head);
        console.debug(this.followup.list);
        console.debug(this.followup.tail);
        return;
      case "mixed_in_codeblock":
        console.debug(this.followup.codetag);
        return;
      default:
        /** @type {never} */ const _ = this.followup.type;
        throw new Error(_);
    }
  }

  /**
    * @returns {void}
    * @throws {Error}
    */
  remove() {
    switch (this.followup.type) {
      case "single_text":
        this.followup.element.style.display = "none";
        return;
      case "double_texts":
        this.followup.first.style.display = "none";
        this.followup.second.style.display = "none";
        return;
      case "composite_block":
        this.followup.element.style.display = "none";
        return;
      case "text_with_list":
        this.followup.text.style.display = "none";
        this.followup.list.style.display = "none";
        return;
      case "text_with_list_and_codetip":
        this.followup.text.style.display = "none";
        this.followup.list.style.display = "none";
        this.followup.codetip.style.display = "none";
        return;
      case "texts_sandwitch_list":
        this.followup.head.style.display = "none";
        this.followup.list.style.display = "none";
        this.followup.tail.style.display = "none";
        return;
      case "mixed_in_codeblock": {
        const codefragments = Array.from(this.followup.codetag.children);
        if (!(codefragments.length > 0 && codefragments.every(isSpan))) {
          console.debug(`codeblock children (${codefragments.length}):`);
          codefragments.forEach(console.debug);
          throw new Error('unexpected codeblock structure');
        }

        const finalspan = codefragments[codefragments.length - 1];
        finalspan.textContent = finalspan.textContent
          .replace(/<FollowUp>.*<\/FollowUp>/s, "")
          .trimEnd();

        let [searchIndex, numRemainingBackquotes] = [codefragments.length - 1, 3];
        while (numRemainingBackquotes > 0) {
          const maybeBackquoteOwner = codefragments[searchIndex];
          if (maybeBackquoteOwner.textContent.trimEnd().endsWith('`')) {
            numRemainingBackquotes -= 1;
            maybeBackquoteOwner.textContent = maybeBackquoteOwner.textContent
              .trimEnd()
              .slice(0, -1);
          } else {
            if (searchIndex === 0) throw new Error('unexpected codeblock contents');
            searchIndex -= 1;
          }
        }

        return;
      }
      default:
        /** @type {never} */ const _ = this.followup.type;
        throw new Error(_);
    }
  }
}

/**
  * @typedef {{ type: 'direct_maincol', element: HTMLDivElement } | { type: 'display_content', element: HTMLDivElement }} AIOverviewContainer
  * @typedef {{ type: 'text', block: HTMLDivElement } | { type: 'heading', block: HTMLDivElement } | { type: 'codeblock', block: HTMLDivElement } | { type: 'mathblock', block: HTMLDivElement } | { type: 'codetip', block: HTMLDivElement } | { type: 'composite', block: HTMLDivElement } | { type: 'blockquote', block: HTMLDivElement } | { type: 'videointroduction', block: HTMLDivElement } | { type: 'list', block: HTMLUListElement | HTMLOListElement } | { type: 'hrline', block: HTMLDivElement }} AIOverviewContentBlock
  */

export class AIOverview {
  /** @type {AIOverviewContainer} */
  container;
  /** @type {AIOverviewContentBlock[]} */
  contentBlocks;

  /**
    * @param {AIOverviewContainer} container
    * @param {AIOverviewContentBlock[]} contentBlocks
    * @returns {AIOverview}
    */
  constructor(container, contentBlocks) {
    this.container = container;
    this.contentBlocks = contentBlocks;
  }

  /**
    * @param {ParentNode} node
    * @returns {HTMLElement | null}
    */
  static #detectReactionButtons(node) {
    return (
      // old style
      node.querySelector('div[data-mcpr] div[data-type="hovc"]') ||
      // new style
      node.querySelector('div[data-ignore-copy] div[role=status]')
    );
  }

  /**
    * @param {ParentNode} node
    * @returns {AIOverviewContainer | null}
    */
  static #detectContainer(node) {
    const overviewLandmark = (
      // old style
      node.querySelector('div[data-mcpr]') ||
      // new style
      node.querySelector('div[data-subtree="aimc"]')
    );
    if (!overviewLandmark) return null;

    const mcprMainCol = overviewLandmark.querySelector('div[data-container-id="main-col"]');
    if (!mcprMainCol) return null;

    if (
      (mcprMainCol.firstElementChild instanceof HTMLDivElement) &&
      mcprMainCol.firstElementChild.style.display === "contents" &&
      (isVisible(mcprMainCol.firstElementChild))
    ) {
      return { type: 'display_content', element: mcprMainCol.firstElementChild };

    } else if (isVisible(mcprMainCol)) {
      return { type: 'direct_maincol', element: mcprMainCol };

    } else {
      return null;
    }
  }

  /**
    * @param {Document} doc
    * @returns {boolean}
    **/
  static streamingIsComplete(doc) {
    return AIOverview.#detectReactionButtons(doc) !== null;
  }

  /**
    *
    * For correct AI overview recognition, this SHOULD be called after
    * `AIOverview.streamingIsComplete` returned `true`.
    *
    * @param {Document} doc
    * @returns {AIOverview | null}
    */
  static fromDocument(doc) {
    /** @type {AIOverviewContentBlock[]} */
    let contentBlocks = [];
    /**
      * @param {Element} block
      * @returns {void}
      */
    const recognizeContentBlock = (block) => {
      if (!isVisible(block)) return;

      if (block.textContent.trim() === "") {
        if (existsVisibly(block.querySelector('hr'))) {
          contentBlocks.push({ type: 'hrline', block });
        } else {
          return;
        }

      } else if (isList(block)) {
        if (
          Array.from(block.children)
            .filter(isVisible)
            .every(x => isDiv(x) && (isSfcCp(x) || isBfc(x) || isDisplayContents(x)))
        ) {
          contentBlocks.push({ type: 'list', block });
        }

      } else if (isDiv(block)) {
        if (isDisplayContents(block)) {
          Array.from(block.children).forEach(recognizeContentBlock);

        } else if (containerContainsAttribute(block, "data-type", "hovc")) {
          return;

        } else if (isSfcCp(block) || isBfc(block)) {
          // priority 1
          if (containerContainsAttribute(block, "role", "heading")) {
            contentBlocks.push({ type: 'heading', block });
          } else if (
            containerContainsAttribute(block, "data-tooltip-id") &&
            existsInvisibly(block.querySelector('pre > code'))
          ) {
            contentBlocks.push({ type: 'codetip', block });

          // priority 2
          // Multiple video items may be listed in one videointroduction
          // using div[role="list"] and div[role="listitem"]s
          } else if (
            existsVisibly(block.querySelector('video')) ||
            existsVisibly(block.querySelector('a[aria-labelledby][href*="youtube.com"]'))
          ) {
            contentBlocks.push({ type: 'videointroduction', block });

          // priority 3
          // Note that the reaction buttons sometimes contains list elements
          } else if ((!AIOverview.#detectReactionButtons(block)) && (
            (block.childElementCount === 1 && isList(block.firstElementChild)) ||
            (containerContainsAttribute(block, "role", "list"))
          )) {
            contentBlocks.push({ type: 'list', block });

          // priority 4
          // Codeblock or blockquote or mathblock can be nestedly used in list item.
          // Only when directly used they should be recognized
          } else if (existsVisibly(block.querySelector('pre > code'))) {
            contentBlocks.push({ type: 'codeblock', block });
          } else if (existsVisibly(block.querySelector('blockquote'))) {
            contentBlocks.push({ type: 'blockquote', block });
          } else if (existsVisibly(block.querySelector('div[style*=block] math'))) {
            contentBlocks.push({ type: 'mathblock', block });

          // priority 5
          } else if (existsVisibly(block.querySelector('ul')) || existsVisibly(block.querySelector('ol'))) {
            contentBlocks.push({ type: 'composite', block });
          } else if (!AIOverview.#detectReactionButtons(block)) {
            contentBlocks.push({ type: 'text', block });
          }
        }
      }
    };

    const container = AIOverview.#detectContainer(doc);
    if (container === null) return null;

    for (const block of container.element.children) {
      recognizeContentBlock(block);
    }
    return new AIOverview(container, contentBlocks);
  }

  dumpBlocks() {
    console.debug(`AI overview contents (${this.contentBlocks.length}):`);
    for (const contentBlock of this.contentBlocks) {
      console.debug(`type: ${contentBlock.type}`)
      console.debug(contentBlock.block)
    }
  }

  /** @returns {Followup | null} */
  detectFollowup() {
    const last4 = this.contentBlocks.at(-4);
    const last3 = this.contentBlocks.at(-3);
    const last2 = this.contentBlocks.at(-2);
    const last1 = this.contentBlocks.at(-1);

    if (
       last1?.type === 'codeblock' &&
       /<FollowUp>.*<\/FollowUp>/s.test(last1.block.querySelector('code').textContent)
    ) {
      return {
        type: 'mixed_in_codeblock',
        codetag: last1.block.querySelector('code'),
      };

    } else if (
      last2?.type === 'text' &&
      last1?.type === 'list'
    ) {
      return {
        type: 'text_with_list',
        text: last2.block,
        list: last1.block,
      };

    } else if (
      last3?.type === 'text' &&
      last2?.type === 'list' &&
      last1?.type === 'codetip'
    ) {
      return {
        type: 'text_with_list_and_codetip',
        text: last3.block,
        list: last2.block,
        codetip: last1.block,
      };

    } else if (
      (last4?.type !== 'heading') &&
      last3?.type === 'text' &&
      last2?.type === 'list' &&
      last1?.type === 'text'
    ) {
      return {
        type: 'texts_sandwitch_list',
        head: last3.block,
        list: last2.block,
        tail: last1.block,
      };

    } else if (
      (last2?.type !== 'heading') &&
      last1?.type === 'composite'
    ) {
      return {
        type: 'composite_block',
        element: last1.block,
      };

    } else if (
      last3?.type === 'hrline' &&
      last2?.type === 'text' &&
      last1?.type === 'text'
    ) {
      return {
        type: 'double_texts',
        first: last2.block,
        second: last1.block,
      };

    } else if (
      (last2?.type !== 'heading') &&
      last1?.type === 'text'
    ) {
      return {
        type: 'single_text',
        element: last1.block,
      };

    } else {
      return null;
    }
  }
}

const mo = new MutationObserver(() => {
  if (!AIOverview.streamingIsComplete(document)) return;

  const ao = AIOverview.fromDocument(document);
  if (ao === null) {
    console.debug(`[forbid-google-ai-followup] AI overview seems not generated`);
    mo.disconnect();
    return;
  }
  console.debug(`[forbid-google-ai-followup] found AI overview with ${ao.contentBlocks.length} blocks in ${ao.container.type} container`);

  const f = ao.detectFollowup();
  if (f === null) {
    console.debug(`[forbid-google-ai-followup] AI overview seems not containing followup`);
    ao.dumpBlocks();
    mo.disconnect();
    return;
  }
  console.debug(`[forbid-google-ai-followup] detected ${f.type}-style followup`);

  const fh = new FollowupHandler(f);
  fh.dumpElements();

  try {
    fh.remove();
  } catch (err) {
    console.error(`[forbid-google-ai-followup] error on removal: ${err}`);
  }
  console.log(`[forbid-google-ai-followup] removed: "${fh.textContent}"`);

  mo.disconnect();
});

const startObservation = () => {
  if (!document.body) {
    return requestAnimationFrame(startObservation);
  }
  mo.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

startObservation();
