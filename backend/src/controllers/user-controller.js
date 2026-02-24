import {
	fromSessionIDFindUser,
	setUsernameOnce,
	userWithUsername,
} from "../services/user.services.js";

export async function me(request, reply) {
	const sessionId = request.cookies.session_id;
	if (!sessionId) return reply.code(401).send({ error: "Unauthorized" });

	const { db } = request.server;
	try {
		const user = await fromSessionIDFindUser(db, sessionId);
		console.log("\n\nThis session user: \n ", user, "\n\n\n");

		if (!user) return reply.code(401).send({ error: "Unauthorized" });

		return reply.send({ user });
	} catch (err) {
		request.log.error({ err }, "GET /me failed");
		return reply.code(500).send({ error: "Internal server error" });
	}
}

export async function updateUsername(request, reply) {
	const sessionId = request.cookies.session_id;
	if (!sessionId) return reply.code(401).send({ error: "Unauthorized" });

	const { db } = request.server;

	try {
		const user = await fromSessionIDFindUser(db, sessionId);
		if (!user) return reply.code(401).send({ error: "Unauthorized" });
		if (user.username)
			return reply
				.code(409)
				.send({ error: "Username already set in this user" });

		const { username } = request.body;
		if (!username) return reply.code(400).send({ error: "Bad Request" });

		const normalized = username.trim().toLowerCase();
		if (normalized.length < 3 || normalized.length > 30) {
			return reply.code(400).send({ error: "Invalid username length" });
		}

		if (!/^[a-z0-9_]+$/i.test(normalized))
			return reply.code(400).send({ error: "Invalid username format" });

		if (await userWithUsername(db, normalized)) {
			return reply.code(409).send({ error: "USERNAME_TAKEN" });
		}

		const updatedUser = await setUsernameOnce(db, user.id, normalized);

		return reply.send({ user: updatedUser });
	} catch (err) {
		// Postgres unique violation
		if (err?.code === "23505") {
			return reply.code(409).send({ error: "USERNAME_TAKEN" });
		}
		// Si tu servicio tira un error propio de "already set"
		if (err?.message === "USERNAME_ALREADY_SET") {
			return reply.code(409).send({ error: "USERNAME_ALREADY_SET" });
		}

		request.log.error({ err }, "PATCH /me/updateUsername failed");
		return reply.code(500).send({ error: "Internal server error" });
	}
}
