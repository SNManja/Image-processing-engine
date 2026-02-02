import { createModalController } from "../create-modal-controller.js";
import { setJSONPipelineContent } from "../setupJSONPipelineEditor.js";

export function presetsSetup(engine) {
	const presetsModal = document.getElementById("presets-modal");
	const presetsBtn = document.getElementById("presets-button");
	const closeBtn = document.getElementById("close-presets");
	const container = document.getElementById("preset-container");

	if (!presetsModal || !presetsBtn || !closeBtn || !container) return;

	const { close } = createModalController({
		modalEl: presetsModal,
		openBtn: presetsBtn,
		closeBtn: closeBtn,
		closeOnBackdrop: true,
	});

	container.innerHTML = "";

	const presets = getPresetsList(engine);

	presets.forEach((preset) => {
		const presetString = JSON.stringify(preset, null, 2);

		const card = document.createElement("div");
		card.className =
			"group flex items-center justify-between gap-6 rounded-xl border border-zinc-800 bg-zinc-900/10 p-4 hover:bg-zinc-900/40 transition-all";

		card.innerHTML = `
      <div class="flex flex-col flex-1 min-w-0">
        <span class="text-[13px] font-bold text-zinc-100 truncate"></span>
        <p class="text-xs text-zinc-500 mt-0.5 line-clamp-1"></p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button class="apply-btn rounded-lg bg-zinc-100 px-4 py-1.5 text-[11px] font-bold text-zinc-950 hover:bg-white transition-colors">
          Apply
        </button>
        <button class="copy-btn rounded-lg border border-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
          Copy JSON
        </button>
      </div>
    `;

		card.querySelector("span").textContent =
			preset.name ?? "Unnamed preset";
		card.querySelector("p").textContent =
			`${preset.pipeline?.length ?? 0} filters pipeline length`;

		const applyBtn = card.querySelector(".apply-btn");
		const copyBtn = card.querySelector(".copy-btn");

		applyBtn.onclick = () => {
			setJSONPipelineContent(presetString);
			close();
		};

		copyBtn.onclick = async () => {
			try {
				await navigator.clipboard.writeText(presetString);
				const originalText = copyBtn.textContent;
				copyBtn.textContent = "Copied!";
				setTimeout(() => (copyBtn.textContent = originalText), 2000);
			} catch (e) {
				console.error("Clipboard write failed:", e);
			}
		};

		container.appendChild(card);
	});
}

/**
 * Retrieves presets from memfs
 * @returns {Array} List of JSON pipelines
 */
function getPresetsList(engine) {
	if (!engine?.FS) return [];
	try {
		const files = engine.FS.readdir("/presets");

		return files
			.filter((fileName) => fileName.endsWith(".json"))
			.map((fileName) => {
				const rawData = engine.FS.readFile(`/presets/${fileName}`, {
					encoding: "utf8",
				});
				return JSON.parse(rawData);
			});
	} catch (e) {
		console.error("Error al acceder a /presets en MEMFS:", e);
		return [];
	}
}
