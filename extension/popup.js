// popup.js - simple student-style code
const scanBtn = document.getElementById("scanBtn");
const resultDiv = document.getElementById("result");

function showResult(obj) {
  if (!obj) {
    resultDiv.innerHTML = "<p>No message found.</p>";
    return;
  }
  if (obj.error) {
    resultDiv.innerHTML = `<p style="color:red;"><strong>Error:</strong> ${obj.error}</p>`;
    return;
  }
  const { is_phishing, score, reasons } = obj;
  resultDiv.innerHTML = `
    <p><strong>Phishing:</strong> ${is_phishing ? "⚠️ YES" : "✅ No"}</p>
    <p><strong>Score:</strong> ${score}</p>
    <p><strong>Reasons:</strong> ${reasons && reasons.length ? reasons.join(", ") : "None detected"}</p>
  `;
}

async function fetchServerAnalysis(text) {
  try {
    const resp = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(()=>({error:"server returned non-JSON"}));
      throw new Error(err.error || "Server error");
    }
    return await resp.json();
  } catch (e) {
    return { error: e.message };
  }
}

scanBtn.addEventListener("click", async () => {
  resultDiv.innerHTML = "<p>Scanning…</p>";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window.__PhishGuard && window.__PhishGuard.getEmailText) {
          return window.__PhishGuard.getEmailText();
        }
        const subjEl = document.querySelector("h2.hP") || document.querySelector('h2[data-legacy-subject]');
        const bodyEl = document.querySelector("div.a3s") || document.querySelector("div.ii.gt") || document.querySelector("div[role='main']");
        return {
          subject: subjEl ? subjEl.innerText.trim() : "",
          body: bodyEl ? bodyEl.innerText.trim() : ""
        };
      }
    }, async (frames) => {
      const data = frames && frames[0] && frames[0].result ? frames[0].result : null;
      if (!data) {
        resultDiv.innerHTML = "<p>Couldn't read the message. Make sure a message is open in Gmail.</p>";
        return;
      }
      const combined = `${data.subject}\n\n${data.body}`;
      const serverResp = await fetchServerAnalysis(combined);
      showResult(serverResp);
    });
  } catch (e) {
    resultDiv.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`;
  }
});
