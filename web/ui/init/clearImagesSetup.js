import { createModalController } from "../create-modal-controller.js"; // ajustá path

export function clearImagesSetup() {
	const modalEl = document.getElementById("clear-images-modal");
	const openBtn = document.getElementById("clear-images-button");
	const closeBtn = document.getElementById("close-clear-images");

	const cancelBtn = document.getElementById("cancel-clear-images");
	const confirmBtn = document.getElementById("confirm-clear-images");

	if (!modalEl || !openBtn || !closeBtn || !cancelBtn || !confirmBtn) return;

	const controller = createModalController({
		modalEl,
		openBtn,
		closeBtn,
		closeOnBackdrop: true,
	});

	cancelBtn.addEventListener("click", controller.close);

	confirmBtn.addEventListener("click", async () => {
		window.fileAdmin.cleanPicsFolder();
		window.fileAdmin.cleanFilteredFolder();
		await window.fileAdmin.reloadPicsFolder();
		controller.close();
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && !modalEl.classList.contains("hidden")) {
			controller.close();
		}
	});
}
