import { clearImagesSetup } from "./clearImagesSetup.js";
import { downloadButtonSetup } from "./downloadButtonSetup.js";
import { helpWindowSetup } from "./helpWindowSetup.js";
import { imageDisplaySetup } from "./imageDisplaySetup.js";
import { loginSetup } from "./loginSetup.js";
import { presetsSetup } from "./presetsSetup.js";
import { processButtonSetup } from "./processButtonSetup.js";
import { uploadLogicSetup } from "./uploadImagesLogicSetup.js";
import { publishPresetSetup } from "./uploadPipelineSetup.js";

export function initUI(engine) {
	processButtonSetup();
	uploadLogicSetup();
	imageDisplaySetup();
	helpWindowSetup(engine);
	presetsSetup(engine);
	downloadButtonSetup(engine);
	clearImagesSetup();
	loginSetup();
	publishPresetSetup();
}
