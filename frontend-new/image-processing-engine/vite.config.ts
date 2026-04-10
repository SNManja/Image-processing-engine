import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		{
			name: "coop-coep-headers",
			configureServer(server: unknown) {
				const s = server as {
					middlewares: { use: (fn: unknown) => void };
				};
				s.middlewares.use(
					(_req: unknown, res: unknown, next: unknown) => {
						const r = res as {
							setHeader: (k: string, v: string) => void;
						};
						const n = next as () => void;
						r.setHeader(
							"Cross-Origin-Opener-Policy",
							"same-origin",
						);
						r.setHeader(
							"Cross-Origin-Embedder-Policy",
							"require-corp",
						);
						n();
					},
				);
			},
			configurePreviewServer(server: unknown) {
				const s = server as {
					middlewares: { use: (fn: unknown) => void };
				};
				s.middlewares.use(
					(_req: unknown, res: unknown, next: unknown) => {
						const r = res as {
							setHeader: (k: string, v: string) => void;
						};
						const n = next as () => void;
						r.setHeader(
							"Cross-Origin-Opener-Policy",
							"same-origin",
						);
						r.setHeader(
							"Cross-Origin-Embedder-Policy",
							"require-corp",
						);
						n();
					},
				);
			},
		},
	],
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:5500",
				changeOrigin: true,
			},
		},
	},
});
