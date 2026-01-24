import { CanvasSlot } from "../CanvasSlot.js";
import { getJSONPipelineContent } from "../setupJSONPipelineEditor.js";
import { downloadButtonSetup } from "./downloadButtonSetup.js";
import { helpWindowSetup } from "./helpWindowSetup.js";
import { presetsSetup } from "./presetsSetup.js";


let engine;
export function initUI(currEngine){
    engine = currEngine;
    initProcessBtn();
    initUploadLogic();
    imageDisplaySetup();
    helpWindowSetup(engine);
    presetsSetup(engine);
    downloadButtonSetup(engine);
}



function imageDisplaySetup(){
    const modal = document.querySelector("#image-modal");
    const modalCanvas = document.querySelector("#modal-canvas");
    const modalCaption = document.querySelector("#modal-caption");
    const modalSlot = new CanvasSlot(modalCanvas);
    window.openImageModal = (imageData, bottomText) => {
        if (!imageData) return;

        modalCaption.textContent = bottomText;
        
        modal.classList.remove("pointer-events-none");
        modal.classList.add("opacity-100");
        

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

function initProcessBtn(){
    const processBtn = document.querySelector("#process-btn");
    const statusEl = document.querySelector("#status-flag"); // El "idle" del HTML
    processBtn.addEventListener("click", () => {
        window.fileAdmin.cleanFilteredFolder();
        const pipelineRaw = getJSONPipeline();

        if (!pipelineRaw.ok) {
            console.error("Pipeline Error:", pipelineRaw.error);
            statusEl.textContent = "Error: " + pipelineRaw.error;
            return;
        }
        console.log("json file \n" + pipelineRaw.text);
        try {
            statusEl.textContent = "Running...";
            processBtn.disabled = true;

            setTimeout(() => {
                const pipelineData = JSON.parse(pipelineRaw.text);
                const OUTPUT_SUFFIX = pipelineData.output_suffix ? pipelineData.output_suffix : "_processed";
                
                engine.ccall('run_pipeline', null, ['string'], [pipelineRaw.text]);

                console.log("Pipeline running...");
                window.fileAdmin.updateCanvasRows(OUTPUT_SUFFIX);
                
                console.log("Pipeline executed successfully");
                
                statusEl.textContent = "idle";
                processBtn.disabled = false;
            }, 50); // 50ms es suficiente para asegurar el repaint en la mayoría de los casos
            
        } catch (e) {
            console.error("Runtime Error:", e);
            statusEl.textContent = "Error";
            processBtn.disabled = false;
        }
    });
}


function initUploadLogic() {
    const uploadBtn = document.querySelector("#upload-btn");
    const ppmInput = document.querySelector("#ppm-input");

    uploadBtn.addEventListener("click", () => ppmInput.click());
    ppmInput.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files);        
        if (files.length === 0) return;
        for (const file of files) {
            try {
                await window.fileAdmin.addPPMFromUser(file);
            } catch (err) {
                console.error(`Error procesando ${file.name}:`, err);
            }
        }
        ppmInput.value = "";
    });
}

function getJSONPipeline() {
    const text = getJSONPipelineContent();

    try {
        if (!text.trim()) throw new Error("El editor está vacío");
        
        const obj = JSON.parse(text);
        if (!obj || typeof obj !== "object") throw new Error("JSON root must be an object");
        if (!Array.isArray(obj.pipeline)) throw new Error('Missing "pipeline": expected an array');

        return { ok: true, text, obj };
    } catch (e) {
        return { ok: false, text, error: e.message };
    }
}