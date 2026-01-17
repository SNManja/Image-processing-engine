
const testImg = "./paisaje.ppm";
function runEngine(){
    createEngine().then(async Module => {
    console.log("Motor Wasm cargado correctamente");
    window.engineModule = Module;
    console.log("Sistema de archivos virtual (FS):", Module.FS);
    await loadImgToFS(testImg);
    console.log("Imagen " + testImg + " cargada en el sistema de archivos virtual.");
    drawPPM(testImg);
    }).catch(err => {
        console.error("Error cargando el motor:", err);
    });
}
runEngine();

async function loadImgToFS(path) {
    const engine = window.engineModule;

    const response = await fetch(`./${path}`);
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    
    engine.FS.writeFile(path, data);
}


function engineWorkingTest(){
    let engine = window.engineModule;

    const header = new TextEncoder().encode("P6\n2 2\n255\n");

    const json_pipeline = JSON.stringify({
        name: "example_pipeline",
        pipeline: [
            {
                filter: "sepia",
                params: { }
            }
        ],
        statistics: {
            histograms: {
                greyscale: false
            }
        },
        output_suffix: "_processed"
    });
    const pixels = new Uint8Array([
        255, 0, 0,    // Rojo
        0, 255, 0,    // Verde
        0, 0, 255,    // Azul
        255, 255, 255 // Blanco
    ]);

    const p6Data = new Uint8Array(header.length + pixels.length);
    p6Data.set(header);
    p6Data.set(pixels, header.length);


    if(engine.FS.analyzePath('/pics').exists === false){
        engine.FS.mkdir('/pics');
    }
    if(engine.FS.analyzePath('/output').exists === false){
        engine.FS.mkdir('/output');
    }
    if(engine.FS.analyzePath('/output/stats').exists === false){
        engine.FS.mkdir('/output/stats');
    }
    engine.FS.writeFile('/pics/input.ppm', p6Data);
    engine.ccall('run_pipeline', null, ['string'], [json_pipeline]);

    if (engine.FS.analyzePath('/output/output.ppm').exists) {
        const outData = engine.FS.readFile('/output/output.ppm');
        console.log("¡Archivo P6 generado! Tamaño en bytes:", outData.length);
    }
    engineModule.FS.writeFile('/pics/input.ppm', p6Data);
    console.log("Archivo de entrada creado en MEMFS.");

} 



function drawPPM(path) {
    const engine = window.engineModule;
    console.log("Leyendo archivo PPM desde: " + path + "\n");
    const data = engine.FS.readFile(path); 

    if (data[0] !== 80 || data[1] !== 54) {
        console.error("Image has to be P6 PPM");
        return;
    }

    let index = 2;
    let width = null;
    let height = null;
    let maxVal = null;
    let widthComplete = false;
    let heightComplete = false;
    let maxValComplete = false;
    let currentValue = "";
    let dontWrite = false;
    while (height == null || width == null || maxVal == null) {
        let currentChar = data[index];
        let currentCharToInt = String.fromCharCode(currentChar);
        if(dontWrite){
            if (currentChar == 10 || currentChar == 13) { // If there's a comment ongoing. Check out if there's a newline
                dontWrite = false; 
            } 
            
        } else if (currentChar === 10 || currentChar == 13 || currentChar === 32 || currentChar == 35) { // Newline space or comment
            if(currentValue != "" && !widthComplete){
                width = parseInt(currentValue);
                widthComplete = true;
            } else if (currentValue != "" && !heightComplete){
                height = parseInt(currentValue);
                heightComplete = true;
            } else if (currentValue != "" && !maxValComplete){
                maxVal = parseInt(currentValue);
                maxValComplete = true;
            }
            if(currentChar == 35){
                dontWrite = true;
            }
            currentValue = "";
        } else {
            currentValue += currentCharToInt;
        }
        index++;
            
    }



    console.log("Los valores obtenidos de la imagen son: Width->" + width + " Height->" + height + " MaxVal->" + maxVal);

    const pixelesInicio = index;

    const canvas = document.getElementById('canvas-preview');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    
    for (let i = 0; i < width * height; i++) {
        let values = [data[pixelesInicio + i * 3], data[pixelesInicio + i * 3 + 1], data[pixelesInicio + i * 3 + 2]];
        imgData.data[i * 4]     = values[0];     // R
        imgData.data[i * 4 + 1] = values[1]; // G
        imgData.data[i * 4 + 2] = values[2]; // B
        imgData.data[i * 4 + 3] = 255;     
    }

    ctx.putImageData(imgData, 0, 0);
    console.log("Imagen dibujada en el canvas.");
}