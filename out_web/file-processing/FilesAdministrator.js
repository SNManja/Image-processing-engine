import { CanvasRow } from "../ui/CanvasRow.js";
import { imageFactory } from "./image-classes/imageFactory.js";
import { PATHS } from "./paths.js";

export class FileAdministrator {
	// This class responsabilities
	/*
    - Add files from user to memfs
    - Update CanvasRows when pipeline runs. Mantaining unicity between original and filtered
    - Cleans filtered folder when pipeline runs.
    - Delete files when users deletes a row.
    
    */

	constructor(engine) {
		this.engine = engine;
		this.entries = new Map(); // id -> entry
		this.counter = 0;
		this.reloadPicsFolder();
	}

	async updateCanvasRows(output_suffix) {
		// Updates the canvas rows after processing

		for (let [name, entry] of this.entries) {
			try {
				const { inputPath, img, canvasRow, ext } = entry;
				//const baseName = name.replace(/\.[^/.]+$/, "");
				const outputPath = `${PATHS.outputDir}/${name}${output_suffix}.${ext}`;

				canvasRow.setFilteredName(img.name + output_suffix);

				const filteredImg = await imageFactory(outputPath, ext);
				canvasRow.drawFiltered(filteredImg.toImageData());
			} catch (e) {
				console.warn(
					`No se pudo actualizar la fila para: ${name}. ¿El archivo existe?`,
				);
			}
		}
	}

	async addImageFromUser(file) {
		const buffer = await file.arrayBuffer();
		const bytes = new Uint8Array(buffer);

		await this.loadImageIntoMemFSAndDOM(file.name, bytes);
	}

	async addExampleImage(filenames) {
		for (const name of filenames) {
			try {
				// Petición de red al servidor de la web estática
				const resp = await fetch(`${PATHS.examplesDir}/${name}`);
				if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

				const bytes = new Uint8Array(await resp.arrayBuffer());
				await this.loadImageIntoMemFSAndDOM(name, bytes);
			} catch (e) {
				console.error(`Error al cargar el ejemplo ${name}:`, e);
			}
		}
	}

	async loadImageIntoMemFSAndDOM(name, bytes) {
		const FS = this.engine.FS;
		if (this.entries.has(name)) {
			console.warn(`El archivo ${name} ya está cargado.`);
			return;
		}

		try {
			FS.mkdir(PATHS.picsDir);
		} catch {}
		const inputPath = `${PATHS.picsDir}/${name}`;
		FS.writeFile(inputPath, bytes);

		const ext = inputPath.split(".").pop();
		const img = await imageFactory(inputPath, ext);
		const rowsParent = document.querySelector("#slot-rows-parent");

		const canvasRow = new CanvasRow({
			aspect: `${img.width}/${img.height}`,
			step: this.counter++,
			originalName: img.name,
		}).mount(rowsParent);
		console.log(
			"This file is currently being added " +
				name +
				" inputPath " +
				inputPath +
				" with path: " +
				ext,
		);

		canvasRow.drawOriginal(img.toImageData());
		this.entries.set(img.name, { inputPath, img, canvasRow, ext });
		//debugMEMFSTree(this.engine);
	}

	cleanFilteredFolder() {
		const FS = this.engine.FS;
		const dirPath = `${PATHS.outputDir}`;

		if (!FS.analyzePath(dirPath).exists) {
			console.warn("La carpeta /output no existe.");
			return;
		}

		try {
			const entries = FS.readdir(dirPath);

			for (const name of entries) {
				// Saltamos las referencias al directorio actual y padre
				if (name === "." || name === "..") continue;

				const fullPath = `${dirPath}/${name}`;
				const stats = FS.stat(fullPath);

				// Solo eliminamos si NO es un directorio
				if (!FS.isDir(stats.mode)) {
					FS.unlink(fullPath);
				}
			}
			console.log(
				"Archivos en /output eliminados. Carpetas preservadas.",
			);
		} catch (e) {
			console.warn("No se pudo limpiar la carpeta /output o no existe.");
		}
	}

	deleteRow(filename) {
		const FS = this.engine.FS;
		const entry = this.entries.get(filename);
		if (!entry) {
			console.log(
				"Filename " +
					filename +
					" wasnt fount in entries. Skip deletion",
			);
			return;
		}
		try {
			entry.canvasRow.destroy();
			if (FS.analyzePath(entry.inputPath).exists) {
				FS.unlink(entry.inputPath);
			}
			this.entries.delete(filename);
		} catch (e) {
			console.log("Failed file deletion: " + e.message);
		}
	}

	async reloadPicsFolder() {
		const FS = this.engine.FS;
		const dirPath = PATHS.picsDir;

		// 1. Limpiar todas las filas actuales de la UI y el Map
		for (let [name, entry] of this.entries) {
			entry.canvasRow.destroy();
		}
		this.entries.clear();
		this.counter = 0; // Reiniciamos el contador de pasos para los ejemplos

		// 2. Verificar si la carpeta existe en el sistema de archivos virtual
		if (!FS.analyzePath(dirPath).exists) {
			console.warn(`La carpeta ${dirPath} no existe en MEMFS.`);
			return;
		}

		try {
			const files = FS.readdir(dirPath);

			for (const name of files) {
				if (name === "." || name === "..") continue;

				const inputPath = `${dirPath}/${name}`;
				const ext = inputPath.split(".").pop();
				const img = await imageFactory(inputPath, ext);
				const rowsParent = document.querySelector("#slot-rows-parent");

				const canvasRow = new CanvasRow({
					aspect: `${img.width}/${img.height}`,
					step: this.counter++,
					originalName: img.name,
				}).mount(rowsParent);

				canvasRow.drawOriginal(img.toImageData());

				this.entries.set(img.name, { inputPath, img, canvasRow, ext });
			}

			console.log(
				`Sincronización completa: ${this.entries.size} imágenes cargadas desde ${dirPath}.`,
			);
		} catch (e) {
			console.error("Error al recargar la carpeta de imágenes:", e);
		}
	}
}
