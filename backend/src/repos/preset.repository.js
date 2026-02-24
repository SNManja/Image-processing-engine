export async function insertPreset(
	db,
	creator_id,
	name,
	description,
	pipeline,
) {
	const rows = await db("presets")
		.insert({ creator_id, name, description, pipeline })
		.returning(["id"]);
	if (!rows?.length) throw new Error("PRESET_NOT_CREATED");
	return rows[0].id;
}

export async function fetchPresetsByCreator(
	db,
	creator_id,
	{ limit = 20 } = {},
) {
	return db("presets")
		.select([
			"id",
			"creator_id",
			"name",
			"description",
			"votes",
			"created_at",
		])
		.where({ creator_id })
		.orderBy([
			{ column: "created_at", order: "desc" },
			{ column: "id", order: "desc" },
		])
		.limit(Math.max(1, Math.min(50, Number(limit) || 20)));
}

export async function fetchPresets(db, queryConfig = { limit: 20 }) {
	const { limit } = queryConfig;
	return db("presets")
		.select([
			"id",
			"creator_id",
			"name",
			"description",
			"votes",
			"created_at",
		])
		.orderBy([
			{ column: "created_at", order: "desc" },
			{ column: "id", order: "desc" },
		])
		.limit(Math.max(1, Math.min(50, Number(limit) || 20)));
}

export async function fetchPresetPipelineById(db, id) {
	const row = await db("presets").select(["pipeline"]).where({ id }).first();
	return row?.pipeline ?? null;
}
