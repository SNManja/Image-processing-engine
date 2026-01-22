export function debugMEMFSTree(engine, path = "/", indent = "") {
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