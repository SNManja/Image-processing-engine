export function createModalController({
	modalEl,
	openBtn,
	closeBtn,
	closeOnBackdrop = true,
}) {
	if (!modalEl) throw new Error("modalEl is required");

	function open() {
		modalEl.classList.remove("hidden");
	}
	function close() {
		modalEl.classList.add("hidden");
	}

	openBtn?.addEventListener("click", open);
	closeBtn?.addEventListener("click", close);

	if (closeOnBackdrop) {
		modalEl.addEventListener("click", (e) => {
			if (e.target === modalEl) close();
		});
	}

	return { open, close };
}
