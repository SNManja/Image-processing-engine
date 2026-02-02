export function uploadLogicSetup() {
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
