import {
	createSession,
	getValidSession,
	revokeSession,
} from "../repos/sessions.repository.js";

export async function createLoginSession(db, userId, request) {
	return await createSession(
		db,
		userId,
		request.ip ?? null,
		30,
		request.headers["user-agent"] ?? null,
	);
}

export async function validateSessionId(db, sessionId) {
	const session = await getValidSession(db, sessionId);
	return session ? session.user_id : null;
}

export async function logoutSession(db, sessionId) {
	await revokeSession(db, sessionId);
}
