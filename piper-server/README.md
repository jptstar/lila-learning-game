# 🎙️ Piper pour Lila

Ce dossier ajoute une voix Piper gratuite et locale au jeu **Lila apprend avec toi**.

## Architecture

```text
iPad / Safari
    │ HTTPS
    ▼
GitHub Pages (le jeu)
    │ HTTPS /synthesize
    ▼
Reverse proxy Synology
    │ HTTP local
    ▼
lila-piper:5000 (passerelle CORS + cache + jeton)
    │ HTTP localhost
    ▼
Piper officiel:5001
```

La passerelle Lila ajoute :

- CORS pour `https://jptstar.github.io` ;
- un jeton Bearer facultatif ;
- un cache WAV afin de ne pas recalculer les phrases déjà prononcées ;
- un endpoint `/health` ;
- un endpoint `/synthesize` compatible avec le jeu.

Le serveur Piper officiel reste utilisé en interne pour la synthèse.

## 1. Lancer avec Docker Compose

Depuis ce dossier :

```bash
docker compose up -d --build
```

Au premier démarrage, la voix `fr_FR-upmc-medium` est téléchargée dans `./voices`.
Les fichiers audio déjà générés sont conservés dans `./cache`.

Test local :

```bash
curl http://IP_DU_NAS:5000/health
```

Puis :

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"text":"Bonjour, je suis Lila."}' \
  -o test.wav \
  http://IP_DU_NAS:5000/synthesize
```

## 2. Choisir la voix

Par défaut :

```yaml
PIPER_VOICE: fr_FR-upmc-medium
PIPER_SPEAKER_ID: "0"
```

Le modèle UPMC possède deux locuteurs. `0` sélectionne le premier et `1` le second.
Tu peux remplacer `PIPER_VOICE` par une autre voix Piper française compatible.

`PIPER_LENGTH_SCALE` règle la vitesse. Une valeur légèrement supérieure à `1` ralentit la voix ; `1.06` convient bien à une narration pour enfant.

## 3. Sécuriser avec un jeton

Dans `docker-compose.yml`, décommente et remplace :

```yaml
PIPER_API_TOKEN: change-moi
```

Puis redémarre :

```bash
docker compose up -d
```

Dans le jeu : **Réglages → Voix de Lila → Piper**, saisis le même jeton.

## 4. HTTPS sur Synology

Le jeu GitHub Pages est chargé en HTTPS. Safari/iPad bloquera normalement une requête vers un serveur Piper en simple HTTP.

Il faut donc créer un reverse proxy HTTPS dans DSM, par exemple :

```text
https://voix.ton-domaine.fr  →  http://127.0.0.1:5000
```

Associe un certificat valide au nom HTTPS.

Dans les réglages du jeu, renseigne ensuite :

```text
https://voix.ton-domaine.fr
```

Le jeu ajoute lui-même `/synthesize`.

## 5. CORS

Par défaut, la passerelle autorise :

```text
https://jptstar.github.io
```

Pour plusieurs origines, sépare-les par des virgules :

```yaml
ALLOWED_ORIGINS: https://jptstar.github.io,https://autre-domaine.example
```

## 6. Repli automatique

Si Piper est indisponible, le jeu repasse automatiquement sur la synthèse vocale native du navigateur/iPad. Le jeu reste donc utilisable même si le conteneur est arrêté.
