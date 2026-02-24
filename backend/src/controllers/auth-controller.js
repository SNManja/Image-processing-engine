import crypto from "node:crypto";
import {
	fetchTokenFromProvider,
	getIdentityFromService,
	linkIdentityWithUser,
} from "../services/auth.services.js";
import {
	createLoginSession,
	logoutSession,
} from "../services/sessions.services.js";
const PROVIDERS = {
	google: {
		authorize_url: "https://accounts.google.com/o/oauth2/v2/auth",
		token_url: "https://oauth2.googleapis.com/token",
		client_id: process.env.GOOGLE_CLIENT_ID,
		client_secret: process.env.GOOGLE_CLIENT_SECRET,
		redirect_uri: process.env.GOOGLE_REDIRECT_URI,
		scope: "openid email profile",
		extra: {},
	},
	github: {
		authorize_url: "https://github.com/login/oauth/authorize",
		token_url: "https://github.com/login/oauth/access_token",
		client_id: process.env.GITHUB_CLIENT_ID,
		client_secret: process.env.GITHUB_CLIENT_SECRET,
		redirect_uri: process.env.GITHUB_REDIRECT_URI,
		scope: "read:user user:email",
		extra: {},
	},
};

const isProd = process.env.NODE_ENV === "production";
const sameSite = isProd ? "none" : "lax";
const secure = isProd;
const fiveMinutes = 60 * 5;
const thirtyDays = 60 * 60 * 24 * 30;
const oauthCookieOpts = {
	path: "/",
	httpOnly: true,
	secure,
	sameSite,
	maxAge: fiveMinutes,
};

const sessionCookieOpts = {
	path: "/",
	httpOnly: true,
	secure,
	sameSite,
	maxAge: thirtyDays,
};

export function authStart(request, reply) {
	const { provider } = request.params;
	const p = PROVIDERS[provider];

	if (!p) {
		return reply.code(404).send({ error: "Unknown provider" });
	}

	const state = crypto.randomBytes(32).toString("base64url");

	const codeVerifier = crypto.randomBytes(32).toString("base64url");
	const codeChallenge = crypto
		.createHash("sha256")
		.update(codeVerifier)
		.digest("base64url");

	reply.setCookie("oauth_state", state, oauthCookieOpts);
	reply.setCookie("oauth_verifier", codeVerifier, oauthCookieOpts);
	reply.setCookie("oauth_provider", provider, oauthCookieOpts);

	const url = new URL(p.authorize_url);
	url.search = new URLSearchParams({
		client_id: p.client_id,
		redirect_uri: p.redirect_uri,
		response_type: "code",
		scope: p.scope,
		state,
		code_challenge: codeChallenge,
		code_challenge_method: "S256",
		...p.extra,
	}).toString();

	return reply.redirect(url.toString());
}

export async function authCallback(request, reply) {
	const { provider } = request.params;

	const p = PROVIDERS[provider];
	if (!p) return reply.code(404).send({ error: "Unknown provider" });

	const { code, state } = request.query;
	if (!code || !state)
		return reply.code(400).send({ error: "Missing code/state" });

	const stateCookie = request.cookies.oauth_state;
	const verifier = request.cookies.oauth_verifier;
	const providerCookie = request.cookies.oauth_provider;

	if (!stateCookie || !verifier)
		return reply.code(400).send({ error: "Missing oauth cookies" });
	if (providerCookie !== provider)
		return reply.code(400).send({ error: "Provider mismatch" });
	if (state !== stateCookie)
		return reply.code(400).send({ error: "Invalid state" });

	// --- Token exchange ---

	const tokenRes = await fetchTokenFromProvider(provider, p, code, verifier);
	if (!tokenRes)
		return reply.code(400).send({ error: "Provider not implemented" });
	const tokenJson = await tokenRes.json().catch(() => null);
	if (!tokenRes.ok) {
		return reply.code(502).send({
			error: "Token exchange failed",
			details: tokenJson ?? { status: tokenRes.status },
		});
	}

	const userIdentity = await getIdentityFromService(provider, tokenJson);

	console.log("\n\nUser Identity:");
	console.log(userIdentity);
	console.log("\n\n");

	const { db } = request.server;

	if (!userIdentity?.email) {
		return reply
			.code(400)
			.send({ error: "Provider did not return an email" });
	}

	const userId = await linkIdentityWithUser(
		db,
		userIdentity.email,
		provider,
		userIdentity.provider_user_id,
	);
	const sessionId = await createLoginSession(db, userId, request);
	console.log("\n\n sessionId: ", sessionId, "\n\n");

	reply.setCookie("session_id", sessionId, sessionCookieOpts);

	reply.clearCookie("oauth_state", oauthCookieOpts);
	reply.clearCookie("oauth_verifier", oauthCookieOpts);
	reply.clearCookie("oauth_provider", oauthCookieOpts);

	return reply.redirect(process.env.FRONT_URL);
}

export async function logout(request, reply) {
	const sessionId = request.cookies.session_id;

	if (sessionId) {
		const { db } = request.server;
		await logoutSession(db, sessionId);
	}

	reply.clearCookie("session_id", sessionCookieOpts);

	console.log("Session id ", sessionId, " has been revoked");

	return reply.code(204).send();
}
