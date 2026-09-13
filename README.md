# 🐭 Lila apprend avec toi

Jeu éducatif web modulaire pour les lettres et les nombres, pensé pour ordinateur, tablette, iPad et smartphone.

## Architecture

```text
index.html
assets/
  css/
    app.css
    mobile-fit.css
    mobile-device.css
  js/
    app.js                 # moteur de jeu commun
    data.js                # alphabet de référence et nombres 0–100
    letter-catalog.js      # catalogue de 200 mots/illustrations
    cloud-ai.js            # OpenAI / Gemini : LLM + synthèse vocale
    voice.js               # voix appareil, OpenAI, Gemini et Piper
    utils.js

games/
  manifest.js
  discover/plugin.js
  find-image/plugin.js
  find-letter/plugin.js
  count/plugin.js
  recognize-number/plugin.js
  smart/plugin.js

ai-relay/                  # relais sécurisé OpenAI/Gemini prêt pour Docker
piper-server/              # serveur Piper optionnel
```

Chaque jeu reste un plugin indépendant enregistré dans `games/manifest.js`.

## Nombres

Les deux bornes utilisent exactement les mêmes valeurs :

`0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100`

Une plage doit avoir une borne de fin supérieure à la borne de début. Exemples : `0–10`, `10–20`, `30–40`, `20–60`.

Les jeux numériques évitent de proposer deux fois de suite le même nombre cible.

## Lettres et images

`assets/js/letter-catalog.js` contient **200 mots illustrés** adaptés à un usage enfant et répartis sur l’alphabet. Les jeux « Trouve l’image » et « Trouve la lettre » utilisent ce catalogue.

Le moteur évite deux questions identiques consécutives. Pour « Trouve la lettre », il évite aussi de donner deux fois de suite la même lettre comme réponse.

## Séries

Une série comporte **10 activités**. La barre de progression va de 0 à 100 %. Le message « Quelle belle série ! » n’est déclenché qu’à la fin des 10 activités.

## OpenAI et Gemini

Les réglages séparent clairement :

- la **connexion API** ;
- le **LLM** utilisé pour les futures fonctions génératives ;
- la **voix** utilisée par Lila.

### Connexion directe

Pour un test personnel, une clé OpenAI ou Gemini peut être saisie dans le navigateur. Elle est conservée uniquement dans `sessionStorage`, donc jusqu’à la fermeture de l’onglet.

### Relais sécurisé

Pour un usage permanent, utiliser `ai-relay/`. Les clés OpenAI et Gemini restent alors côté serveur et ne sont jamais envoyées au navigateur.

Le même relais prend en charge :

- les requêtes LLM ;
- la synthèse vocale OpenAI ;
- la synthèse vocale Gemini.

Voir [`ai-relay/README.md`](./ai-relay/README.md).

## Voix

Quatre moteurs sont disponibles :

- voix de l’appareil ;
- OpenAI TTS ;
- Gemini TTS ;
- Piper local.

OpenAI et Gemini disposent dans les réglages de leur modèle vocal, de la voix et du style de lecture. Piper reste disponible comme solution locale.

## Test local

```bash
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

## GitHub Pages

Le workflow `.github/workflows/pages.yml` publie automatiquement `main` sur :

`https://jptstar.github.io/lila-learning-game/`
