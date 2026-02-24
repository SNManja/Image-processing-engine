import { OAuth2Client } from "google-auth-library";
import { createIdentity, findIdentity } from "../repos/identity.repository.js";
import { createUser, findUserIDViaEmail } from "../repos/user.repository.js";

export async function fetchTokenFromProvider(
	provider,
	provider_config,
	code,
	verifier,
) {
	let tokenRes;

	if (provider === "google") {
		const body = new URLSearchParams({
			grant_type: "authorization_code",
			code,
			client_id: provider_config.client_id,
			client_secret: provider_config.client_secret, // típico en "web application"
			redirect_uri: provider_config.redirect_uri,
			code_verifier: verifier,
		});

		tokenRes = await fetch(provider_config.token_url, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		});
	} else if (provider === "github") {
		const body = new URLSearchParams({
			code,
			client_id: provider_config.client_id,
			client_secret: provider_config.client_secret,
			redirect_uri: provider_config.redirect_uri,
			code_verifier: verifier,
		});

		tokenRes = await fetch(provider_config.token_url, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Accept: "application/json",
			},
			body,
		});
	} else {
		return undefined;
	}
	return tokenRes;
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function getIdentityFromService(provider, tokenJson) {
	if (provider == "google") {
		return getGoogleIdentity(tokenJson);
	} else {
		throw new Error("Provider not implemented");
	}
}

async function getGoogleIdentity(tokenJson) {
	const idToken = tokenJson?.id_token;
	if (!idToken) throw new Error("Missing id_token");

	const ticket = await googleClient.verifyIdToken({
		idToken,
		audience: process.env.GOOGLE_CLIENT_ID,
	});

	const payload = ticket.getPayload();

	return {
		provider: "google",
		provider_user_id: payload.sub,
		email: payload.email ?? null,
		email_verified: payload.email_verified ?? null,
		name: payload.name ?? null,
		avatar_url: payload.picture ?? null,
	};
}
export async function linkIdentityWithUser(
	db,
	email,
	provider,
	providerUserID,
) {
	email = email.trim().toLowerCase();
	return db.transaction(async (trx) => {
		let userID = await findIdentity(trx, provider, providerUserID);
		if (userID) return userID;

		userID = await findUserIDViaEmail(trx, email);
		if (!userID) userID = await createUser(trx, email);

		await createIdentity(trx, provider, providerUserID, userID);
		return userID;
	});
}
