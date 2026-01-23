import { CanvasRow } from "../ui/CanvasRow.js";
import { PATHS } from "./paths.js";
import PPMImage from "./PPMImage.js";


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
    }

    updateCanvasRows(output_suffix) { // Updates the canvas rows after processing

        for (let [name, entry] of this.entries) {
            try {
                const { inputPath, img, canvasRow } = entry;
                //const baseName = name.replace(/\.[^/.]+$/, ""); 
                const outputPath = `${PATHS.outputDir}/${name}${output_suffix}.ppm`;

                canvasRow.setFilteredName(img.name + output_suffix);
                
                const filteredImg = PPMImage.FromPath(outputPath);
                canvasRow.drawFiltered(filteredImg.toImageData());
            } catch (e) {
                console.warn(`No se pudo actualizar la fila para: ${name}. ¿El archivo existe?`);
            }
        }
    }

    async addPPMFromUser(file) {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        
        this.loadPPMIntoMemFSAndDOM(file.name, bytes);
    }

    async addExamplePPM(filenames) {
        for (const name of filenames) {
            try {
                // Petición de red al servidor de la web estática
                const resp = await fetch(`${PATHS.examplesDir}/${name}`);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                
                const bytes = new Uint8Array(await resp.arrayBuffer());
                this.loadPPMIntoMemFSAndDOM(name, bytes);
                
            } catch (e) {
                console.error(`Error al cargar el ejemplo ${name}:`, e);
            }
        }
    }

    loadPPMIntoMemFSAndDOM(name, bytes) {
        const FS = this.engine.FS;
        if (this.entries.has(name)) {
            console.warn(`El archivo ${name} ya está cargado.`);
            return;
        }

        try { FS.mkdir(PATHS.picsDir); } catch {}
        const inputPath = `${PATHS.picsDir}/${name}`;
        FS.writeFile(inputPath, bytes);
        
        const img = PPMImage.FromPath(inputPath);
        const rowsParent = document.querySelector("#slot-rows-parent");

        const canvasRow = new CanvasRow({ 
            aspect: `${img.width}/${img.height}`,
            step: this.counter++, 
            originalName: img.name 
        }).mount(rowsParent);
        
        canvasRow.drawOriginal(img.toImageData());
        this.entries.set(img.name, { inputPath, img, canvasRow });
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
            console.log("Archivos en /output eliminados. Carpetas preservadas.");
        } catch (e) {
            console.warn("No se pudo limpiar la carpeta /output o no existe.");
        }
    }

    deleteRow(filename) {
        const FS = this.engine.FS;
        const entry = this.entries.get(filename);
        if (!entry) {
            console.log("Filename " + filename + " wasnt fount in entries. Skip deletion")
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

}

