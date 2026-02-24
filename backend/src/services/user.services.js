import { getValidSession } from "../repos/sessions.repository.js";
import { findUserByID } from "../repos/user.repository.js";

export async function fromSessionIDFindUser(db, sessionId) {
	const session = await getValidSession(db, sessionId);
	if (!session) return null;

	const user = await findUserByID(db, session.user_id);
	return user ?? null;
}

export async function userWithUsername(db, username) {
	const row = await db("users")
		.select("id")
		.whereRaw("lower(username) = lower(?)", [username])
		.first();

	return !!row;
}

export async function setUsernameOnce(db, userId, username) {
	const rows = await db("users")
		.where({ id: userId })
		.whereNull("username")
		.update({ username })
		.returning(["id", "email", "username", "created_at"]);

	if (!rows?.length) {
		throw new Error("USERNAME_ALREADY_SET");
	}
	return rows[0];
}
