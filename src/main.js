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
  * @typedef {'folded' | 'directlyfolded' | 'expanded' | 'directlyexpanded'} FollowupState
  */

/** @type {[FollowupState, FollowupState, FollowupState, FollowupState]} */
const FOLLOWUP_STATES = ['folded', 'directlyfolded', 'expanded', 'directlyexpanded'];

/**
  * @typedef {{ type: 'single_container', container: HTMLDivElement } | { type: 'trailing_outer_list', container: HTMLDivElement, list: HTMLUListElement } | { type: 'sandwitch_outer_list', head: HTMLDivElement, list: HTMLUListElement, tail: HTMLDivElement }} FollowupEnum
  */

class Followup {
  /** @type {FollowupState} */
  state;
  /** @type {FollowupEnum} */
  value;

  /**
    * @param {FollowupState} state
    * @param {FollowupEnum} value
    */
  constructor(state, value) {
    this.state = state;
    this.value = value;
  }

  /**
    * @param {FollowupState} state
    * @returns {string}
    */
  static #followupContainerSelector(state) {
    const mcpr_main_col = 'div[data-mcpr] div[data-container-id="main-col"]';
    const display_contents = 'div[style="display: contents"]';
    const folded_followup_candidates = 'div[data-bfc=""][ahbak="true"]';
    const expanded_followup_candidates = 'div[data-bfc=""][class=""]';

    switch (state) {
      case "folded":
        return `${mcpr_main_col} > ${display_contents} > ${folded_followup_candidates}`;
      case "directlyfolded":
        return `${mcpr_main_col} > ${folded_followup_candidates}`;
      case "expanded":
        return `${mcpr_main_col} > ${display_contents} > ${expanded_followup_candidates}`;
      case "directlyexpanded":
        return `${mcpr_main_col} > ${expanded_followup_candidates}`;
      default:
        /** @type {never} */ const _ = state;
        throw Error(_);
    }
  }

  /**
    * @param {Element | null} maybeFollowupContainer
    * @returns {boolean}
    */
  static #isFollowupContainer(maybeFollowupContainer) {
    const it = maybeFollowupContainer;
    return (
      it !== null &&
      it.tagName.toLowerCase() === "div" &&
      it.getAttribute("data-bfc") === "" &&
      (it.getAttribute("ahbak") || it.getAttribute("class")) === ""
    );
  }

  /**
    * @param {Element | null} maybeFollowupList
    * @returns {boolean}
    */
  static #isFollowupList(maybeFollowupList) {
    return (
      maybeFollowupList !== null &&
      maybeFollowupList.tagName.toLowerCase() === "ul" &&
      Array.from(maybeFollowupList.children).every((c) => Followup.#isFollowupContainer(c))
    );
  }

  /**
    * @param {FollowupState} state
    * @returns {Followup | null}
    */
  static detectWhere(state) {
    const lastMatch = queryLastMatch(Followup.#followupContainerSelector(state));
    if (lastMatch === null) {
      return null;
    }

    const nextVES = nextVisibleElementSibling(lastMatch);
    const prevVES = previousVisibleElementSibling(lastMatch);
    const prevPrevVES = previousVisibleElementSibling(previousVisibleElementSibling(lastMatch));
    if (Followup.#isFollowupList(nextVES)) {
      return new Followup(state, {
        type: 'trailing_outer_list',
        container: lastMatch,
        list: nextVES,
      });

    } else if (Followup.#isFollowupList(prevVES) && Followup.#isFollowupContainer(prevPrevVES)) {
      return new Followup(state, {
        type: 'sandwitch_outer_list',
        head: prevPrevVES,
        list: prevVES,
        tail: lastMatch,
      });

    } else {
      return new Followup(state, {
        type: 'single_container',
        container: lastMatch,
      });
    }
  }

  /**
    * @returns {Followup | null}
    */
  static detect() {
    for (const state of FOLLOWUP_STATES) {
      const dw = Followup.detectWhere(state);
      if (dw !== null) return dw;
    }
    return null;
  }

  /**
    * NOTE: Maybe blocked in Chrome.
    * @returns {void}
    */
  debuglog() {
    switch (this.value.type) {
      case "single_container":
        console.debug(this.value.container);
        return;
      case "trailing_outer_list":
        console.debug(this.value.container);
        console.debug(this.value.list);
        return;
      case "sandwitch_outer_list":
        console.debug(this.value.head);
        console.debug(this.value.list);
        console.debug(this.value.tail);
        return;
      default:
        /** @type {never} */ const _ = this.value.type;
        throw Error(_);
    }
  }

  /**
    * @returns {void}
    */
  remove() {
    switch (this.value.type) {
      case "single_container":
        this.value.container.style.display = "none";
        return;
      case "trailing_outer_list":
        this.value.container.style.display = "none";
        this.value.list.style.display = "none";
        return;
      case "sandwitch_outer_list":
        this.value.head.style.display = "none";
        this.value.list.style.display = "none";
        this.value.tail.style.display = "none";
        return;
      default:
        /** @type {never} */ const _ = this.value.type;
        throw Error(_);
    }
  }

  /**
    * @returns {string}
    */
  get textContent() {
    switch (this.value.type) {
      case "single_container":
        return this.value.container.textContent;
      case "trailing_outer_list":
        return this.value.container.textContent + this.value.list.textContent;
      case "sandwitch_outer_list":
        return this.value.head.textContent + this.value.list.textContent + this.value.tail.textContent;
      default:
        /** @type {never} */ const _ = this.value.type;
        throw Error(_);
    }
  }
}

let DONE = false;

const observer = new MutationObserver(() => {
  if (DONE) return;

  const followup = Followup.detect();
  if (followup === null) return;

  console.debug(`[forbid-google-ai-followup] detected: ${followup.state} ${followup.value.type}`);
  followup.debuglog();
  
  followup.remove();
  console.log(`[forbid-google-ai-followup] removed: "${followup.textContent}"`);

  DONE = true;
  observer.disconnect();
  console.debug('[forbid-google-ai-foloowup] successfully disconnected');
});

const startObservation = () => {
  if (!document.body) {
    return requestAnimationFrame(startObservation);
  }
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

startObservation();
