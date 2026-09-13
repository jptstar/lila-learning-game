# 🐭 Lila apprend avec toi

Petit site éducatif modulaire pour apprendre les lettres et les nombres sur ordinateur, tablette et iPad.

## Architecture

Le site est volontairement séparé en un **noyau** et des **plugins de jeu**.

```text
index.html                    # coquille / écran d'accueil / réglages
assets/css/app.css            # présentation commune
assets/js/app.js              # moteur commun : score, réponses, corrections, réglages
assets/js/data.js             # alphabet, vocabulaire, grammaire, nombres 1–100
assets/js/voice.js            # voix navigateur + Piper
assets/js/utils.js            # fonctions utilitaires

games/
  manifest.js                 # registre des tuiles/plugins
  discover/plugin.js          # Découvre
  find-image/plugin.js        # Trouve l'image
  find-letter/plugin.js       # Trouve la lettre
  count/plugin.js             # Compte
  recognize-number/plugin.js  # Reconnais les nombres dans une plage réglable
  smart/plugin.js             # Mélange malin

piper-server/                 # serveur vocal local optionnel
  Dockerfile
  docker-compose.yml
  entrypoint.sh
  server.py
  README.md
```

Chaque plugin exporte un objet contenant `id`, `icon`, `title`, `description` et `play(api)`.
L'écran d'accueil crée automatiquement une tuile pour chaque plugin déclaré dans `games/manifest.js`.

## Ajouter un jeu

1. Créer un dossier, par exemple `games/ordre-nombres/`.
2. Ajouter `plugin.js`.
3. Importer le plugin dans `games/manifest.js`.
4. Ajouter le plugin dans le tableau `GAMES`.

Exemple minimal :

```js
export const monJeu = {
  id: "mon-jeu",
  icon: "🎲",
  title: "Mon jeu",
  description: "Une petite description.",
  play(api) {
    api.setQuestion("Ma question");
    api.setBubble("Lila explique la mission.");
  }
};
```

## Nombres 1–100

Les jeux numériques travaillent de **1 à 100** avec une plage réglable dans les paramètres.
On peut par exemple choisir :

- 1–10 pour commencer ;
- 11–20 lorsque 1–10 est acquis ;
- 21–50 ;
- 51–100 ;
- ou toute autre plage d'au moins trois nombres.

La position de la bonne réponse varie automatiquement.

Après une erreur :

- le choix erroné reste rouge ;
- la bonne réponse reste verte ;
- Lila explique la différence à voix haute ;
- aucune nouvelle question ne démarre pendant l'explication ;
- l'enfant choisit lui-même quand continuer.

## Français et synthèse vocale

Les textes parlés sont rédigés comme des phrases françaises complètes plutôt que par assemblage approximatif de fragments.
Les formes sensibles à l'élision sont stockées explicitement, par exemple **« d'étoiles »** et non **« de étoiles »**.

Les lettres possèdent aussi leur nom oral français (`bé`, `cé`, `effe`, `ache`, `double vé`, `i grec`, etc.) afin que la synthèse vocale ne lise pas simplement le caractère brut.

## Piper — voix locale gratuite

Piper est intégré comme moteur vocal optionnel dans **Réglages → Voix de Lila**.

Le dossier [`piper-server/`](./piper-server/) contient une installation Docker prête à utiliser sur un NAS/Synology :

```bash
cd piper-server
docker compose up -d --build
```

Le conteneur :

- télécharge automatiquement une voix française Piper ;
- utilise le serveur HTTP officiel Piper en interne ;
- ajoute une passerelle CORS adaptée au site GitHub Pages ;
- peut être protégée par un jeton ;
- met les WAV en cache ;
- expose `/health` et `/synthesize`.

Pour un iPad ouvrant le site GitHub Pages, l'adresse Piper doit être publiée en **HTTPS** (par exemple avec le reverse proxy Synology). Voir `piper-server/README.md`.

Si Piper n'est pas accessible, le jeu utilise automatiquement la voix locale de l'appareil en secours.

## Tester en local

Le projet utilise des modules JavaScript. Il faut donc l'ouvrir via HTTP plutôt que directement avec `file://`.

```bash
cd lila-learning-game
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

## GitHub Pages

Le workflow `.github/workflows/pages.yml` publie automatiquement le site lors d'un push sur `main`.

Adresse :

`https://jptstar.github.io/lila-learning-game/`

## iPad

L'interface est responsive en portrait et paysage. Le site peut être ajouté à l'écran d'accueil et un service worker met en cache les fichiers du jeu après la première visite.
