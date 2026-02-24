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

	mineBtn.onclick = async () => {
		clearPresets(container);
		presetFilterBar.classList.remove("hidden");
		console.log("Mine");
		const fetchPipeline = true;
		const userPresets = await getUserPresets();
		if (userPresets) {
			fillWithPresets(userPresets, container, fetchPipeline);
		} else {
			showLoginToSeeYourFilters(container);
		}
		setActiveTab(mineBtn);
		//showNotImplemented(container);
	};

	communityBtn.onclick = async () => {
		clearPresets(container);
		presetFilterBar.classList.remove("hidden");
		console.log("Community");
		const fetchPipeline = true;
		fillWithPresets(await getCommunityPresets(), container, fetchPipeline);
		setActiveTab(communityBtn);
	};
}
function clearPresets(container) {
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
}

async function getCommunityPresets() {
	return await fetch("/api/preset-list").then((res) => res.json());
}

// Json list, container where to append each preset.
function fillWithPresets(presets, container, fetchPipeline = false) {
	presets.forEach((preset) => {
		try {
			const card = document.createElement("div");
			card.className = cardHTMLClasses;
			card.innerHTML = cardHTMLPreset;

			card.querySelector("span").textContent =
				preset.name ?? "Unnamed preset";
			card.querySelector("p").textContent = preset.description ?? "";

			const applyBtn = card.querySelector(".apply-btn");
			const copyBtn = card.querySelector(".copy-btn");

			applyBtn.onclick = async () => {
				try {
					const presetString = await getPresetJson(
						preset,
						fetchPipeline,
					);
					setJSONPipelineContent(presetString);
				} catch (err) {
					console.error(
						"Error fetching and applying pipeline: ",
						err.message,
					);
				}
			};

			copyBtn.onclick = async () => {
				try {
					let presetString = await getPresetJson(
						preset,
						fetchPipeline,
					);
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

async function getPresetJson(preset, fetchPipeline = false) {
	let pipeline = preset.pipeline;
	if (fetchPipeline) {
		const res = await fetch(`/api/pipeline/${preset.id}`);
		if (!res.ok) {
			const text = await res.text().catch(() => "");
			throw new Error(
				`Pipeline fetch failed (${res.status}): ${text.slice(0, 120)}`,
			);
		}
		const data = await res.json();
		if (!data || !("pipeline" in data)) {
			throw new Error(
				`Unexpected pipeline payload: ${JSON.stringify(data).slice(0, 200)}`,
			);
		}
		pipeline = data.pipeline;
	}

	const outputPreset = {
		name: preset.name,
		description: preset.description,
		pipeline,
		output_suffix: "_processed",
		output_extension: "auto",
	};

	return JSON.stringify(outputPreset, null, 2);
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

async function getUserPresets() {
	try {
		const res = await fetch("/api/userPresets");
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
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

function showLoginToSeeYourFilters(container) {
	container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="text-zinc-500 text-sm animate-pulse font-mono">
        Login to see your filters
      </div>
    </div>
  `;
}
