import { PATHS } from "./paths.js";
export async function loadImgToFS(path) {
    const engine = window.engineModule;
    engine.FS.mkdir(PATHS.picsDir);

    const response = await fetch(`./${path}`);
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    
    engine.FS.writeFile(path, data);
}