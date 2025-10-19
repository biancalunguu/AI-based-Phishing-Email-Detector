// content.js
// Simple script to extract subject + body text from the currently open Gmail message.
// Uses common Gmail selectors but has fallbacks. Student/simple style.

function extractEmailText() {
  let subject = "";
  const subjEl = document.querySelector("h2.hP") || document.querySelector('h2[data-legacy-subject]');
  if (subjEl) subject = subjEl.innerText.trim();

  let body = "";
  const bodyEl = document.querySelector("div.a3s") || document.querySelector("div.ii.gt") || document.querySelector("div.gs");
  if (bodyEl) {
    body = bodyEl.innerText.trim();
  } else {
    const main = document.querySelector("div[role='main']");
    if (main) body = main.innerText.trim();
  }

  return { subject, body };
}
window.__PhishGuard = {
  getEmailText: extractEmailText
};

chrome.runtime.onMessage && chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "GET_EMAIL_TEXT") {
    sendResponse(extractEmailText());
  }
});
