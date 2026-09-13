#!/bin/sh
set -eu

VOICE="${PIPER_VOICE:-fr_FR-upmc-medium}"
DATA_DIR="${PIPER_DATA_DIR:-/voices}"
INTERNAL_PORT="${PIPER_INTERNAL_PORT:-5001}"

mkdir -p "$DATA_DIR" /cache

MODEL="$DATA_DIR/$VOICE.onnx"
CONFIG="$DATA_DIR/$VOICE.onnx.json"

if [ ! -f "$MODEL" ] || [ ! -f "$CONFIG" ]; then
  echo "[Lila Piper] Téléchargement de la voix $VOICE…"
  python3 -m piper.download_voices --data-dir "$DATA_DIR" "$VOICE"
fi

echo "[Lila Piper] Démarrage de Piper sur 127.0.0.1:$INTERNAL_PORT avec $VOICE"
python3 -m piper.http_server \
  -m "$VOICE" \
  --data-dir "$DATA_DIR" \
  --host 127.0.0.1 \
  --port "$INTERNAL_PORT" &
PIPER_PID=$!

cleanup() {
  kill "$PIPER_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

# Attendre que le serveur Piper interne soit prêt avant de publier la passerelle.
i=0
until python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:$INTERNAL_PORT/info', timeout=1).read()" >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -ge 60 ]; then
    echo "[Lila Piper] Piper n'a pas démarré dans le délai prévu." >&2
    exit 1
  fi
  sleep 1
done

echo "[Lila Piper] Piper prêt. Démarrage de la passerelle Lila."
python3 /app/server.py
