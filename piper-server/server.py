import hashlib
import json
import os
import pathlib
import tempfile
import threading

import requests
from flask import Flask, Response, jsonify, request
from flask_cors import CORS

APP_PORT = int(os.getenv("PORT", "5000"))
PIPER_INTERNAL_URL = os.getenv("PIPER_INTERNAL_URL", "http://127.0.0.1:5001/synthesize")
PIPER_API_TOKEN = os.getenv("PIPER_API_TOKEN", "").strip()
DEFAULT_SPEAKER_ID = os.getenv("PIPER_SPEAKER_ID", "0").strip()
DEFAULT_LENGTH_SCALE = float(os.getenv("PIPER_LENGTH_SCALE", "1.06"))
CACHE_DIR = pathlib.Path(os.getenv("CACHE_DIR", "/cache"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)

origins_raw = os.getenv("ALLOWED_ORIGINS", "https://jptstar.github.io")
ALLOWED_ORIGINS = [x.strip() for x in origins_raw.split(",") if x.strip()]

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": ALLOWED_ORIGINS}},
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "OPTIONS"],
)

synthesis_lock = threading.Lock()


def authorized() -> bool:
    if not PIPER_API_TOKEN:
        return True
    auth = request.headers.get("Authorization", "")
    return auth == f"Bearer {PIPER_API_TOKEN}"


def parse_payload():
    data = request.get_json(silent=True)
    if isinstance(data, dict):
        return data
    try:
        raw = request.get_data(cache=False, as_text=True)
        parsed = json.loads(raw) if raw else {}
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def cache_path(payload: dict) -> pathlib.Path:
    stable = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(stable.encode("utf-8")).hexdigest()
    return CACHE_DIR / f"{digest}.wav"


@app.get("/health")
def health():
    try:
        info_url = PIPER_INTERNAL_URL.rsplit("/synthesize", 1)[0] + "/info"
        r = requests.get(info_url, timeout=3)
        piper_ok = r.ok
    except requests.RequestException:
        piper_ok = False
    return jsonify({"ok": True, "piper": piper_ok, "cache": str(CACHE_DIR)})


@app.post("/synthesize")
def synthesize():
    if not authorized():
        return jsonify({"error": "unauthorized"}), 401

    data = parse_payload()
    text = str(data.get("text", "")).strip()
    if not text:
        return jsonify({"error": "text is required"}), 400
    if len(text) > 2000:
        return jsonify({"error": "text too long"}), 413

    try:
        length_scale = float(data.get("length_scale", DEFAULT_LENGTH_SCALE))
    except (TypeError, ValueError):
        length_scale = DEFAULT_LENGTH_SCALE
    length_scale = max(0.7, min(1.6, length_scale))

    payload = {"text": text, "length_scale": length_scale}

    speaker_id = data.get("speaker_id", DEFAULT_SPEAKER_ID)
    if speaker_id not in (None, ""):
        try:
            payload["speaker_id"] = int(speaker_id)
        except (TypeError, ValueError):
            pass

    if data.get("speaker"):
        payload["speaker"] = str(data["speaker"])
    if data.get("voice"):
        payload["voice"] = str(data["voice"])

    target = cache_path(payload)
    if target.exists():
        return Response(target.read_bytes(), mimetype="audio/wav", headers={"X-Lila-Cache": "HIT"})

    with synthesis_lock:
        if target.exists():
            return Response(target.read_bytes(), mimetype="audio/wav", headers={"X-Lila-Cache": "HIT"})

        try:
            r = requests.post(PIPER_INTERNAL_URL, json=payload, timeout=90)
        except requests.RequestException as exc:
            return jsonify({"error": "piper unavailable", "detail": str(exc)}), 503

        if not r.ok:
            return jsonify({"error": "piper error", "status": r.status_code, "detail": r.text[:500]}), 502

        wav = r.content
        if not wav:
            return jsonify({"error": "empty audio"}), 502

        with tempfile.NamedTemporaryFile(dir=CACHE_DIR, suffix=".tmp", delete=False) as tmp:
            tmp.write(wav)
            tmp_path = pathlib.Path(tmp.name)
        tmp_path.replace(target)

    return Response(wav, mimetype="audio/wav", headers={"X-Lila-Cache": "MISS"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=APP_PORT, threaded=True)
