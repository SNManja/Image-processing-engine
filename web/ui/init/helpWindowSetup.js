import { createModalController } from "../create-modal-controller.js";
import { createTabsController } from "../create-tabs-controller.js";

export function helpWindowSetup(engine) {
	const helpModal = document.getElementById("json-help-modal");
	const helpBtn = document.getElementById("json-help-button");
	const closeBtn = document.getElementById("close-help-modal");

	const tabFiltersBtn = document.getElementById("btn-tab-filters");
	const tabSchemaBtn = document.getElementById("btn-tab-schema");

	const contentFilters = document.getElementById("content-tab-filters");
	const contentSchema = document.getElementById("content-tab-schema");

	createModalController({
		modalEl: helpModal,
		openBtn: helpBtn,
		closeBtn: closeBtn,
		closeOnBackdrop: true,
	});

	const activeStyle =
		"flex-1 py-2 px-4 rounded-xl font-semibold transition-colors bg-zinc-100 text-zinc-950 antialiased";
	const inactiveStyle =
		"flex-1 py-2 px-4 rounded-xl font-semibold transition-colors text-zinc-400 hover:bg-zinc-800/50 antialiased";

	createTabsController({
		tabs: { filters: tabFiltersBtn, schema: tabSchemaBtn },
		panels: { filters: contentFilters, schema: contentSchema },
		initial: "filters",
		classActive: activeStyle,
		classInactive: inactiveStyle,
	});

	fillFilterContent(engine);
}

function fillFilterContent(engine) {
	const container = document.getElementById("content-tab-filters");
	if (!container || !engine) return;

	try {
		const rawJson = engine.ccall(
			"get_filter_registry_json",
			"string",
			[],
			[],
		);
		const registry = JSON.parse(rawJson);

		container.innerHTML = "";

		Object.entries(registry).forEach(([name, info]) => {
			const card = document.createElement("div");
			card.className =
				"group border border-zinc-800 bg-zinc-900/20 p-4 rounded-xl hover:border-zinc-700 transition-all";

			const paramsList =
				info.params.length > 0
					? `<div class="mt-3 pt-3 border-t border-zinc-800/50 space-y-1">
                    ${info.params
						.map(
							(p) => `
                        <div class="flex gap-2 text-[11px] font-mono leading-tight">
                            <span class="text-cyan-600 shrink-0">→</span>
                            <span class="text-zinc-500">${p}</span>
                        </div>
                    `,
						)
						.join("")}
                   </div>`
					: "";

			card.innerHTML = `
                <div class="flex items-start justify-between mb-2">
                    <h4 class="text-sm font-bold text-zinc-100 font-mono tracking-tight">${name}</h4>
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 uppercase tracking-widest">
                        ${info.category}
                    </span>
                </div>
                <p class="text-xs text-zinc-400 leading-relaxed">${info.description}</p>
                ${paramsList}
            `;
			container.appendChild(card);
		});
	} catch (e) {
		console.error("Failed to load filter registry:", e);
		container.innerHTML = `<p class="text-xs text-red-500">Error loading engine registry.</p>`;
	}
}
