import crypto from "node:crypto";

function stableSort(value) {
	if (Array.isArray(value)) return value.map(stableSort);

	if (value && typeof value === "object") {
		return Object.keys(value)
			.sort()
			.reduce((acc, key) => {
				acc[key] = stableSort(value[key]);
				return acc;
			}, {});
	}

	return value;
}

export function computePresetHash({ name, pipeline }) {
	const canonical = stableSort({
		name: String(name).trim(),
		pipeline,
	});

	const json = JSON.stringify(canonical);

	return crypto.createHash("sha256").update(json).digest("hex");
}
