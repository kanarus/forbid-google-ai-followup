/**
  * @param {string} selector
  * @returns {Element | null}
  */
function queryLastMatch(selector) {
  const candidates = document.querySelectorAll(selector);
  return candidates.length > 0
    ? candidates.item(candidates.length - 1)
    : null;
}

/**
  * @param {Element} element
  * @returns {Element | null}
  */
function nextVisibleElementSibling(element) {
  let cur = element.nextElementSibling;
  while (true) {
    if (cur === null) return null;
    if (cur.style.display !== "none") return cur;
    cur = cur.nextElementSibling;
  }
}
/**
  * @param {Element} element
  * @returns {Element | null}
  */
function previousVisibleElementSibling(element) {
  let cur = element.previousElementSibling;
  while (true) {
    if (cur === null) return null;
    if (cur.style.display !== "none") return cur;
    cur = cur.previousElementSibling;
  }
}

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
  * @typedef {'folded' | 'directlyfolded' | 'expanded' | 'directlyexpanded'} OverviewState
  */

/** @type {[OverviewState, OverviewState, OverviewState, OverviewState]} */
const OVERVIEW_STATES = ['folded', 'directlyfolded', 'expanded', 'directlyexpanded'];

/**
  * @typedef {{ type: 'single_container', container: HTMLDivElement } | { type: 'trailing_outer_list', container: HTMLDivElement, list: HTMLUListElement } | { type: 'sandwitch_outer_list', head: HTMLDivElement, list: HTMLUListElement, tail: HTMLDivElement }} Followup
  */

class FollowupHandle {
  /** @type {OverviewState} */
  overviewState;
  /** @type {Followup} */
  followup;

  /**
    * @param {OverviewState} overviewState
    * @param {Followup} followup
    */
  constructor(overviewState, followup) {
    this.overviewState = overviewState;
    this.followup = followup;
  }

  /**
    * @param {OverviewState} os
    * @returns {string}
    */
  static #followupContainerCandidatesSelector(os) {
    const mcpr_main_col = 'div[data-mcpr] div[data-container-id="main-col"]';
    const display_contents = 'div[style="display: contents"]';
    const folded_followup_candidates = 'div[data-bfc=""][ahbak="true"]';
    const expanded_followup_candidates = 'div[data-bfc=""][class=""]';

    switch (os) {
      case "folded":
        return `${mcpr_main_col} > ${display_contents} > ${folded_followup_candidates}`;
      case "directlyfolded":
        return `${mcpr_main_col} > ${folded_followup_candidates}`;
      case "expanded":
        return `${mcpr_main_col} > ${display_contents} > ${expanded_followup_candidates}`;
      case "directlyexpanded":
        return `${mcpr_main_col} > ${expanded_followup_candidates}`;
      default:
        /** @type {never} */ const _ = os;
        throw Error(_);
    }
  }

  /**
    * @param {Element | null} element
    * @returns {boolean}
    */
  static #canBeFollowupContainer(element) {
    return (
      element !== null &&
      element.tagName.toLowerCase() === "div" &&
      element.getAttribute("data-bfc") === "" &&
      (element.getAttribute("ahbak") === "true" || element.getAttribute("class") === "") &&
      !(FollowupHandle.#isHeadingContainer(element)) &&
      !(FollowupHandle.#isCodeBlockContainer(element))
    );
  }

  /**
    * @param {Element | null} element
    * @returns {boolean}
    */
  static #isOuterList(element) {
    return (
      element !== null &&
      element.tagName.toLowerCase() === "ul" &&
      Array.from(element.children).every(it =>
        it.tagName.toLowerCase() === "div" &&
        it.getAttribute("data-bfc") === ""
      )
    );
  }

  /**
    * @param {Element | null} element
    * @returns {boolean}
    */
  static #isHeadingContainer(element) {
    return (
      element !== null &&
      element.tagName.toLowerCase() === "div" &&
      element.querySelector('div[role="heading"]') !== null
    );
  }

  /**
    * @param {Element | null} element
    * @returns {boolean}
    */
  static #isCodeBlockContainer(element) {
    return (
      element !== null &&
      element.tagName.toLowerCase() === "div" &&
      element.querySelector('pre > code') !== null
    );
  }

  /**
    * @param {OverviewState} os
    * @returns {FollowupHandle | null}
    */
  static fromDocumentWhere(os) {
    const lastMatch = queryLastMatch(FollowupHandle.#followupContainerCandidatesSelector(os));
    if (lastMatch === null) {
      return null;
    }

    const nextVES = nextVisibleElementSibling(lastMatch);
    const prevVES = previousVisibleElementSibling(lastMatch);
    const prevPrevVES = previousVisibleElementSibling(prevVES);
    const prevPrevPrevVES = previousVisibleElementSibling(prevPrevVES);
    if (FollowupHandle.#isOuterList(nextVES)) {
      return new FollowupHandle(os, {
        type: 'trailing_outer_list',
        container: lastMatch,
        list: nextVES,
      });
    } else if (
      FollowupHandle.#isOuterList(prevVES) &&
      FollowupHandle.#canBeFollowupContainer(prevPrevVES) &&
      !(FollowupHandle.#isHeadingContainer(prevPrevPrevVES) || FollowupHandle.#isCodeBlockContainer(prevPrevPrevVES))
      // If `prevPrevPrevVES` is a heading container,
      // it means the DOM structure is actually:
      //
      // ```md
      // ### prevPrevPrevVES
      //
      // prevPrevVES
      //
      // - prevVES
      // - prevVES
      //
      // lastMatch
      // ```
      //
      // then only `lastMatch` will be the followup part,
      // while others are components of a essential overview section.
      //
      // Or, similar for case if `prevPrevPrevVES` is a code block container.
    ) {
      return new FollowupHandle(os, {
        type: 'sandwitch_outer_list',
        head: prevPrevVES,
        list: prevVES,
        tail: lastMatch,
      });
    } else {
      return new FollowupHandle(os, {
        type: 'single_container',
        container: lastMatch,
      });
    }
  }

  /**
    * @returns {FollowupHandle | null}
    */
  static fromDocument() {
    for (const os of OVERVIEW_STATES) {
      const fh = FollowupHandle.fromDocumentWhere(os);
      if (fh !== null) return fh;
    }
    return null;
  }

  /**
    * NOTE: Maybe blocked in Chrome.
    * @returns {void}
    */
  dumpElements() {
    switch (this.followup.type) {
      case "single_container":
        console.debug(this.followup.container);
        return;
      case "trailing_outer_list":
        console.debug(this.followup.container);
        console.debug(this.followup.list);
        return;
      case "sandwitch_outer_list":
        console.debug(this.followup.head);
        console.debug(this.followup.list);
        console.debug(this.followup.tail);
        return;
      default:
        /** @type {never} */ const _ = this.followup.type;
        throw Error(_);
    }
  }

  /**
    * @returns {void}
    */
  removeFollowup() {
    switch (this.followup.type) {
      case "single_container":
        this.followup.container.style.display = "none";
        return;
      case "trailing_outer_list":
        this.followup.container.style.display = "none";
        this.followup.list.style.display = "none";
        return;
      case "sandwitch_outer_list":
        this.followup.head.style.display = "none";
        this.followup.list.style.display = "none";
        this.followup.tail.style.display = "none";
        return;
      default:
        /** @type {never} */ const _ = this.followup.type;
        throw Error(_);
    }
  }

  /**
    * @returns {string}
    */
  get textContent() {
    switch (this.followup.type) {
      case "single_container":
        return this.followup.container.textContent;
      case "trailing_outer_list":
        return this.followup.container.textContent + this.followup.list.textContent;
      case "sandwitch_outer_list":
        return this.followup.head.textContent + this.followup.list.textContent + this.followup.tail.textContent;
      default:
        /** @type {never} */ const _ = this.followup.type;
        throw Error(_);
    }
  }
}

let DONE = false;

const mo = new MutationObserver(debouncedFnByMS(250, () => {
  if (DONE) return;

  const fh = FollowupHandle.fromDocument();
  if (fh === null) return;

  console.debug(`[forbid-google-ai-followup] detected: ${fh.overviewState} ${fh.followup.type}`);
  fh.dumpElements();
  
  fh.removeFollowup();
  console.log(`[forbid-google-ai-followup] removed: "${fh.textContent}"`);

  DONE = true;
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
