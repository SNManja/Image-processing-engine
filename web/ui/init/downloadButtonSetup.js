import { PATHS } from "../../file-processing/paths.js";

export function downloadButtonSetup(engine) {
	const zipBtn = document.getElementById("download-button");
	zipBtn.addEventListener("click", () => downloadOutputFolder(engine));
}

async function downloadOutputFolder(engine) {
	downloadFolder(engine, PATHS.outputDir);
}

async function downloadFolder(engine, path) {
	try {
		const zip = new window.JSZip();
		const cleanPath = path.replace(/^\.\//, "/");
		const files = engine.FS.readdir(cleanPath).filter(
			(f) => f !== "." && f !== "..",
		);

		if (files.length === 0) {
			console.warn("Output folder empty");
			return;
		}

		for (const fileName of files) {
			const filePath = `${cleanPath}/${fileName}`;
			const stat = engine.FS.stat(filePath);

			if (engine.FS.isDir(stat.mode)) continue;

			const data = engine.FS.readFile(filePath);
			zip.file(fileName, data);
		}

		const content = await zip.generateAsync({ type: "blob" });
		const url = URL.createObjectURL(content);
		const link = document.createElement("a");
		link.href = url;
		link.download = `img-engine_export_${Date.now()}.zip`;
		link.click();

		URL.revokeObjectURL(url);
	} catch (err) {
		console.error(`Error en path ${cleanPath}:`, err);
	}
}
