import {
	createPreset,
	getPipelineFromPresetID,
	getPresets,
	getUserPresets,
} from "../controllers/preset-controller.js";

export default async function presetRoutes(app) {
	app.get("/api/preset-list", getPresets);
	app.get("/api/userPresets", getUserPresets);
	app.post(
		"/api/publishPreset",
		{
			config: {
				rateLimit: {
					max: 5,
					timeWindow: "1 minute",
				},
			},
		},
		createPreset,
	);
	app.get("/api/pipeline/:id", getPipelineFromPresetID);
}
