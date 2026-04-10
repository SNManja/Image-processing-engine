// Minimal TS types for the Emscripten-created engine bundle used in the UI.
// These intentionally avoid `any` and use `unknown` / explicit shapes for safety.

export interface EngineFS {
	readFile?: (path: string, opts?: { encoding?: "binary" }) => Uint8Array;
	// Additional FS helpers may exist but are optional here.
	[key: string]: unknown;
}

export interface EngineModule {
	// cwrap/ccall are commonly exported by Emscripten builds. Keep them optional
	// to match what the generated bundle exposes.
	cwrap?: (
		ident: string,
		returnType?: string | null,
		argTypes?: string[],
		opts?: Record<string, unknown>,
	) => (...args: unknown[]) => unknown;

	ccall?: (
		ident: string,
		returnType?: string | null,
		argTypes?: string[],
		args?: unknown[],
		opts?: Record<string, unknown>,
	) => unknown;

	// MEMFS / FS surface used by the frontend to read image bytes.
	FS?: EngineFS;
	// Some builds expose top-level helpers for simple access
	FS_readFile?: (path: string) => Uint8Array;

	// Standard Emscripten hook
	onRuntimeInitialized?: () => void;

	// Allow other properties that may be present on the module.
	[key: string]: unknown;
}

export interface EngineInitOptions {
	locateFile?: (path: string) => string;
	// allow passing other module options if needed
	[key: string]: unknown;
}

// Allow importing arbitrary JS files (avoid `any` by typing as unknown)
declare module "*.js" {
	const value: unknown;
	export default value;
}

// The emscripten bundle exposes a factory that creates the Module.
// Use a wildcard path to match different build locations.
declare module "*/engine.js" {
	function createEngine(opts?: EngineInitOptions): Promise<EngineModule>;
	export default createEngine;
}
