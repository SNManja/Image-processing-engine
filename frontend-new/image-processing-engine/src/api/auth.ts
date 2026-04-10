/*
Backend api list
	- "/api/auth/:provider/start"
	- "/api/auth/:provider/callback"
	- "/api/auth/logout"
	- "/api/me"
	- "/api/me/updateUsername"
*/

export function startGoogleLogin() {
	window.location.href = "/api/auth/google/start";
}

export async function fetchMe() {
	const res = await fetch("/api/me", {
		method: "GET",
		credentials: "include",
	});

	if (!res.ok) {
		throw new Error(`GET /api/me failed: ${res.status}`);
	}

	return res.json();
}

export async function updateUsername(username: string) {
	const res = await fetch("/api/me/updateUsername", {
		method: "PATCH",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ username }),
	});

	if (!res.ok) {
		throw new Error(`PATCH /api/me/updateUsername failed: ${res.status}`);
	}

	return res.json();
}

export async function logout() {
	const res = await fetch("/api/auth/logout", {
		method: "POST",
		credentials: "include",
	});

	if (!res.ok && res.status !== 204) {
		throw new Error(`Logout failed: ${res.status}`);
	}
}
