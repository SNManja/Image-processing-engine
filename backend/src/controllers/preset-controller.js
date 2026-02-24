import {
	fetchPresetPipelineById,
	fetchPresets,
	fetchPresetsByCreator,
} from "../repos/preset.repository.js";
import { getUserIDFromSessionID } from "../repos/sessions.repository.js";
import { validateAndCreatePreset } from "../services/presets.services.js";

export async function getPresets(request, reply) {
	const { db } = request.server;
	const query = {
		sort: request.query.sort || "created_at",
		order: request.query.order || "ASC",
		q: (request.query.q ?? "").trim() || "",
		limit: parseInt(request.query.limit, 10) || 20,
	};

	if (query.limit > 50 || query.limit < 1) {
		return reply.code(400).send({ error: `Invalid limit: ${query.limit}` });
	}
	if (query.sort !== "name" && query.sort !== "created_at") {
		return reply.code(400).send({ error: `Invalid sort: ${query.sort}` });
	}
	query.order = query.order.toUpperCase();
	if (query.order !== "ASC" && query.order !== "DESC") {
		return reply.code(400).send({ error: `Invalid order: ${query.order}` });
	}

	const result = await fetchPresets(db, query);
	return reply.send(result);
}

export async function getUserPresets(request, reply) {
	const { db } = request.server;
	const sessionId = request.cookies.session_id;

	const userId = await getUserIDFromSessionID(db, sessionId);

	if (!userId) {
		return reply.code(401).send({ error: "Unauthorized" });
	}

	const query = {
		sort: request.query.sort || "created_at",
		order: request.query.order || "ASC",
		limit: parseInt(request.query.limit, 10) || 20,
	};

	if (query.limit > 50 || query.limit < 1) {
		return reply.code(400).send({ error: `Invalid limit: ${query.limit}` });
	}
	if (query.sort !== "name" && query.sort !== "created_at") {
		return reply.code(400).send({ error: `Invalid sort: ${query.sort}` });
	}
	query.order = query.order.toUpperCase();
	if (query.order !== "ASC" && query.order !== "DESC") {
		return reply.code(400).send({ error: `Invalid order: ${query.order}` });
	}
	try {
		const result = await fetchPresetsByCreator(db, userId, query);
		return reply.send(result);
	} catch (error) {
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

	if (!name || !description || !pipeline) {
		return reply.code(400).send({ error: "Missing required fields" });
	}
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
		console.log("\n\n", error);
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
