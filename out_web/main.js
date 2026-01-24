import { FileAdministrator } from "./PPM_processing/FilesAdministrator.js";
import { ALL_DIRS } from "./PPM_processing/paths.js";
import { initUI } from "./ui/init/initUI.js";
import { setupJSONPipelineEditor } from "./ui/setupJSONPipelineEditor.js";


let engine;
await runEngine();
async function runEngine(){
    try{
        window.engineModule = await createEngine();
        engine = window.engineModule;
        await engine.ready;
        console.log("Wasm engine loaded correctly");
        window.fileAdmin = new FileAdministrator(engine);
        console.log("memfs initialized:", engine.FS);
        ensureFolders();
        setupJSONPipelineEditor();
        initUI(engine);
    }
    catch(e){
        console.log("Failed on setup " + e.message);
    }
}


async function loadExamplePics(){
    await window.fileAdmin.addExamplePPM(["paisaje.ppm", "gato.ppm"]);
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




