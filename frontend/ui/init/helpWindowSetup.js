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
			// card
			const card = document.createElement("div");
			card.className =
				"group border border-zinc-800 bg-zinc-900/20 p-4 rounded-xl hover:border-zinc-700 transition-all";

			// header: name (left) and category pill (right)
			const header = document.createElement("div");
			header.className = "flex items-center justify-between mb-2";

			const title = document.createElement("h4");
			title.className =
				"text-sm font-bold text-zinc-100 font-mono tracking-tight";
			title.textContent = name;

			const rightWrapper = document.createElement("div");
			rightWrapper.className = "flex items-center gap-2";
			if (info.category) {
				const pill = document.createElement("span");
				pill.className =
					"text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 uppercase tracking-widest";
				pill.textContent = info.category;
				rightWrapper.appendChild(pill);
			}

			header.appendChild(title);
			header.appendChild(rightWrapper);

			card.appendChild(header);

			// description
			const descP = document.createElement("p");
			descP.className = "text-xs text-zinc-400 leading-relaxed";
			descP.textContent = info.description || "";
			card.appendChild(descP);

			// params
			const paramNames =
				info.params && typeof info.params === "object"
					? Object.keys(info.params)
					: [];
			if (paramNames.length > 0) {
				const paramsWrap = document.createElement("div");
				paramsWrap.className =
					"mt-3 pt-3 border-t border-zinc-800/50 space-y-2";

				paramNames.forEach((p) => {
					const param =
						info.params && info.params[p] ? info.params[p] : {};
					const type = param.type || "?";
					const pDesc = param.description || "";

					const row = document.createElement("div");
					row.className = "flex items-start gap-2 text-[12px]";

					const arrow = document.createElement("span");
					arrow.className = "text-cyan-600 shrink-0";
					arrow.textContent = "→";

					const nameSpan = document.createElement("span");
					nameSpan.className =
						"text-zinc-300 font-mono whitespace-nowrap";
					nameSpan.textContent = `${p} (${type}):`;

					const descSpan = document.createElement("span");
					descSpan.className = "text-zinc-400 truncate";
					descSpan.style.maxWidth = "60%";
					descSpan.textContent = ` ${pDesc}`;

					row.appendChild(arrow);
					row.appendChild(nameSpan);
					row.appendChild(descSpan);

					paramsWrap.appendChild(row);

					// if string restriction has allowedValues, render them
					const restriction = param.restriction || {};
					if (
						restriction.allowedValues &&
						Array.isArray(restriction.allowedValues) &&
						restriction.allowedValues.length > 0
					) {
						const allowedRow = document.createElement("div");
						allowedRow.className = "ml-8 text-[11px] text-zinc-500";
						const prefix = document.createElement("span");
						prefix.textContent = "Valid values are: ";
						allowedRow.appendChild(prefix);

						restriction.allowedValues.forEach((v, idx) => {
							const code = document.createElement("code");
							code.className =
								"px-1 py-0.5 bg-zinc-800 rounded text-[11px] text-zinc-300 mr-2";
							code.textContent = v;
							allowedRow.appendChild(code);
						});

						paramsWrap.appendChild(allowedRow);
					}
				});

				card.appendChild(paramsWrap);
			}

			container.appendChild(card);
		});
	} catch (e) {
		console.error("Failed to load filter registry:", e);
		container.innerHTML = `<p class="text-xs text-red-500">Error loading engine registry.</p>`;
	}
}
