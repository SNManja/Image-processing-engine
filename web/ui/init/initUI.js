import { clearImagesSetup } from "./clearImagesSetup.js";
import { downloadButtonSetup } from "./downloadButtonSetup.js";
import { helpWindowSetup } from "./helpWindowSetup.js";
import { imageDisplaySetup } from "./imageDisplaySetup.js";
import { presetsSetup } from "./presetsSetup.js";
import { processButtonSetup } from "./processButtonSetup.js";
import { uploadLogicSetup } from "./uploadLogicSetup.js";

export function initUI(engine) {
	processButtonSetup();
	uploadLogicSetup();
	imageDisplaySetup();
	helpWindowSetup(engine);
	presetsSetup(engine);
	downloadButtonSetup(engine);
	clearImagesSetup();
}
