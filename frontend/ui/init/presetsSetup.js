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

	refreshPresets(engine, container, "builtin", "", "");

	const builtInBtn = document.getElementById("presets-builtin-button");
	const mineBtn = document.getElementById("presets-mine-button");
	const communityBtn = document.getElementById("presets-community-button");
	const presetFilterBar = document.getElementById("preset-filter-bar");

	const searchInput = document.getElementById("preset-search");
	const sortSelect = document.getElementById("preset-sort");

	let currentScope = "builtin";
	let q = "";
	let sort = "created_at";
	let order = "DESC";

	setActiveTab(builtInBtn);
	builtInBtn.onclick = () => {
		presetFilterBar.classList.add("hidden");
		currentScope = "builtin";
		refreshPresets(engine, container, "builtin", "", "", "");
		setActiveTab(builtInBtn);
	};

	mineBtn.onclick = async () => {
		presetFilterBar.classList.remove("hidden");
		currentScope = "user";
		refreshPresets(engine, container, "user", q, sort, order);
		setActiveTab(mineBtn);
	};

	communityBtn.onclick = async () => {
		presetFilterBar.classList.remove("hidden");
		currentScope = "community";
		refreshPresets(engine, container, "community", q, sort, order);
		setActiveTab(communityBtn);
	};

	// Enter en buscador
	searchInput?.addEventListener("keydown", (e) => {
		if (e.key !== "Enter") return;
		e.preventDefault();

		q = searchInput.value.trim();
		console.log("Se busco ", currentScope, q, sort, order);
		// si estás en builtin y apretás enter, podés ignorar o cambiar a community
		if (currentScope === "builtin") return;

		refreshPresets(engine, container, currentScope, q, sort, order);
	});

	// Cambio de sort
	sortSelect?.addEventListener("change", () => {
		const mapped = mapSortUI(sortSelect.value);
		if (!mapped) {
			// "top" no implementado
			showNotImplemented(container);
			// opcional: volver a newest automáticamente
			sortSelect.value = "newest";
			({ sort, order } = mapSortUI("newest"));
			return;
		}

		({ sort, order } = mapped);

		if (currentScope === "builtin") return;
		refreshPresets(engine, container, currentScope, q, sort, order);
	});
}

async function refreshPresets(engine, container, scope, q, sort, order) {
	clearPresets(container);

	const fetchPipeline = scope === "community" || scope === "user";

	let presets = null;

	if (scope === "community") {
		presets = await getCommunityPresets({ q, sort, order });
	} else if (scope === "user") {
		presets = await getUserPresets({ q, sort, order });
	} else {
		presets = await getBuiltInPresets(engine);
	}

	if (presets) {
		console.log("This will be filled with", presets.length, " presets ");
		fillWithPresets(presets, container, fetchPipeline);
	} else {
		if (scope === "user") showLoginToSeeYourFilters(container);
		else showNotImplemented(container); // opcional
	}
}

function clearPresets(container) {
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
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

function buildQueryParams({
	q = "",
	sort = "created_at",
	order = "DESC",
	limit = 20,
} = {}) {
	const params = new URLSearchParams();

	const qTrim = (q ?? "").trim();
	if (qTrim) params.set("q", qTrim);

	// backend contract: sort=name|created_at ; order=ASC|DESC ; limit 1..50
	if (sort) params.set("sort", sort);
	if (order) params.set("order", String(order).toUpperCase());
	if (limit != null) params.set("limit", String(limit));

	return params.toString();
}

function mapSortUI(value) {
	// backend: sort=name|created_at, order=ASC|DESC
	if (value === "az") return { sort: "name", order: "ASC" };
	if (value === "newest") return { sort: "created_at", order: "DESC" };

	// "top" todavía no existe en tu backend
	return null;
}

async function getUserPresets({
	q = "",
	sort = "created_at",
	order = "DESC",
	limit = 20,
} = {}) {
	try {
		const qs = buildQueryParams({ q, sort, order, limit });
		const url = `/api/userPresets${qs ? `?${qs}` : ""}`;

		const res = await fetch(url, { credentials: "include" });
		if (!res.ok) return null;

		return await res.json();
	} catch {
		return null;
	}
}

async function getCommunityPresets({
	q = "",
	sort = "created_at",
	order = "DESC",
	limit = 20,
} = {}) {
	try {
		const qs = buildQueryParams({ q, sort, order, limit });
		const url = `/api/preset-list${qs ? `?${qs}` : ""}`;

		const res = await fetch(url);
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
