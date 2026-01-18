
import PPMImage from "./PPMImage.js";


export function getPPMFilesFromFolder(folderPath) { // Returns a list of images
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