import { PATHS } from "../../PPM_processing/paths.js";
export function downloadButtonSetup(engine){
    const zipBtn = document.getElementById('download-button');
    zipBtn.addEventListener('click', () => downloadOutputFolder(engine));
}
async function downloadOutputFolder(engine) {
    const zip = new window.JSZip(); // Usamos la global cargada en index.html
    
    const rawPath = PATHS.outputDir;
    const cleanPath = rawPath.replace(/^\.\//, '/'); 

    try {
        const files = engine.FS.readdir(cleanPath).filter(f => f !== "." && f !== "..");

        if (files.length === 0) {
            console.warn("Output folder empty");
            return;
        }

        for (const fileName of files) {
            const filePath = `${cleanPath}/${fileName}`;
            const stat = engine.FS.stat(filePath);

            if (engine.FS.isDir(stat.mode)) continue; 

            const data = engine.FS.readFile(filePath); 
            zip.file(fileName, data);
        }

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const link = document.createElement("a");
        link.href = url;
        link.download = `img-engine_export_${Date.now()}.zip`;
        link.click();
        
        URL.revokeObjectURL(url);

    } catch (err) {
        // Si falla aquí, el motor nos dirá exactamente qué path le molestó
        console.error(`Error en path ${cleanPath}:`, err);
    }
}

function debugMEMFSTree(engine, path = "/", indent = "") {
    try {
        // Leemos el contenido del nivel actual
        const files = engine.FS.readdir(path).filter(f => f !== "." && f !== "..");
        
        files.forEach(name => {
            const fullPath = path === "/" ? `/${name}` : `${path}/${name}`;
            const stat = engine.FS.stat(fullPath);
            const isDir = engine.FS.isDir(stat.mode);
            
            // Imprimimos con íconos para distinguir rápido
            console.log(`${indent}${isDir ? "📁" : "📄"} ${name}`);
            
            // Si es carpeta, bajamos un nivel (recursión)
            if (isDir) {
                debugMEMFSTree(engine, fullPath, indent + "  │ ");
            }
        });
    } catch (e) {
        console.error(`Error leyendo ${path}:`, e);
    }
}