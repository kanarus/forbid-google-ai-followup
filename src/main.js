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
  * @typedef {'folded' | 'directlyfolded' | 'expanded' | 'directlyexpanded'} FollowupContainerForm
  */

/** @type {[FollowupContainerForm, FollowupContainerForm, FollowupContainerForm, FollowupContainerForm]} */
const FOLLOWUP_CONTAINER_FORMS = ['folded', 'directlyfolded', 'expanded', 'directlyexpanded'];

/**
  * @typedef {{ type: 'single_container', container: HTMLDivElement } | { type: 'trailing_outer_list', container: HTMLDivElement, list: HTMLUListElement } | { type: 'sandwitch_outer_list', head: HTMLDivElement, list: HTMLUListElement, tail: HTMLDivElement }} FollowupEnum
  */

class Followup {
  /** @type {FollowupEnum} */
  value;

  /** @param {FollowupEnum} value */
  constructor(value) {
    this.value = value;
  }

  /**
    * @param {FollowupContainerForm} form
    * @returns {string}
    */
  static #followupContainerSelector(form) {
    const mcpr_main_col = 'div[data-mcpr] div[data-container-id="main-col"]';
    const display_contents = 'div[style="display: contents"]';
    const folded_followup_candidates = 'div[data-bfc=""][ahbak="true"]';
    const expanded_followup_candidates = 'div[data-bfc=""][class=""]';

    switch (form) {
      case "folded":
        return `${mcpr_main_col} > ${display_contents} > ${folded_followup_candidates}`;
      case "directlyfolded":
        return `${mcpr_main_col} > ${folded_followup_candidates}`;
      case "expanded":
        return `${mcpr_main_col} > ${display_contents} > ${expanded_followup_candidates}`;
      case "directlyexpanded":
        return `${mcpr_main_col} > ${expanded_followup_candidates}`;
      default:
        /** @type {never} */ const _ = form;
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
      it.getAttribute() === "div" &&
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
    * @param {FollowupContainerForm} form
    * @returns {Followup | null}
    */
  static detect(form) {
    const lastMatch = queryLastMatch(Followup.#followupContainerSelector(form));
    if (lastMatch === null) {
      return null;
    }

    if (Followup.#isFollowupList(lastMatch.nextElementSibling)) {
      return new Followup({
        type: 'trailing_outer_list',
        container: lastMatch,
        list: lastMatch.nextElementSibling,
      });

    } else if (
      Followup.#isFollowupList(lastMatch.previousElementSibling) &&
      Followup.#isFollowupContainer(lastMatch.previousElementSibling.previousElementSibling)
    ) {
      return new Followup({
        type: 'sandwitch_outer_list',
        head: lastMatch.previousElementSibling.previousElementSibling,
        list: lastMatch.previousElementSibling,
        tail: lastMatch,
      });

    } else {
      return new Followup({
        type: 'single_container',
        container: lastMatch,
      });
    }
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
  FOLLOWUP_CONTAINER_FORMS.forEach((form) => {
    if (DONE) return;

    const followup = Followup.detect(form);
    if (followup === null) return;

    console.debug(`[forbid-google-ai-followup] detected: ${form}${followup.outerList ? ' with outer list' : ''})`);
    followup.debuglog();
    
    followup.remove();
    console.log(`[forbid-google-ai-followup] removed: "${followup.textContent}"`);

    DONE = true;
    observer.disconnect();
    console.debug('[forbid-google-ai-foloowup] successfully disconnected');
  });
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
