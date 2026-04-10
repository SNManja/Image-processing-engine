/*
Api list:
	- get "/api/communityPresets"
	- get "/api/userPresets"
	- post "/api/publishPresets"
	- get "/api/pipeline/:id"


*/
function parseParams(query: string, sort: string) {
	const params = new URLSearchParams();

	if (query.trim() !== "") {
		params.set("q", query.trim());
	}

	params.set("limit", "20");

	if (sort === "newest") {
		params.set("sort", "created_at");
		params.set("order", "DESC");
	} else {
		params.set("sort", "created_at");
		params.set("order", "ASC");
	}
	return params;
}

export async function fetchUserPresets(
	query: string,
	sort: string,
	page: number,
	signal?: AbortSignal,
) {
	const params = parseParams(query, sort);

	params.set("page", page.toString());

	const res = await fetch(`/api/userPresets?${params.toString()}`, {
		signal,
	});

	if (!res.ok) throw new Error("Failed");

	return res.json();
}

export async function fetchCommunityPresets(
	query: string,
	sort: "newest" | "oldest",
	page: number,
	signal?: AbortSignal,
) {
	const params = parseParams(query, sort);

	params.set("page", page.toString());

	const res = await fetch(`/api/communityPresets?${params.toString()}`, {
		signal,
	});

	if (!res.ok) {
		throw new Error("Failed to fetch community presets");
	}

	return res.json();
}

export async function fetchPresetPipeline(pipelineId: string) {
	const res = await fetch(`/api/pipeline/${pipelineId}`);
	if (!res.ok) {
		throw new Error("Failed to fetch preset pipeline");
	}
	return res.json();
}

export type PublishPresetPayload = {
	name: string;
	description: string;
	pipeline: string | unknown[];
};

export type PublishedPresetResponse = {
	id: string;
	name: string;
	description: string | null;
	pipeline?: unknown[];
	creator_id?: string;
	creator_name?: string | null;
	created_at?: string;
	votes?: number;
};

export async function publishPreset(
	payload: PublishPresetPayload,
	signal?: AbortSignal,
): Promise<PublishedPresetResponse> {
	const normalizedPayload = {
		...payload,
		pipeline:
			typeof payload.pipeline === "string"
				? payload.pipeline
				: JSON.stringify(payload.pipeline, null, 2),
	};

	const response = await fetch("/api/publishPreset", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		signal,
		body: JSON.stringify(normalizedPayload),
	});

	const rawBody = await response.text();

	let parsedBody: unknown = null;
	try {
		parsedBody = rawBody ? JSON.parse(rawBody) : null;
	} catch {
		parsedBody = null;
	}

	if (!response.ok) {
		let message = `HTTP ${response.status} ${response.statusText}`;

		if (
			parsedBody &&
			typeof parsedBody === "object" &&
			parsedBody !== null &&
			("error" in parsedBody || "message" in parsedBody)
		) {
			const body = parsedBody as { error?: string; message?: string };
			message = body.error || body.message || message;
		} else if (rawBody.trim()) {
			message = `${message}\n${rawBody}`;
		}

		console.error("publishPreset failed", {
			status: response.status,
			statusText: response.statusText,
			requestPayload: normalizedPayload,
			rawBody,
			parsedBody,
		});

		throw new Error(message);
	}

	if (parsedBody === null) {
		throw new Error("Server returned an empty or invalid JSON response");
	}

	return parsedBody as PublishedPresetResponse;
}
