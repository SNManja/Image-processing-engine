export async function findIdentity(client, provider, providerUserId) {
	const identity = await client("user_identities")
		.select("user_id")
		.where({ provider, provider_user_id: providerUserId })
		.first();
	return identity ? identity.user_id : null;
}

export async function createIdentity(knex, provider, providerUserId, userId) {
	const [row] = await knex("user_identities")
		.insert({ provider, provider_user_id: providerUserId, user_id: userId })
		.onConflict(["provider", "provider_user_id"])
		.ignore()
		.returning(["user_id"]);
}
