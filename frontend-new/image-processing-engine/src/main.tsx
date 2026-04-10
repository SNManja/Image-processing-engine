import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { initEngine } from "./engineInitializers/initEngine";

async function boot() {
	const module = await initEngine();
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<App engine={module} />
		</StrictMode>,
	);
}
boot();
