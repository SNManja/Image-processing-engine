import { CanvasSlot } from "../CanvasSlot.js";
import { downloadButtonSetup } from "./downloadButtonSetup.js";
import { helpWindowSetup } from "./helpWindowSetup.js";
import { presetsSetup } from "./presetsSetup.js";
import { initProcessBtn } from "./processButton.js";

let engine;
export function initUI(currEngine) {
	engine = currEngine;
	initProcessBtn();
	initUploadLogic();
	imageDisplaySetup();
	helpWindowSetup(engine);
	presetsSetup(engine);
	downloadButtonSetup(engine);
}

function imageDisplaySetup() {
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

function initUploadLogic() {
	const uploadBtn = document.querySelector("#upload-btn");
	const imageInput = document.querySelector("#image-input");

	uploadBtn.addEventListener("click", () => imageInput.click());
	imageInput.addEventListener("change", async (e) => {
		const files = Array.from(e.target.files);
		if (files.length === 0) return;
		for (const file of files) {
			try {
				await window.fileAdmin.addImageFromUser(file);
			} catch (err) {
				console.error(`Error procesando ${file.name}:`, err);
			}
		}
		imageInput.value = "";
	});
}
