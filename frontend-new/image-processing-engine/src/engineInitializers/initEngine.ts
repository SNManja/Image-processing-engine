// src/engineInitializers/initEngine.ts
import type { EngineInitOptions, EngineModule } from "../wasm.d";

// Initialize the Emscripten engine bundle and return a typed Module.
export async function initEngine(): Promise<EngineModule> {
	// Try to import the generated bundle as an ES module first. The Emscripten
	// output may be CommonJS/UMD or a plain script that defines a global
	// `createEngine` factory. If import() doesn't yield a callable factory,
	// fall back to injecting the script tag and read `window.createEngine`.

	let maybeModule: unknown = undefined;
	try {
		// @ts-expect-error dynamic import of generated wasm bundle (no TS declarations)
		maybeModule = await import("../../wasm/engine.js");
	} catch {
		try {
			// @ts-expect-error runtime fallback to /wasm/engine.js
			maybeModule = await import("/wasm/engine.js");
		} catch {
			// keep maybeModule undefined and try script-injection below
			maybeModule = undefined;
		}
	}

	// Candidate factories we can try to call.
	const candidateFromImport =
		(maybeModule as unknown as { default?: unknown })?.default ??
		(maybeModule as unknown);
	let createEngine =
		typeof candidateFromImport === "function"
			? (candidateFromImport as unknown as (
					opts?: EngineInitOptions,
				) => Promise<EngineModule>)
			: undefined;

	// If import didn't expose a function, try the global that the plain script
	// build defines when loaded via a <script> tag (engine.js defines
	// `var createEngine = ...` at top-level).
	if (typeof createEngine !== "function") {
		if (
			typeof (globalThis as unknown as { createEngine?: unknown })
				.createEngine === "function"
		) {
			createEngine = (globalThis as unknown as { createEngine?: unknown })
				.createEngine as (
				opts?: EngineInitOptions,
			) => Promise<EngineModule>;
		} else {
			// If we're in a browser environment, inject the script and wait for it
			// to load so it sets up the global factory.
			if (typeof document !== "undefined") {
				await new Promise<void>((resolve, reject) => {
					const existing = Array.from(
						document.getElementsByTagName("script"),
					).find(
						(s) =>
							(s as HTMLScriptElement).src?.endsWith(
								"/wasm/engine.js",
							) ||
							(s as HTMLScriptElement).src?.endsWith("engine.js"),
					);
					if (existing) {
						// if already present, give it a tick to evaluate
						setTimeout(() => resolve(), 0);
						return;
					}

					const s = document.createElement("script");
					s.src = "/wasm/engine.js";
					s.async = true;
					s.onload = () => resolve();
					s.onerror = () =>
						reject(new Error("Failed to load /wasm/engine.js"));
					document.head.appendChild(s);
				});

				if (
					typeof (globalThis as unknown as { createEngine?: unknown })
						.createEngine === "function"
				) {
					createEngine = (
						globalThis as unknown as { createEngine?: unknown }
					).createEngine as (
						opts?: EngineInitOptions,
					) => Promise<EngineModule>;
				}
			}
		}
	}

	if (typeof createEngine !== "function") {
		throw new Error(
			"Engine factory not found: dynamic import of engine.js did not expose a factory and global createEngine is missing",
		);
	}

	// instantiate the module, pointing locateFile at the wasm location on the
	// server. Adjust this if you copy the .wasm somewhere else during packaging.
	const module = await createEngine({
		locateFile: (path: string) => {
			return `/wasm/${path}`;
		},
	});

	return module;
}
