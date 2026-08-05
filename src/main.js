/**
  * @param {NodeListOf<Element>} elements
  * @returns {boolean}
  */
function areSiblings(elements) {
  if (elements.length === 0) {
    return true;
  }
  
  const parent = elements.item(0).parentElement;
  for (let i = 0; i < elements.length; i++) {
    if (parent !== elements.item(i).parentElement) {
      return false;
    }
  }
  return true;
}

let DONE = false;

const observer = new MutationObserver(() => {
  Object.entries({
    'folded':
      'div[data-container-id="main-col"]>div[style="display: contents"]>div[data-bfc=""][ahbak="true"]',
    'directlyfolded':
      'div[data-container-id="main-col"]>div[data-bfc=""][ahbak="true"]',
    'expanded':
      'div[data-container-id="main-col"]>div[style="display: contents"]>div[data-bfc=""][class=""]',
    'directlyexpanded':
      'div[data-container-id="main-col"]>div[data-bfc=""][class=""]',
  }).forEach(
    ([category, selector]) => {
      const candidates = document.querySelectorAll(selector);

      if (DONE || candidates.length === 0) {
        // Nothing to process; logging here is annoying as it's repeated on every DOM mutation
        return;
      }
      if (!areSiblings(candidates)) {
        console.error('[forbid-google-ai-followup]'
          + ` error (${category}): unexpectedly invalid selector`
        );
        return;
      }

      const followup = candidates.item(candidates.length - 1);
      followup.style.display = "none";
      console.log('[forbid-google-ai-followup]'
        + ` followup removed (${category}): "${followup.textContent}"`
        + ' (corresponded element may be shown below)'
      );
      console.debug(followup); // This may be blocked in Chrome
      DONE = true;
    }
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
