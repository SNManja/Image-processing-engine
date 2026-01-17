createEngine().then(Module => {
    console.log("Motor Wasm cargado correctamente");
    window.engineModule = Module;
    console.log("Sistema de archivos virtual (FS):", Module.FS);
    test();
    
}).catch(err => {
    console.error("Error cargando el motor:", err);
});



function test(){
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

