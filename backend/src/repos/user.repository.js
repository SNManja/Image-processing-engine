export async function findUserIDViaEmail(db, email) {
	email = email.trim().toLowerCase();
	const row = await db("users").select("id").where({ email }).first();
	return row ? row.id : null;
}
export async function createUser(db, email) {
	email = email.trim().toLowerCase();
	const [row] = await db("users").insert({ email }).returning(["id"]);
	return row ? row.id : null;
}

export async function findUserByID(db, id) {
	const row = await db("users").where({ id }).first();
	return row ? row : null;
}
