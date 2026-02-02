import { FileAdministrator } from "./file-processing/FilesAdministrator.js";
import { ALL_DIRS } from "./file-processing/paths.js";
import { initUI } from "./ui/init/initUI.js";
import { processButtonUIOff } from "./ui/init/processButtonSetup.js";
import { setupJSONPipelineEditor } from "./ui/setupJSONPipelineEditor.js";

if (crossOriginIsolated) {
	console.log("✅ Entorno aislado: Los hilos de C++ funcionarán.");
} else {
	console.warn(
		"❌ Entorno NO aislado: SharedArrayBuffer no está disponible.",
	);
}

let engine;
await runEngine();
async function runEngine() {
	try {
		window.engineModule = await createEngine();
		engine = window.engineModule;
		await engine.ready;
		console.log("Wasm engine loaded correctly");
		window.fileAdmin = new FileAdministrator(engine);
		console.log("memfs initialized:", engine.FS);
		ensureFolders();
		setupJSONPipelineEditor();
		initUI(engine);
	} catch (e) {
		console.log("Failed on setup " + e.message);
	}
}

window.onEngineFinished = function () {
	console.log("Engine finished processing batch");
	window.engineRunning = false;
	processButtonUIOff();

	window.fileAdmin.updateCanvasRows(window.currSuffix);
};

async function loadExamplePics() {
	await window.fileAdmin.addExamplePPM(["paisaje.ppm", "gato.ppm"]);
}

function ensureFolders() {
	for (let path of ALL_DIRS) {
		const cleanPath = path.startsWith("./") ? path.substring(2) : path;
		const parts = cleanPath.split("/");
		let currentPath = "";

		for (const part of parts) {
			currentPath += (currentPath ? "/" : "") + part;
			try {
				if (!engine.FS.analyzePath(currentPath).exists) {
					engine.FS.mkdir(currentPath);
					console.log(`Folder created in MEMFS: ${currentPath}`);
				}
			} catch (e) {}
		}
	}
}
