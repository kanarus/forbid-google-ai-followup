function log(msg) {
  console.log(`[forbid-google-ai-followup] ${msg}`);
}

/**
  * @type {Recoed<string, string>} RemovalLog
  *
  * `phase`-`kind` mapping of already-removed followups
  */
const RemovalLog = {};

/**
  * @param {string} phase
  * @param {NodeListOf<Element>} candidates
  * @returns {boolean}
  */
function detectAndRemoveFollowupFromCandidates(phase, candidates) {
  if (typeof RemovalLog[phase] === 'string' || candidates.length == 0) {
    return false;
  }

  const len = candidates.length;
  const parent = candidates.item(0).parentNode;
  for (let i = 1; i < len; i++) {
    if (candidates.item(i).parentNode != parent) {
      log(`error (candidates are not siblings, phase: ${phase})`);
      return false;
    }
  }

  /** @type {'single' | 'holding-list' | 'last-one'} kind */
  let KIND;
  if (len == 1) {
    KIND = 'single';
    console.debug(candidates.item(0));
    candidates.item(0).style.display = 'none';
    RemovalLog[phase] = KIND;
    log(`removed (kind: ${KIND}, phase: ${phase})`);
  } else {
    const [preLast, last] = [candidates.item(len - 2), candidates.item(len - 1)];
    const isHoldingList = (/* preLast -> ul -> last */
      preLast.nextElementSibling.tagName.toLowerCase() === 'ul' &&
      preLast.nextElementSibling.nextElementSibling === last
    );
    if (isHoldingList) {
      KIND = 'holding-list';
      console.debug([
        preLast,
        preLast.nextElementSibling,
        preLast.nextElementSibling.nextElementSibling,
      ]);
      preLast.style.display = 'none';
      preLast.nextElementSibling.style.display = 'none';
      preLast.nextElementSibling.nextElementSibling.style.display = 'none';
      RemovalLog[phase] = KIND;
      log(`removed (kind: ${KIND}, phase: ${phase})`);
    } else {
      KIND = 'last-one';
      console.debug(last);
      last.style.display = 'none';
      RemovalLog[phase] = KIND;
      log(`removed (kind: ${KIND}, phase: ${phase})`, last);
    }
  }
  return true;
}

/**
  * @param {string} phase
  * @param {string[]} selector
  * @returns {void}
  */
function detectAndRemoveFollowupBy(phase, selectors) {
  for (const selector of selectors) {
    const candidates = document.querySelectorAll(selector);
    if (detectAndRemoveFollowupFromCandidates(phase, candidates)) {
      log(`hit by selector '${selector}'`);
      return;
    }
  }
}

const observer = new MutationObserver(() => {
  Object.entries({
    'folded-search-overview': [
      'div[style="display: contents"]>div[data-bfc=""][ahbak="true"]',
    ],
    'expanded-search-overview': [
      'div[style="display: contents"]>div[data-bfc=""][class=""]',
      'div[data-container-id="main-col"]>div[data-bfc=""]',
    ],
  }).forEach(
    ([phase, selectors]) => detectAndRemoveFollowupBy(phase, selectors)
  );
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
