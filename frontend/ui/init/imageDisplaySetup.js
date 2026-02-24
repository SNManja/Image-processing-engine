import { CanvasSlot } from "../CanvasSlot.js";

export function imageDisplaySetup() {
	const modal = document.querySelector("#image-modal");
	const modalCanvas = document.querySelector("#modal-canvas");
	const modalCaption = document.querySelector("#modal-caption");
	const modalSlot = new CanvasSlot(modalCanvas);
	window.openImageModal = (imageData, bottomText) => {
		if (!imageData) return;

		modalCaption.textContent = bottomText;

		modal.classList.remove("pointer-events-none");
		modal.classList.add("opacity-100");

		setTimeout(() => {
			const container = document.querySelector("#modal-container");
			container.classList.remove("scale-90", "opacity-0");
			container.classList.add("scale-100", "opacity-100");

			modalCanvas.style.width = "100%";
			const ratio = imageData.width / imageData.height;
			modalCanvas.style.width = "90vw";
			modalCanvas.style.height = "auto";
			modalCanvas.style.aspectRatio = `${ratio}`;

			modalSlot.drawImageData(imageData);
		}, 50);
	};

	modal.onclick = () => {
		const container = document.querySelector("#modal-container");

		container.classList.remove("scale-100", "opacity-100");
		container.classList.add("scale-90", "opacity-0");

		modal.classList.remove("opacity-100");
		modal.classList.add("opacity-0", "pointer-events-none");

		setTimeout(() => {
			const ctx = modalCanvas.getContext("2d");
			ctx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);
		}, 300);
	};
}
