import { FileAdministrator } from "./PPM_processing/FilesAdministrator.js";
import { ALL_DIRS } from "./PPM_processing/paths.js";
import { initUI } from "./ui/init/initUI.js";



let engine;
runEngine();
async function runEngine(){
    createEngine().then(async Module => {
    console.log("Wasm engine loaded correctly");
    window.engineModule = Module;
    engine = window.engineModule;
    await engine.ready;
    window.fileAdmin = new FileAdministrator(engine);
    console.log("memfs initialized:", Module.FS);
    ensureFolders();
    loadExamplePics();
    initUI(engine);

    }).catch(err => {
        console.error("Error cargando el motor:", err);
    });
}

function loadExamplePics(){
    window.fileAdmin.addExamplePPM(["paisaje.ppm", "gato.ppm"]);
}

function ensureFolders() {
    for (let path of ALL_DIRS) {
        const cleanPath = path.startsWith('./') ? path.substring(2) : path;
        const parts = cleanPath.split('/');
        let currentPath = '';

        for (const part of parts) {
            currentPath += (currentPath ? '/' : '') + part;
            try {
                if (!engine.FS.analyzePath(currentPath).exists) {
                    engine.FS.mkdir(currentPath);
                    console.log(`Folder created in MEMFS: ${currentPath}`);
                }
            } catch (e) {}
        }
    }
}

function runPipeline(){
    ensureFolders();
    const json_pipeline = obtainJSONPipeline();
    engine.ccall('run_pipeline', null, ['string'], [json_pipeline]);

    // updateCanvasRows(); TODO not yet implemented
}



