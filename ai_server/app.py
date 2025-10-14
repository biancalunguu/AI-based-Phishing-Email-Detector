# app.py - simple Flask server (student style)
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)
CORS(app)

# Initialize client; expects OPENAI_API_KEY in environment
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

SYSTEM_PROMPT = """ 
You are a concise email phishing classifier. Given the full text of an email (subject + body),
decide whether it is a phishing email. Output a JSON object ONLY (no extra text) with fields:
- is_phishing: true or false
- score: number between 0 and 1 (1 = definitely phishing)
- reasons: list of short strings explaining why (like "asks for money", "asks for credentials", "urgent tone", "suspicious link")
Analyze patterns such as requests for money, credential requests, urgent threats, unexpected attachments or links, domain mismatch, or social engineering.
Be conservative but if there are multiple indicators, increase score.
"""

def build_prompt(email_text):
    return [
        {"role":"system", "content": SYSTEM_PROMPT},
        {"role":"user", "content": f"Classify this email and return JSON only:\n\n{email_text}"}
    ]

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json() or {}
    text = data.get("text", "")
    if not text.strip():
        return jsonify({"error":"no text provided"}), 400

    try:
        # Use chat completions to request a JSON-only answer
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=build_prompt(text),
            max_tokens=300,
            temperature=0.0
        )

        content = resp.choices[0].message["content"].strip()

        # Try to parse returned JSON safely
        import json
        parsed = {}
        try:
            parsed = json.loads(content)
        except Exception:
            import re
            m = re.search(r"\{.*\}", content, re.S)
            if m:
                parsed = json.loads(m.group(0))
            else:
                return jsonify({"error": "model did not return valid JSON"}), 500

        is_phishing = bool(parsed.get("is_phishing", False))
        score = float(parsed.get("score", 1.0 if is_phishing else 0.0))
        reasons = parsed.get("reasons", [])
        if isinstance(reasons, str):
            reasons = [reasons]

        return jsonify({
            "is_phishing": is_phishing,
            "score": round(score, 3),
            "reasons": reasons
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
