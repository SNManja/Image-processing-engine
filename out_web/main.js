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
    secureFolders();
    loadExamplePics();
    initUI(engine);

    }).catch(err => {
        console.error("Error cargando el motor:", err);
    });
}

function loadExamplePics(){
    window.fileAdmin.addExamplePPM(["paisaje.ppm", "gato.ppm"]);
}

function secureFolders(){
    // Checks if folders exist in memfs
    for (let path of ALL_DIRS){
        if(engine.FS.analyzePath(path).exists === false){
            engine.FS.mkdir(path);
        }
    }
}

function runPipeline(){
    secureFolders();
    const json_pipeline = obtainJSONPipeline();
    engine.ccall('run_pipeline', null, ['string'], [json_pipeline]);

    // updateCanvasRows(); TODO not yet implemented
}



