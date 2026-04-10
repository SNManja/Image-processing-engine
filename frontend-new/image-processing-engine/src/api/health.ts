/*
Health api
- get "/api/health"
- get "/api/db-health"

*/

export async function checkBackendHealth() {
	const res = await fetch("/api/health");

	if (!res.ok) throw new Error("Failed");

	return { ok: true };
}

export async function checkDatabaseHealth() {
	const res = await fetch("/api/db-health");

	if (!res.ok) throw new Error("Failed");

	return { ok: true };
}
