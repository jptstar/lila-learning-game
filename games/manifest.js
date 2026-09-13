import {discoverGame} from "./discover/plugin.js";
import {findImageGame} from "./find-image/plugin.js";
import {findLetterGame} from "./find-letter/plugin.js";
import {countGame} from "./count/plugin.js";
import {recognizeNumberGame} from "./recognize-number/plugin.js";
import {shapesGame} from "./shapes/plugin.js";
import {shadowsGame} from "./shadows/plugin.js";
import {shapeHoleGame} from "./shape-hole/plugin.js";
import {shapeRotationGame} from "./shape-rotation/plugin.js";
import {genderGame} from "./gender/plugin.js";
import {tracingGame} from "./tracing/plugin.js";
import {smartGame} from "./smart/plugin.js";

export const GAMES=[
  discoverGame,findImageGame,findLetterGame,tracingGame,
  countGame,recognizeNumberGame,
  shapesGame,shadowsGame,shapeHoleGame,shapeRotationGame,
  genderGame,smartGame
];
