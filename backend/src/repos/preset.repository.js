import { computePresetHash } from "../utils/presetHash.js";

export async function insertPreset(
	db,
	creator_id,
	name,
	description,
	pipeline,
) {
	const hash = computePresetHash({ name, pipeline });

	try {
		const [row] = await db("presets")
			.insert({
				creator_id,
				name: name.trim(),
				description: description ?? null,
				pipeline,
				hash,
			})
			.returning("id");

		return row.id;
	} catch (err) {
		// Unique violation en Postgres
		if (err.code === "23505") {
			throw new Error("DUPLICATE_PRESET");
		}

		throw err;
	}
}

const PRESET_SELECT = [
	"id",
	"creator_id",
	"name",
	"description",
	"votes",
	"created_at",
];
const SORT_WHITELIST = new Set(["created_at", "votes", "name"]);

function buildPresetsQuery(
	db,
	{
		q = "",
		sort = "created_at",
		order = "desc",
		limit = 20,
		creator_id,
	} = {},
) {
	const qb = db("presets").select(PRESET_SELECT);

	if (creator_id) qb.where({ creator_id });

	const qTrim = typeof q === "string" ? q.trim() : "";
	if (qTrim) {
		const pattern = `%${qTrim}%`;
		qb.where((b) =>
			b.whereILike("name", pattern).orWhereILike("description", pattern),
		);
	}

	const safeSort = SORT_WHITELIST.has(sort) ? sort : "created_at";
	const safeOrder = String(order).toLowerCase() === "asc" ? "asc" : "desc";
	const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

	return qb
		.orderBy([
			{ column: safeSort, order: safeOrder },
			{ column: "id", order: "desc" },
		])
		.limit(safeLimit);
}

export function fetchPresets(db, query) {
	return buildPresetsQuery(db, query);
}

export function fetchPresetsByCreator(db, creator_id, query) {
	return buildPresetsQuery(db, { ...query, creator_id });
}

export async function fetchPresetPipelineById(db, id) {
	const row = await db("presets").select(["pipeline"]).where({ id }).first();
	return row?.pipeline ?? null;
}
