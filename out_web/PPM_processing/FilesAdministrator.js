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

    async addFileToMemFS(file) {
        const FS = this.engine.FS;
        try { FS.mkdir("/pics"); } catch {}

        const name = file.name; // ! check normalization
        const inputPath = `${PATHS.picsDir}/${name}`;

        try {
            FS.stat(inputPath);
            throw new Error(`File ${name} already exists`);
        } catch { }
        const bytes = new Uint8Array(await file.arrayBuffer());
        FS.writeFile(inputPath, bytes);
        
        const img = PPMImage.FromPath(inputPath);
        const rowsParent = document.querySelector("#slot-rows-parent");

        const canvasRow = new CanvasRow({ step: this.counter++, originalName: img.name }).mount(rowsParent);
        canvasRow.drawOriginal(img.toImageData());

        this.entries.set(img.name, { inputPath, img, canvasRow });
    }

    updateCanvasRows(output_suffix) { // Updates the canvas rows after processing
        for (let [name, entry] of this.entries) {
            try {
                const { canvasRow, img } = entry;
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

    cleanFilteredFolder() {
        // Logic to clean filtered folder
    }

    deleteFile(file) {
        // Logic to delete file
    }

}

