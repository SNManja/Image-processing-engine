import { getJSONPipelineContent } from "../setupJSONPipelineEditor.js";

export function publishPresetSetup() {
	const publishPresetBtn = document.getElementById("publish-preset-button");
	const modal = document.getElementById("publish-preset-modal");

	if (!publishPresetBtn || !modal) return;

	const closeBtn = document.getElementById("close-publish-preset");
	const cancelBtn = document.getElementById("cancel-publish-preset");
	const form = document.getElementById("publish-preset-form");

	const nameInput = document.getElementById("preset-name-input");
	const descInput = document.getElementById("preset-description-input");
	const preview = document.getElementById("preset-pipeline-preview");

	const confirmBtn = document.getElementById("confirm-publish-preset");

	const statusName = document.getElementById("status-name");
	const statusDesc = document.getElementById("status-description");
	const statusPipeline = document.getElementById("status-pipeline");

	const logEl = document.getElementById("publish-log");

	// ---------- helpers ----------

	let pipelineForPublish;
	function openModal() {
		modal.classList.remove("hidden");
		modal.setAttribute("aria-hidden", "false");
		setError("");
		// reset

		confirmBtn.disabled = true;

		statusName.textContent = "pending";
		statusDesc.textContent = "pending";
		statusPipeline.textContent = "pending";

		// load pipeline
		try {
			const pipelineJSON = getJSONPipelineContent();
			const parsedJSON = JSON.parse(pipelineJSON);
			pipelineForPublish = JSON.stringify(parsedJSON.pipeline, null, 2);
			preview.textContent = pipelineForPublish;
			nameInput.value = parsedJSON.name ?? "";
			descInput.value = parsedJSON.description ?? "";

			nameInput.disabled = true;
			descInput.disabled = true;
			const size = new Blob([pipelineJSON]).size;
			statusPipeline.textContent = size < 50 * 1024 ? "ok" : "too large";
		} catch {
			preview.textContent = "Invalid pipeline";
			statusPipeline.textContent = "invalid";
		}

		validate();
	}

	function closeModal() {
		modal.classList.add("hidden");
		modal.setAttribute("aria-hidden", "true");
	}

	function validate() {
		let valid = true;

		// name
		if (!nameInput.value || nameInput.value.length > 100) {
			statusName.textContent = "invalid";
			valid = false;
		} else {
			statusName.textContent = "ok";
		}

		// description
		if (descInput.value.length > 500) {
			statusDesc.textContent = "too long";
			valid = false;
		} else {
			statusDesc.textContent = "ok";
		}

		// pipeline
		if (statusPipeline.textContent !== "ok") {
			valid = false;
		}

		confirmBtn.disabled = !valid;
	}

	function setError(msg) {
		if (!msg) {
			logEl.textContent = "";
			logEl.classList.add("hidden");
			logEl.classList.remove("text-red-400", "text-green-400");
			return;
		}

		logEl.textContent = msg;
		logEl.classList.remove("hidden");

		// asegurar color rojo
		logEl.classList.remove("text-green-400");
		logEl.classList.add("text-red-400");
	}

	function setSuccess(msg) {
		if (!msg) {
			logEl.textContent = "";
			logEl.classList.add("hidden");
			logEl.classList.remove("text-red-400", "text-green-400");
			return;
		}

		logEl.textContent = msg;
		logEl.classList.remove("hidden");

		// asegurar color verde
		logEl.classList.remove("text-red-400");
		logEl.classList.add("text-green-400");
	}

	// ---------- events ----------

	publishPresetBtn.addEventListener("click", openModal);
	closeBtn.addEventListener("click", closeModal);
	cancelBtn.addEventListener("click", closeModal);

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		const name = nameInput.value.trim();
		const desc = descInput.value.trim();
		const pipeline = pipelineForPublish;
		if (!pipeline) {
			setError("No pipeline found");
			return;
		}
		if (!name) {
			setError("Name is required");
			return;
		}

		confirmBtn.disabled = true;
		try {
			const res = await fetch("/api/publishPreset", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include", // importante si autenticás por cookie/sesión
				body: JSON.stringify({ name, description: desc, pipeline }),
			});

			// 4) Manejo de errores
			if (!res.ok) {
				let msg = `Error ${res.status}`;
				try {
					const data = await res.json();
					msg = data?.error || data?.message || msg;
				} catch {}
				setError(msg);
				return;
			}

			// 5) OK
			const created = await res.json(); // ej: { id, ... }
			// cerrás modal / refrescás lista / redirigís
			setSuccess("Created preset successfully!");
			console.log("Created preset:", created);
		} catch (err) {
			setError("No se pudo conectar al servidor.");
		} finally {
			confirmBtn.disabled = false;
		}
	});
}
