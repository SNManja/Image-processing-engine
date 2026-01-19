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
    }

    cleanFilteredFolder() {
        // Logic to clean filtered folder
    }

    deleteFile(file) {
        // Logic to delete file
    }

}

