import { getJSONPipelineContent } from "../setupJSONPipelineEditor.js";

export function processButtonUIOn() {
	const processBtn = document.querySelector("#process-btn");
	const statusEl = document.querySelector("#status-flag");
	processBtn.disabled = true;
	statusEl.textContent = "Running...";
}

export function processButtonUIOff() {
	const processBtn = document.querySelector("#process-btn");
	const statusEl = document.querySelector("#status-flag");
	statusEl.textContent = "idle";
	processBtn.disabled = false;
}

export function processButtonSetup() {
	const processBtn = document.querySelector("#process-btn");
	const statusEl = document.querySelector("#status-flag"); // El "idle" del HTML
	processBtn.addEventListener("click", () => {
		window.fileAdmin.cleanFilteredFolder();
		const pipelineRaw = getJSONPipeline();

		if (!pipelineRaw.ok) {
			console.error("Pipeline Error:", pipelineRaw.error);
			statusEl.textContent = "Error: " + pipelineRaw.error;
			return;
		}
		console.log("json file \n" + pipelineRaw.text);
		try {
			const pipelineData = JSON.parse(pipelineRaw.text);
			const OUTPUT_SUFFIX = pipelineData.output_suffix
				? pipelineData.output_suffix
				: "_processed";

			console.log("Pipeline running...");
			setTimeout(async () => {
				processButtonUIOn();
				window.engineRunning = true;
				window.currSuffix = OUTPUT_SUFFIX;
				window.engineModule.ccall(
					"run_pipeline",
					null,
					["string"],
					[pipelineRaw.text],
				);
			}, 50);
		} catch (e) {
			console.error("Runtime Error:", e);
			statusEl.textContent = "Error";
			processBtn.disabled = false;
		}
	});
}

function getJSONPipeline() {
	const text = getJSONPipelineContent();

	try {
		if (!text.trim()) throw new Error("El editor está vacío");

		const obj = JSON.parse(text);
		if (!obj || typeof obj !== "object")
			throw new Error("JSON root must be an object");
		if (!Array.isArray(obj.pipeline))
			throw new Error('Missing "pipeline": expected an array');

		return { ok: true, text, obj };
	} catch (e) {
		return { ok: false, text, error: e.message };
	}
}
