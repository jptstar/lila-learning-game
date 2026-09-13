import base64
import io
import json
import os
import urllib.error
import urllib.request
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST=os.getenv("HOST","0.0.0.0")
PORT=int(os.getenv("PORT","8787"))
OPENAI_API_KEY=os.getenv("OPENAI_API_KEY","").strip()
GEMINI_API_KEY=os.getenv("GEMINI_API_KEY","").strip()
RELAY_TOKEN=os.getenv("LILA_RELAY_TOKEN","").strip()
ALLOWED_ORIGINS=[x.strip() for x in os.getenv("ALLOWED_ORIGIN","https://jptstar.github.io").split(",") if x.strip()]


def api_json(url,payload,headers):
    req=urllib.request.Request(url,data=json.dumps(payload).encode("utf-8"),headers=headers,method="POST")
    try:
        with urllib.request.urlopen(req,timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail=exc.read().decode("utf-8",errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {detail[:500]}") from exc


def api_bytes(url,payload,headers):
    req=urllib.request.Request(url,data=json.dumps(payload).encode("utf-8"),headers=headers,method="POST")
    try:
        with urllib.request.urlopen(req,timeout=90) as response:
            return response.read(),response.headers.get_content_type()
    except urllib.error.HTTPError as exc:
        detail=exc.read().decode("utf-8",errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {detail[:500]}") from exc


def openai_text(data):
    if isinstance(data.get("output_text"),str):
        return data["output_text"]
    parts=[]
    for item in data.get("output",[]):
        for content in item.get("content",[]):
            if content.get("type")=="output_text" and content.get("text"):
                parts.append(content["text"])
    return "\n".join(parts).strip()


def gemini_text(data):
    if isinstance(data.get("output_text"),str):
        return data["output_text"]
    if isinstance(data.get("text"),str):
        return data["text"]
    parts=[]
    for step in data.get("steps",[]):
        if step.get("type")!="model_output":
            continue
        for content in step.get("content",[]):
            if content.get("type")=="text" and content.get("text"):
                parts.append(content["text"])
    return "\n".join(parts).strip()


def gemini_audio(data):
    block=data.get("output_audio") or data.get("outputAudio") or {}
    if block.get("data"):
        return base64.b64decode(block["data"])
    for step in data.get("steps",[]):
        for content in step.get("content",[]):
            if content.get("type")=="audio" and content.get("data"):
                return base64.b64decode(content["data"])
    raise RuntimeError("Gemini n'a renvoyé aucun audio")


def pcm_to_wav(pcm,sample_rate=24000):
    stream=io.BytesIO()
    with wave.open(stream,"wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm)
    return stream.getvalue()


def call_llm(provider,model,text):
    if provider=="openai":
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY n'est pas configurée sur le relais")
        data=api_json(
            "https://api.openai.com/v1/responses",
            {"model":model or "gpt-5.6-luna","input":text,"store":False},
            {"Content-Type":"application/json","Authorization":f"Bearer {OPENAI_API_KEY}"},
        )
        return openai_text(data)
    if provider=="gemini":
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY n'est pas configurée sur le relais")
        data=api_json(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {"model":model or "gemini-3.8-flash","input":text},
            {"Content-Type":"application/json","x-goog-api-key":GEMINI_API_KEY},
        )
        return gemini_text(data)
    raise RuntimeError("Fournisseur LLM inconnu")


def call_tts(provider,model,voice,text,style):
    if provider=="openai":
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY n'est pas configurée sur le relais")
        model=model or "gpt-4o-mini-tts"
        payload={"model":model,"input":text,"voice":voice or "marin","response_format":"mp3","speed":0.92}
        if model.startswith("gpt-4o") and style:
            payload["instructions"]=style
        audio,_=api_bytes(
            "https://api.openai.com/v1/audio/speech",
            payload,
            {"Content-Type":"application/json","Authorization":f"Bearer {OPENAI_API_KEY}"},
        )
        return audio,"audio/mpeg"
    if provider=="gemini":
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY n'est pas configurée sur le relais")
        prompt=f"{style}\n\nLis exactement ce texte : {text}" if style else text
        data=api_json(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
                "model":model or "gemini-3.1-flash-tts-preview",
                "input":prompt,
                "response_format":{"type":"audio"},
                "generation_config":{"speech_config":[{"voice":voice or "Achernar"}]},
            },
            {"Content-Type":"application/json","x-goog-api-key":GEMINI_API_KEY},
        )
        return pcm_to_wav(gemini_audio(data)),"audio/wav"
    raise RuntimeError("Fournisseur vocal inconnu")


class Handler(BaseHTTPRequestHandler):
    server_version="LilaAIRelay/1.0"

    def log_message(self,fmt,*args):
        print(f"{self.client_address[0]} - {fmt%args}")

    def origin(self):
        requested=self.headers.get("Origin","")
        if requested in ALLOWED_ORIGINS:
            return requested
        return ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else "*"

    def cors(self):
        self.send_header("Access-Control-Allow-Origin",self.origin())
        self.send_header("Vary","Origin")
        self.send_header("Access-Control-Allow-Headers","Authorization, Content-Type")
        self.send_header("Access-Control-Allow-Methods","GET, POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204);self.cors();self.end_headers()

    def do_GET(self):
        if self.path.rstrip("/")=="/health":
            self.send_response(200);self.cors();self.send_header("Content-Type","application/json");self.end_headers()
            self.wfile.write(json.dumps({"ok":True,"openai":bool(OPENAI_API_KEY),"gemini":bool(GEMINI_API_KEY)}).encode())
            return
        self.send_error(404)

    def authorized(self):
        if not RELAY_TOKEN:
            return True
        return self.headers.get("Authorization","")==f"Bearer {RELAY_TOKEN}"

    def send_json(self,status,payload):
        data=json.dumps(payload,ensure_ascii=False).encode("utf-8")
        self.send_response(status);self.cors();self.send_header("Content-Type","application/json; charset=utf-8");self.send_header("Content-Length",str(len(data)));self.end_headers();self.wfile.write(data)

    def do_POST(self):
        if self.path.rstrip("/") not in ("","/api"):
            self.send_error(404);return
        if not self.authorized():
            self.send_json(401,{"error":"Jeton du relais invalide"});return
        try:
            length=int(self.headers.get("Content-Length","0"))
            payload=json.loads(self.rfile.read(length).decode("utf-8"))
            kind=payload.get("kind")
            provider=payload.get("provider")
            if kind=="llm":
                text=call_llm(provider,payload.get("model"),payload.get("input", ""))
                self.send_json(200,{"text":text});return
            if kind=="tts":
                audio,content_type=call_tts(provider,payload.get("model"),payload.get("voice"),payload.get("text", ""),payload.get("style", ""))
                self.send_response(200);self.cors();self.send_header("Content-Type",content_type);self.send_header("Content-Length",str(len(audio)));self.end_headers();self.wfile.write(audio);return
            self.send_json(400,{"error":"kind doit être llm ou tts"})
        except Exception as exc:
            self.send_json(502,{"error":str(exc)})


if __name__=="__main__":
    print(f"Lila AI relay listening on {HOST}:{PORT}")
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
