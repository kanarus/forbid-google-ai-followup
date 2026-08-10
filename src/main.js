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
function isInvisible(element) {
  if (element.style.display === "none") {
    return true;
  }
  if (element.textContent.trim() === "") {
    return true;
  }
  return false;
}

/**
  * @param {HTMLElement} containerElement
  * @param {string} key
  * @param {string | undefined} value
  * @returns {boolean}
  */
function containsAttributeAsContainer(containerElement, key, value) {
  return (
    containerElement.getAttribute(key) === (value || "") ||
    containerElement.querySelector(`[${key}="${value}"]`) !== null
  );
}

/**
  * @typedef {{ type: 'single_text', element: HTMLDivElement } | { type: 'composite_block', element: HTMLDivElement } | { type: 'text_with_list', text: HTMLDivElement, list: HTMLUListElement | HTMLOListElement } | { type: 'texts_sandwitch_list', head: HTMLDivElement, list: HTMLUListElement | HTMLOListElement, tail: HTMLDivElement }} Followup
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
      case "composite_block":
        return this.followup.element.textContent;
      case "text_with_list":
        return this.followup.text.textContent + this.followup.list.textContent;
      case "texts_sandwitch_list":
        return this.followup.head.textContent + this.followup.list.textContent + this.followup.tail.textContent;
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
      case "composite_block":
        console.debug(this.followup.element);
        return;
      case "text_with_list":
        console.debug(this.followup.text);
        console.debug(this.followup.list);
        return;
      case "texts_sandwitch_list":
        console.debug(this.followup.head);
        console.debug(this.followup.list);
        console.debug(this.followup.tail);
        return;
      default:
        /** @type {never} */ const _ = this.followup.type;
        throw new Error(_);
    }
  }

  /** @returns {void} */
  removeElements() {
    switch (this.followup.type) {
      case "single_text":
        this.followup.element.style.display = "none";
        return;
      case "composite_block":
        this.followup.element.style.display = "none";
        return;
      case "text_with_list":
        this.followup.text.style.display = "none";
        this.followup.list.style.display = "none";
        return;
      case "texts_sandwitch_list":
        this.followup.head.style.display = "none";
        this.followup.list.style.display = "none";
        this.followup.tail.style.display = "none";
        return;
      default:
        /** @type {never} */ const _ = this.followup.type;
        throw new Error(_);
    }
  }
}

/**
  * @typedef {{ type: 'direct_maincol', element: HTMLDivElement } | { type: 'display_content', element: HTMLDivElement }} AIOverviewContainer
  * @typedef {{ type: 'text', container: HTMLDivElement } | { type: 'heading', container: HTMLDivElement } | { type: 'codesnippet', container: HTMLDivElement } | { type: 'composite', container: HTMLDivElement } | { type: 'blockquote', container: HTMLDivElement } | { type: 'list', container: HTMLUListElement | HTMLOListElement }} AIOverviewContentBlock
  */

export class AIOverview {
  /** @type {AIOverviewContainer} */
  overviewContainer;
  /** @type {AIOverviewContentBlock[]} */
  contentBlocks;

  /**
    * @param {AIOverviewContainer} overviewContainer
    * @param {AIOverviewContentBlock[]} contentBlocks
    * @returns {AIOverview}
    */
  constructor(overviewContainer, contentBlocks) {
    this.overviewContainer = overviewContainer;
    this.contentBlocks = contentBlocks;
  }

  /** @returns {boolean} */
  static streamingIsComplete() {
    return document.querySelector('div[data-mcpr] div[data-type="hovc"]') !== null;
  }

  /**
    * @param {Document} doc
    * @returns {AIOverviewContainer | null}
    */
  static #detectContainerFromDocument(doc) {
    const mcprMainCol = doc.querySelector('div[data-mcpr] div[data-container-id="main-col"]');
    if (mcprMainCol === null) return null;

    if (
      (mcprMainCol.firstElementChild instanceof HTMLDivElement) &&
      mcprMainCol.firstElementChild.style.display === "contents" &&
      (!isInvisible(mcprMainCol.firstElementChild))
    ) {
      return { type: 'display_content', element: mcprMainCol.firstElementChild };

    } else if (!isInvisible(mcprMainCol)) {
      return { type: 'direct_maincol', element: mcprMainCol };

    } else {
      return null;
    }
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
    const overviewContainer = AIOverview.#detectContainerFromDocument(doc);
    if (overviewContainer === null) {
      return null;
    }

    /** @type {AIOverviewContentBlock[]} */
    let contentBlocks = [];
    /**
      * @param {Element} container
      * @returns {void}
      */
    const recognizeContentBlock = (container) => {
      if (isInvisible(container)) return;

      if (isDiv(container)) {
        if (isDisplayContents(container)) {
          Array.from(container.children).forEach(recognizeContentBlock);

        } else if (container.querySelector('[data-viewer-group]') !== null) {
          return;

        } else if (containsAttributeAsContainer(container, "data-type", "hovc")) {
          return;

        } else if (isSfcCp(container) || isBfc(container)) {
          if (containsAttributeAsContainer(container, "role", "heading")) {
            contentBlocks.push({ type: 'heading', container });

          } else if (container.querySelector('pre > code') !== null) {
            contentBlocks.push({ type: 'codesnippet', container });

          } else if (container.querySelector('blockquote') !== null) {
            contentBlocks.push({ type: 'blockquote', container });

          } else if (container.querySelector('ul') !== null || container.querySelector('ol') !== null) {
            contentBlocks.push({ type: 'composite', container });

          } else {
            contentBlocks.push({ type: 'text', container });
          }
        }

      } else if (isList(container)) {
        if (
          Array.from(container.children)
            .filter(x => !isInvisible(x))
            .every(x => isDiv(x) && (isSfcCp(x) || isBfc(x) || isDisplayContents(x)))
        ) {
          contentBlocks.push({ type: 'list', container });
        }
      }
    };

    for (const container of overviewContainer.element.children) {
      recognizeContentBlock(container);
    }

    return new AIOverview(overviewContainer, contentBlocks);
  }

  dumpBlocks() {
    console.debug(`AI overview contents (${this.contentBlocks.length}):`);
    for (const contentBlock of this.contentBlocks) {
      console.debug(`type: ${contentBlock.type}`)
      console.debug(contentBlock.container)
    }
  }

  /** @returns {Followup | null} */
  detectFollowup() {
    const last4 = this.contentBlocks.at(-4);
    const last3 = this.contentBlocks.at(-3);
    const last2 = this.contentBlocks.at(-2);
    const last1 = this.contentBlocks.at(-1);

    if (
      last2?.type === 'text' &&
      last1?.type === 'list'
    ) {
      return {
        type: 'text_with_list',
        text: last2.container,
        list: last1.container,
      };

    } else if (
      (last4?.type !== 'heading') &&
      last3?.type === 'text' &&
      last2?.type === 'list' &&
      last1?.type === 'text'
    ) {
      return {
        type: 'texts_sandwitch_list',
        head: last3.container,
        list: last2.container,
        tail: last1.container,
      };

    } else if (
      (last2?.type !== 'heading') &&
      last1?.type === 'composite'
    ) {
      return {
        type: 'composite_block',
        element: last1.container,
      };

    } else if (
      (last2?.type !== 'heading') &&
      last1?.type === 'text'
    ) {
      return {
        type: 'single_text',
        element: last1.container,
      };

    } else {
      return null;
    }
  }
}

const mo = new MutationObserver(() => {
  if (!AIOverview.streamingIsComplete()) return;

  const ao = AIOverview.fromDocument(document);
  if (ao === null) {
    console.debug(`[forbid-google-ai-followup] AI overview seems not generated`);
    mo.disconnect();
    return;
  }
  console.debug(`[forbid-google-ai-followup] found AI overview with ${ao.contentBlocks.length} blocks in ${ao.overviewContainer.type} container`);

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
  fh.removeElements();
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
