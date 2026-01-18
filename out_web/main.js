import PPMImage from "./PPM_processing/ppm_class.js";
const testImg = "./pics/paisaje.ppm";

const pics_path = "./pics";
const output_path = "./output";
const stats_path = "./output/stats";

const all_paths = [pics_path, output_path, stats_path];

async function runEngine(){
    createEngine().then(async Module => {
    console.log("Motor Wasm cargado correctamente");
    window.engineModule = Module;
    console.log("Sistema de archivos virtual (FS):", Module.FS);
    await loadImgToFS(testImg);
    console.log("Imagen " + testImg + " cargada en el sistema de archivos virtual.");
    await runPipeline();
    }).catch(err => {
        console.error("Error cargando el motor:", err);
    });
}

runEngine();

async function loadImgToFS(path) {
    const engine = window.engineModule;
    engine.FS.mkdir(pics_path);

    const response = await fetch(`./${path}`);
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    
    engine.FS.writeFile(path, data);
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

    for (let path of all_paths){
        if(engine.FS.analyzePath(path).exists === false){
            engine.FS.mkdir(path);
        }
    }

    let ppmFiles = getPPMFilesFromFolder(pics_path);
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
    ppmFiles = getPPMFilesFromFolder(output_path);
    console.log("Imagenes procesadas: " + ppmFiles.length);
    count = 0;
    for(let img of ppmFiles){
        img.drawImage(id + count);
        count++;
    }
} 


function getPPMFilesFromFolder(folderPath) { // Returns a list of images
    const engine = window.engineModule;
    
    const files = engine.FS.readdir(folderPath);
    const normalizedRoot = folderPath.endsWith('/') ? folderPath : folderPath + '/';
    return files
        .filter(name => {
            console.log("Filtrando archivo: " + name);
            return name.toLowerCase().endsWith('.ppm');
        })
        .map(name => PPMImage.FromPath(normalizedRoot + name));

}