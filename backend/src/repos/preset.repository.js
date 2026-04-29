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
	"presets.id",
	"presets.creator_id",
	"presets.name",
	"presets.description",
	"presets.votes",
	"presets.created_at",
	"users.username as creator_name",
];
const SORT_WHITELIST = new Set(["created_at", "votes", "name"]);

function buildPresetsQuery(
	db,
	{
		q = "",
		sort = "created_at",
		order = "desc",
		page = 1,
		limit = 20,
		creator_id,
	} = {},
) {
	const qb = db("presets")
		.leftJoin("users", "presets.creator_id", "users.id")
		.select(PRESET_SELECT);

	if (creator_id) qb.where("presets.creator_id", creator_id);

	const qTrim = typeof q === "string" ? q.trim() : "";
	if (qTrim) {
		const pattern = `%${qTrim}%`;
		qb.where((b) =>
			b
				.whereILike("presets.name", pattern)
				.orWhereILike("presets.description", pattern),
		);
	}

	const safeSort = SORT_WHITELIST.has(sort) ? sort : "created_at";
	const safeOrder = String(order).toLowerCase() === "asc" ? "asc" : "desc";
	const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
	const safePage = Math.max(Number(page) || 1, 1);
	const offset = (safePage - 1) * safeLimit;

	return qb
		.orderBy([
			{ column: `presets.${safeSort}`, order: safeOrder },
			{ column: "presets.id", order: "desc" },
		])
		.limit(safeLimit)
		.offset(offset);
}

async function getGeneralPaginationInfo(
	db,
	{ q = "", page = 1, limit = 20 } = {},
	creator_id = null,
) {
	const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
	const safePage = Math.max(Number(page) || 1, 1);

	const countQuery = db("presets").count("* as total");

	if (creator_id !== null) {
		countQuery.where({ creator_id });
	}

	const qTrim = typeof q === "string" ? q.trim() : "";
	if (qTrim) {
		const pattern = `%${qTrim}%`;
		countQuery.where((b) =>
			b.whereILike("name", pattern).orWhereILike("description", pattern),
		);
	}

	const row = await countQuery.first();
	const total = Number(row?.total ?? 0);

	return {
		page: safePage,
		limit: safeLimit,
		total,
		totalPages: Math.ceil(total / safeLimit),
		hasNext: safePage * safeLimit < total,
		hasPrev: safePage > 1,
	};
}

export async function fetchPresets(db, query) {
	return {
		items: await buildPresetsQuery(db, query),
		pagination: { ...(await getGeneralPaginationInfo(db, query)) },
	};
}

export async function fetchPresetsByCreator(db, creator_id, query) {
	return {
		items: await buildPresetsQuery(db, { ...query, creator_id }),
		pagination: {
			...(await getGeneralPaginationInfo(db, query, creator_id)),
		},
	};
}

export async function fetchPresetPipelineById(db, id) {
	const row = await db("presets").select(["pipeline"]).where({ id }).first();
	return row?.pipeline ?? null;
}
