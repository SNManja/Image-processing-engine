import { downloadButtonSetup } from "./downloadButtonSetup.js";
import { helpWindowSetup } from "./helpWindowSetup.js";
import { imageDisplaySetup } from "./imageDisplaySetup.js";
import { presetsSetup } from "./presetsSetup.js";
import { processButtonSetup } from "./processButtonSetup.js";
import { uploadLogicSetup } from "./uploadLogicSetup.js";

let engine;
export function initUI(currEngine) {
	engine = currEngine;
	processButtonSetup();
	uploadLogicSetup();
	imageDisplaySetup();
	helpWindowSetup(engine);
	presetsSetup(engine);
	downloadButtonSetup(engine);
}
