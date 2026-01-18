import { getPPMFilesFromFolder } from "./PPM_processing/getPPMsFromFolder.js";
import { loadImgToFS } from "./PPM_processing/loadImageToFS.js";
import { ALL_DIRS as ALL_PATHS, PATHS } from "./PPM_processing/paths.js";
import { CanvasRow } from "./ui/CanvasRow.js";
import { drawPPMOnCanvas } from "./ui/drawPPMOnCanvas.js";
async function runEngine(){
    createEngine().then(async Module => {
    console.log("Motor Wasm cargado correctamente");
    window.engineModule = Module;
    console.log("Sistema de archivos virtual (FS):", Module.FS);
    await loadImgToFS(PATHS.testImg);
    console.log("Imagen " + PATHS.testImg + " cargada en el sistema de archivos virtual.");
    testSlots();
    //await runPipeline();
    }).catch(err => {
        console.error("Error cargando el motor:", err);
    });
}

runEngine();




function testSlots(){

    const rowsParent = document.querySelector(".space-y-3"); // mejor si le ponés id="rows"
    const row0 = new CanvasRow({ step: 0, originalName: "original.ppm" }).mount(rowsParent);

    let ppmFiles = getPPMFilesFromFolder(PATHS.picsDir);
    console.log("Imagenes: " + ppmFiles.length);
    const origPPM = ppmFiles[0];
    const origCanvas = row0.getOriginalCanvas();
    drawPPMOnCanvas(origPPM, origCanvas);

    const filtCanvas = row0.ensureFilteredCanvas();
    row0.setFilteredName("output.ppm");
    drawPPMOnCanvas(origPPM, filtCanvas);

}

async function runPipeline(){
    let engine = window.engineModule;

    const json_pipeline = JSON.stringify({
  "name": "example_pipeline",
  "pipeline": [
    {
        "filter": "bnw"
    },
    {
        
        "filter": "alphaBlending" , 
        "params": { "alpha": [0.0, 0.0, 0.0] }
    }
  ],
  "statistics": {
    "histograms": {
      "greyscale": false
    }
  },
  "output_suffix": "_processed"
});

    for (let path of ALL_PATHS){
        if(engine.FS.analyzePath(path).exists === false){
            engine.FS.mkdir(path);
        }
    }

    let ppmFiles = getPPMFilesFromFolder(PATHS.picsDir);
    console.log("Imagenes a procesar: " + ppmFiles.length);
    let id = "baseImg-";
    let count = 0;
    for (let img of ppmFiles){
        console.log("Procesando imagen "+ id + count);
        img.drawImage(id + count);
        count++;
    }
    console.log("Imágenes procesadas.");

    engine.ccall('run_pipeline', null, ['string'], [json_pipeline]);

    id = "outImg-";
    ppmFiles = getPPMFilesFromFolder(PATHS.outputDir);
    console.log("Imagenes procesadas: " + ppmFiles.length);
    count = 0;
    for(let img of ppmFiles){
        img.drawImage(id + count);
        count++;
    }
} 


