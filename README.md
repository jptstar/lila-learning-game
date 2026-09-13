# 🐭 Lila apprend avec toi

Petit site éducatif modulaire pour apprendre les lettres et les nombres sur ordinateur, tablette et iPad.

## Architecture

Le site est volontairement séparé en un **noyau** et des **plugins de jeu**.

```text
index.html                    # coquille / écran d'accueil
assets/css/app.css            # présentation commune
assets/js/app.js              # moteur commun : score, réponses, récompenses
assets/js/data.js             # alphabet, images, nombres
assets/js/voice.js            # fournisseur de voix (navigateur, Piper à venir)
assets/js/utils.js            # fonctions utilitaires

games/
  manifest.js                 # registre des tuiles/plugins
  discover/plugin.js          # Découvre
  find-image/plugin.js        # Trouve l'image
  find-letter/plugin.js       # Trouve la lettre
  count/plugin.js             # Compte
  recognize-number/plugin.js  # Reconnais les nombres 1 à 20
  smart/plugin.js             # Mélange malin
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

## Jeu des nombres 1–20

La tuile **Reconnais le nombre** demande à l'enfant de reconnaître les écritures chiffrées de 1 à 20. La bonne réponse change de position automatiquement et n'est pas placée deux fois de suite au même emplacement.

## Tester en local

Le projet utilise des modules JavaScript. Il faut donc l'ouvrir via HTTP plutôt que directement avec `file://`.

```bash
cd lila-learning-game
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

## GitHub Pages

Le workflow `.github/workflows/pages.yml` publie automatiquement le site lors d'un push sur `main`.
Dans GitHub, ouvrir **Settings → Pages** et sélectionner **GitHub Actions** comme source de publication.

Pour ce dépôt, l'adresse est :

`https://jptstar.github.io/lila-learning-game/`

## iPad

L'interface est responsive en portrait et paysage. Safari iPad peut lire les consignes avec la voix locale et le site peut être ajouté à l'écran d'accueil. Un service worker met en cache les fichiers du jeu après la première visite.

## Piper

Le moteur de voix est isolé dans `assets/js/voice.js`. Piper pourra être ajouté sans modifier les plugins de jeu.

Important pour GitHub Pages : le site est servi en HTTPS. Sur Safari/iPad, un serveur Piper en simple `http://` sur le NAS risque d'être bloqué comme contenu mixte. La bonne solution sera d'exposer Piper via une URL HTTPS (reverse proxy Synology, domaine personnel, etc.) et d'autoriser le domaine du jeu via CORS.
