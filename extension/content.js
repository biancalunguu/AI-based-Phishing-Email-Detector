// content.js
// Simple script to extract subject + body text from the currently open Gmail message.
// Uses common Gmail selectors but has fallbacks. Student/simple style.

function extractEmailText() {
  // Try common Gmail subject selector
  let subject = "";
  const subjEl = document.querySelector("h2.hP") || document.querySelector('h2[data-legacy-subject]');
  if (subjEl) subject = subjEl.innerText.trim();

  // Try a few possible body selectors used by Gmail (simple approach)
  let body = "";
  const bodyEl = document.querySelector("div.a3s") || document.querySelector("div.ii.gt") || document.querySelector("div.gs");
  if (bodyEl) {
    // Some message bodies have nested tags; get visible text
    body = bodyEl.innerText.trim();
  } else {
    // fallback: grab visible text inside the main view
    const main = document.querySelector("div[role='main']");
    if (main) body = main.innerText.trim();
  }

  return { subject, body };
}

// Expose a simple interface to the extension popup via window
window.__PhishGuard = {
  getEmailText: extractEmailText
};

// Also listen for messages from extension (in case we want to call from popup)
chrome.runtime.onMessage && chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "GET_EMAIL_TEXT") {
    sendResponse(extractEmailText());
  }
});
