export type EngineStatus = "idle" | "processing" | "error";

export type ImageItem = {
	id: string;
	name: string;
	originalPath: string;
	processedPath: string;
	originalURL?: string | null;
	processedURL?: string | null;
	width?: number | null;
	height?: number | null;
};

export type PipelineStep = {
	id: string;
	filter: string;
	params: Record<string, unknown>;
};

export type PipelineData = {
	steps: PipelineStep[];
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type User = {
	id: string;
	email: string;
	username?: string | null;
	created_at: string;
};
