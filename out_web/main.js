import { FileAdministrator } from "./PPM_processing/FilesAdministrator.js";
import { ALL_DIRS } from "./PPM_processing/paths.js";
import { CanvasSlot } from "./ui/CanvasSlot.js";
import { setupJSONEditor } from "./ui/setupJSONEditor.js";

let engine;
async function runEngine(){
    createEngine().then(async Module => {
    console.log("Wasm engine loaded correctly");
    window.engineModule = Module;
    engine = window.engineModule;
    window.fileAdmin = new FileAdministrator(engine);
    console.log("memfs initialized:", Module.FS);
    secureFolders();
    loadExamplePics();
    initProcessBtn();
    lightBoxSetup();
    setupJSONEditor();

    }).catch(err => {
        console.error("Error cargando el motor:", err);
    });
}

function lightBoxSetup(){

    const modal = document.querySelector("#image-modal");
    const modalCanvas = document.querySelector("#modal-canvas");
    const modalCaption = document.querySelector("#modal-caption");
    const modalSlot = new CanvasSlot(modalCanvas);
    window.openImageModal = (imageData, name) => {
        if (!imageData) return;

        // 1. Preparar contenido
        modalCaption.textContent = name;
        
        // 2. Mostrar la estructura base (quitar el bloqueo de clicks)
        modal.classList.remove("pointer-events-none");
        modal.classList.add("opacity-100");
        

        // 3. Pequeño delay para que el navegador registre el cambio y dispare la transición del contenedor
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

function loadExamplePics(){
    window.fileAdmin.addExamplePPM(["paisaje.ppm", "gato.ppm"]);
}

runEngine();
function secureFolders(){
    // Checks if folders exist in memfs
    for (let path of ALL_DIRS){
        if(engine.FS.analyzePath(path).exists === false){
            engine.FS.mkdir(path);
        }
    }
}
function initProcessBtn(){
const processBtn = document.querySelector("#process-btn");
const statusEl = document.querySelector(".text-zinc-500 span"); // El "idle" del HTML
    processBtn.addEventListener("click", () => {
        window.fileAdmin.cleanFilteredFolder();
        const pipelineData = obtainJSONPipeline();

        if (!pipelineData.ok) {
            console.error("Pipeline Error:", pipelineData.error);
            // ! Show error status in UI
            return;
        }
        console.log("json file \n" + pipelineData.text);
        try {
            //fileAdmin.cleanFilteredFolder();
            const OUTPUT_SUFFIX = "_processed";
            engine.ccall('run_pipeline', null, ['string'], [pipelineData.text]);

            console.log("Pipeline running...");
            window.fileAdmin.updateCanvasRows(OUTPUT_SUFFIX);
            
            console.log("Pipeline executed successfully");
        } catch (e) {
            console.error("Runtime Error:", e);
        }
    });
}


function runPipeline(){
    secureFolders();
    const json_pipeline = obtainJSONPipeline();
    engine.ccall('run_pipeline', null, ['string'], [json_pipeline]);

    // updateCanvasRows(); TODO not yet implemented
}


function obtainJSONPipeline(){
    const el = document.querySelector("#pipeline-json-textarea");
    const text = el?.value ?? "";

    try {
        const obj = JSON.parse(text);
        if (!obj || typeof obj !== "object") throw new Error("JSON root must be an object");
        if (!Array.isArray(obj.pipeline)) throw new Error('Missing "pipeline": expected an array');

        return { ok: true, text, obj };
    } catch (e) {
        return { ok: false, text, error: e.message };
    }

}

