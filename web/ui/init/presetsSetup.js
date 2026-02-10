import { createModalController } from "../create-modal-controller.js";
import { setJSONPipelineContent } from "../setupJSONPipelineEditor.js";

const TAB_DEFAULT = [
	"border-zinc-700",
	"text-zinc-400",
	"hover:text-zinc-100",
	"hover:border-zinc-500",
	"hover:bg-zinc-800/40",
];

const TAB_ACTIVE = ["bg-zinc-800", "text-zinc-100", "border-zinc-600"];

const cardHTMLPreset = `
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

const cardHTMLClasses =
	"group flex items-center justify-between gap-6 rounded-xl border border-zinc-800 bg-zinc-900/10 p-4 hover:bg-zinc-900/40 transition-all";

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

	fillWithPresets(getBuiltInPresets(engine), container);

	const builtInBtn = document.getElementById("presets-builtin-button");
	const mineBtn = document.getElementById("presets-mine-button");
	const communityBtn = document.getElementById("presets-community-button");
	const presetFilterBar = document.getElementById("preset-filter-bar");

	setActiveTab(builtInBtn);
	builtInBtn.onclick = () => {
		clearPresets(container);
		presetFilterBar.classList.add("hidden");
		console.log("Built-in");
		fillWithPresets(getBuiltInPresets(engine), container);
		setActiveTab(builtInBtn);
	};

	mineBtn.onclick = () => {
		clearPresets(container);
		presetFilterBar.classList.remove("hidden");
		console.log("Mine");
		//fillWithPresets(getUserPresets(), container);
		setActiveTab(mineBtn);
		showNotImplemented(container);
	};

	communityBtn.onclick = () => {
		clearPresets(container);
		presetFilterBar.classList.remove("hidden");
		console.log("Community");
		//fillWithPresets(getCommunityPresets(), container);
		setActiveTab(communityBtn);
		showNotImplemented(container);
	};
}

// Json list, container where to append each preset.
function fillWithPresets(presets, container) {
	presets.forEach((preset) => {
		try {
			const presetString = JSON.stringify(preset, null, 2);

			const card = document.createElement("div");
			card.className = cardHTMLClasses;
			card.innerHTML = cardHTMLPreset;

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
					setTimeout(
						() => (copyBtn.textContent = originalText),
						2000,
					);
				} catch (e) {
					console.error("Clipboard write failed:", e);
				}
			};

			container.appendChild(card);
		} catch (e) {
			console.error("Error al crear el preset:", e);
		}
	});
}

function clearPresets(container) {
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
}

/**
 *
 * Retrieves presets from memfs
 * @returns {Array} List of JSON pipelines
 */
function getBuiltInPresets(engine) {
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

function setActiveTab(tab) {
	const presetTabs = document.querySelectorAll(".preset-tabs-buttons");
	presetTabs.forEach((t) => {
		TAB_ACTIVE.forEach((c) => t.classList.remove(c));
		TAB_DEFAULT.forEach((c) => t.classList.add(c));
	});

	TAB_DEFAULT.forEach((c) => tab.classList.remove(c));
	TAB_ACTIVE.forEach((c) => tab.classList.add(c));
}

function showNotImplemented(container) {
	container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="text-zinc-500 text-sm animate-pulse font-mono">
        Sorry — not implemented yet
      </div>
    </div>
  `;
}
