# Lila AI Relay

Petit relais HTTPS pour garder les clés **OpenAI** et **Gemini** hors du navigateur.

## Principe

```text
Lila sur iPhone/iPad
        ↓ HTTPS
Relais Lila
        ↓
OpenAI / Gemini
```

Le navigateur ne connaît que l'adresse du relais et, si souhaité, un jeton d'accès. Les vraies clés API restent dans les variables d'environnement du conteneur.

## Variables

```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
LILA_RELAY_TOKEN=un-long-jeton-prive
ALLOWED_ORIGIN=https://jptstar.github.io
```

## Docker

```bash
cd ai-relay
export OPENAI_API_KEY='...'
export GEMINI_API_KEY='...'
export LILA_RELAY_TOKEN='...'
docker compose up -d --build
```

Le service écoute sur le port `8787`.

- `GET /health` : état du relais
- `POST /api` : LLM ou synthèse vocale

## Synology

Publier le relais avec le reverse proxy DSM, par exemple :

```text
https://ia.mondomaine.fr/api
          ↓
http://127.0.0.1:8787/api
```

Dans **Lila → Réglages → Connexion API** :

1. choisir **Relais sécurisé** ;
2. saisir `https://ia.mondomaine.fr/api` ;
3. saisir le même `LILA_RELAY_TOKEN` ;
4. utiliser **Tester OpenAI** ou **Tester Gemini**.

Le même relais sert aux LLM et aux voix OpenAI/Gemini.
