FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN python3 -m pip install --no-cache-dir "piper-tts[http]" flask flask-cors requests

WORKDIR /app
COPY server.py entrypoint.sh ./
RUN chmod +x /app/entrypoint.sh && mkdir -p /voices /cache

EXPOSE 5000
ENTRYPOINT ["/app/entrypoint.sh"]
