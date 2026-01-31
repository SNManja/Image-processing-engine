export function createTabsController({
	tabs, // { filters: btnEl, schema: btnEl }
	panels, // { filters: panelEl, schema: panelEl }
	initial = "filters",
	classActive,
	classInactive,
}) {
	const keys = Object.keys(tabs);

	function setActive(activeKey) {
		keys.forEach((k) => {
			const isActive = k === activeKey;
			panels[k]?.classList.toggle("hidden", !isActive);

			if (tabs[k]) {
				tabs[k].className = isActive ? classActive : classInactive;
			}
		});
	}

	keys.forEach((k) => tabs[k]?.addEventListener("click", () => setActive(k)));
	setActive(initial);

	return { setActive };
}
