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

let DONE = false;

const observer = new MutationObserver(() => {
  const mcpr_main_col = 'div[data-mcpr] div[data-container-id="main-col"]';
  const display_contents = 'div[style="display: contents"]';
  const folded_overview_section = 'div[data-bfc=""][ahbak="true"]';
  const expanded_overview_section = 'div[data-bfc=""][class=""]';

  Object.entries({
    'folded':
      `${mcpr_main_col} > ${display_contents} > ${folded_overview_section}`,
    'directlyfolded':
      `${mcpr_main_col} > ${folded_overview_section}`,
    'expanded':
      `${mcpr_main_col} > ${display_contents} > ${expanded_overview_section}`,
    'directlyexpanded':
      `${mcpr_main_col} > ${expanded_overview_section}`,
  }).forEach(
    ([category, selector]) => {
      const followup = queryLastMatch(selector);
      if (followup === null || DONE) {
        // Nothing to process; logging here is annoying as it's repeated on every DOM mutation
        return;
      }

      followup.style.display = "none";
      console.log('[forbid-google-ai-followup]'
        + ` followup removed (${category}): "${followup.textContent}"`
        + ' (corresponded element may be shown below)'
      );
      console.debug(followup); // This may be blocked in Chrome

      DONE = true;
      observer.disconnect();
      console.debug('[forbid-google-ai-foloowup] exit');
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
