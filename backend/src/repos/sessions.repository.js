export async function getValidSession(db, sessionId) {
	const session = await db("sessions")
		.where({ id: sessionId })
		.whereNull("revoked_at")
		.where("expires_at", ">", db.fn.now())
		.first();

	return session ?? null;
}

export async function getUserIDFromSessionID(db, sessionId) {
	const session = await db("sessions")
		.where({ id: sessionId })
		.whereNull("revoked_at")
		.first();

	return session ? session.user_id : null;
}

export async function createSession(
	db,
	userId,
	ip = null,
	days = 30,
	user_agent = null,
) {
	const [row] = await db("sessions")
		.insert({
			user_id: userId,
			expires_at: db.raw("now() + (? || ' days')::interval", [days]),
			ip,
			user_agent,
		})
		.returning(["id"]);
	return row.id;
}

export async function revokeSession(db, sessionId) {
	const updated = await db("sessions")
		.where({ id: sessionId })
		.whereNull("revoked_at")
		.update({ revoked_at: db.fn.now() });

	return updated > 0;
}

export async function cleanupOldSessions(db, days = 30) {
	return await db("sessions")
		.where(
			"expires_at",
			"<",
			db.raw("now() - (? || ' days')::interval", [days]),
		)
		.del();
}
