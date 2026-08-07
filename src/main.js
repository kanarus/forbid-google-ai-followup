/**
  * @param {number} delayMS
  * @param {() => void} fn
  * @returns {() => void}
  */
const debouncedFnByMS = (delayMS, fn) => {
  let timeoutID;
  return () => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(fn, delayMS);
  };
}

/**
  * @param {Element} element
  * @returns {element is HTMLDivElement}
  */
function isDiv(element) {
  return element.tagName.toLowerCase() === "div";
}
/**
  * @param {Element} element
  * @returns {element is HTMLUListElement}
  */
function isUl(element) {
  return element.tagName.toLowerCase() === "ul";
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
  * @typedef {{ type: 'single_text', container: HTMLDivElement } | { type: 'text_with_list', text: HTMLDivElement, list: HTMLUListElement } | { type: 'texts_sandwitch_list', head: HTMLDivElement, list: HTMLUListElement, tail: HTMLDivElement }} Followup
  */

class FollowupHandler {
  /** @type {Followup} */
  followup;

  /** @param {Followup} followup */
  constructor(followup) {
    this.followup = followup;
  }

  get textContent() {
    switch (this.followup.type) {
      case "single_text":
        return this.followup.container.textContent;
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
    * NOTE: Maybe blocked in Chrome.
    *
    * @returns {void}
    */
  dumpElements() {
    switch (this.followup.type) {
      case "single_text":
        console.debug(this.followup.container);
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

  /**
    * @returns {void}
    */
  removeElements() {
    switch (this.followup.type) {
      case "single_text":
        this.followup.container.style.display = "none";
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
  * @typedef {{ type: 'introduction', container: HTMLDivElement } | { type: 'text', container: HTMLDivElement } | { type: 'heading', container: HTMLDivElement } | { type: 'codesnippet', container: HTMLDivElement } | { type: 'list', container: HTMLUListElement }} AIOverviewContentBlock
  */

class AIOverview {
  /** @type {AIOverviewContentBlock[]} */
  contentBlocks;

  /** @returns {AIOverview | null} */
  static fromDocument() {
    const mcpr_main_col = 'div[data-mcpr] div[data-container-id="main-col"]';
    const display_contents = 'div[style="display: contents"]';

    const overviewContainer =
      document.querySelector(`${mcpr_main_col} > ${display_contents}`) ||
      document.querySelector(`${mcpr_main_col}`);
    if (overviewContainer === null) {
      return null;
    }

    /** @type {AIOverviewContentBlock[]} */
    let contentBlocks = [];
    for (const c of overviewContainer.children) {
      if (isInvisible(c)) continue;

      if (isDiv(c)) {
        if (isSfcCp(c)) {
          contentBlocks.push({ type: 'introduction', container: c });

        } else if (isBfc(c) && (
          c.getAttribute("role") === "heading" ||
          c.querySelector('div[role="heading"]') !== null)
        ) {
          contentBlocks.push({ type: 'heading', container: c });

        } else if (isBfc(c) && c.querySelector('pre > code') !== null) {
          contentBlocks.push({ type: 'codesnippet', container: c });

        } else if (isBfc(c)) {
          contentBlocks.push({ type: 'text', container: c });
        }

      } else if (isUl(c)) {
        if (Array.from(c.children).every(x => isDiv(x) && isBfc(x))) {
          contentBlocks.push({ type: 'list', container: c });
        }
      }
    }

    const ao = new AIOverview();
    ao.contentBlocks = contentBlocks;
    return ao;
  }

  /**
    * @returns {Followup | null}
    */
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
      last1?.type === 'text'
    ) {
      return {
        type: 'single_text',
        container: last1.container,
      };

    } else {
      return null;
    }
  }
}

const mo = new MutationObserver(debouncedFnByMS(250, () => {
  const ao = AIOverview.fromDocument();
  if (ao === null) return;

  const f = ao.detectFollowup();
  if (f === null) return;
  console.debug(`[forbid-google-ai-followup] detected ${f.type}-style followup`);

  const fh = new FollowupHandler(f);
  fh.dumpElements();
  fh.removeElements();
  console.log(`[forbid-google-ai-followup] removed: "${fh.textContent}"`);

  mo.disconnect();
  console.debug('[forbid-google-ai-foloowup] successfully disconnected');
}));

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
