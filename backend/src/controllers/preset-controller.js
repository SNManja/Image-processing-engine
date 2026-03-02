import {
	fetchPresetPipelineById,
	fetchPresets,
	fetchPresetsByCreator,
} from "../repos/preset.repository.js";
import { getUserIDFromSessionID } from "../repos/sessions.repository.js";
import { validateAndCreatePreset } from "../services/presets.services.js";

function parsePresetsQuery(request) {
	const limit = Number.parseInt(request.query.limit, 10);
	const sort = request.query.sort ?? "created_at";
	const order = (request.query.order ?? "DESC").toUpperCase();
	const q = (request.query.q ?? "").trim();

	const safeLimit = Number.isFinite(limit) ? limit : 20;
	if (safeLimit < 1 || safeLimit > 50)
		throw new Error(`INVALID_LIMIT:${safeLimit}`);

	const SORT_WHITELIST = new Set(["name", "created_at", "votes"]);
	if (!SORT_WHITELIST.has(sort)) throw new Error(`INVALID_SORT:${sort}`);

	if (order !== "ASC" && order !== "DESC")
		throw new Error(`INVALID_ORDER:${order}`);

	return { q, sort, order, limit: safeLimit };
}

export async function getPresets(request, reply) {
	const { db } = request.server;

	let query;
	try {
		query = parsePresetsQuery(request);
	} catch (e) {
		const [kind, val] = String(e.message).split(":");
		return reply.code(400).send({ error: `${kind} ${val ?? ""}`.trim() });
	}

	try {
		const result = await fetchPresets(db, query);
		console.log("This is the result size", result.length);
		return reply.send(result);
	} catch (e) {
		return reply.code(500).send({ error: "Failed to fetch presets" });
	}
}

export async function getUserPresets(request, reply) {
	const { db } = request.server;
	const sessionId = request.cookies.session_id;

	const userId = await getUserIDFromSessionID(db, sessionId);
	if (!userId) return reply.code(401).send({ error: "Unauthorized" });

	let query;
	try {
		query = parsePresetsQuery(request);
	} catch (e) {
		const [kind, val] = String(e.message).split(":");
		return reply.code(400).send({ error: `${kind} ${val ?? ""}`.trim() });
	}

	try {
		const result = await fetchPresetsByCreator(db, userId, query);
		return reply.send(result);
	} catch (e) {
		return reply.code(500).send({ error: "Failed to fetch presets" });
	}
}

export async function createPreset(request, reply) {
	const { db } = request.server;
	const sessionId = request.cookies.session_id;

	const userID = await getUserIDFromSessionID(db, sessionId);

	if (!userID) {
		return reply.code(401).send({ error: "Unauthorized" });
	}

	const { name, description, pipeline } = request.body || {};

	if (!name || !pipeline) {
		return reply.code(400).send({ error: "Missing required fields" });
	}

	/* // TODO
	if (pipelineInvalid(preset)) {
		return reply.code(400).send({ error: "Invalid filter on pipeline" });
	}
	*/
	try {
		const presetId = await validateAndCreatePreset(
			db,
			userID,
			name,
			description,
			pipeline,
		);
		return reply.code(201).send({ id: presetId });
	} catch (error) {
		if (error.message === "DUPLICATE_PRESET") {
			return reply.code(409).send({ error: "Preset already exists" });
		}

		if (error.message === "INVALID_PIPELINE") {
			return reply.code(400).send({ error: "Invalid pipeline" });
		}

		return reply.code(500).send({ error: "Failed to create preset" });
	}
}

export async function getPipelineFromPresetID(request, reply) {
	const { db } = request.server;
	const { id } = request.params;

	if (!id) {
		return reply.code(400).send({ error: "Missing preset ID" });
	}

	try {
		const pipeline = await fetchPresetPipelineById(db, id);
		if (!pipeline) {
			return reply.code(404).send({ error: "Preset not found" });
		}
		return reply.send({ pipeline });
	} catch (error) {
		return reply.code(500).send({ error: "Failed to fetch pipeline" });
	}
}
