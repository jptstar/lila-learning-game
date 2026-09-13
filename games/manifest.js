// Registre des plugins de jeu.
// Pour ajouter un nouveau jeu :
// 1. créer games/mon-jeu/plugin.js
// 2. l'importer ici
// 3. l'ajouter dans GAMES
import {discoverGame} from "./discover/plugin.js";
import {findImageGame} from "./find-image/plugin.js";
import {findLetterGame} from "./find-letter/plugin.js";
import {countGame} from "./count/plugin.js";
import {recognizeNumberGame} from "./recognize-number/plugin.js";
import {smartGame} from "./smart/plugin.js";

export const GAMES=[discoverGame,findImageGame,findLetterGame,countGame,recognizeNumberGame,smartGame];
