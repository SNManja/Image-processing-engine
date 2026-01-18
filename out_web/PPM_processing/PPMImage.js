
export default class PPMImage {
    constructor(width, height, maxVal, data) {
        this.width = width;
        this.height = height;
        this.maxVal = maxVal;
        this.data = data;
    }

    static FromPath(path){
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
        if(data[index] === 10 || data[index] === 13){
            index++;
        }
        const pixelesInicio = index;
        const imgData = new Uint8ClampedArray(width * height * 4);

        for (let i = 0; i < width * height; i++) {
            imgData[i * 4]     = data[pixelesInicio + i * 3]; // R
            imgData[i * 4 + 1] = data[pixelesInicio + i * 3 + 1]; // G
            imgData[i * 4 + 2] = data[pixelesInicio + i * 3 + 2]; // B
            imgData[i * 4 + 3] = 255; // Fills alpha channel (ppm doesn't have alpha)
        }
        return new PPMImage(width, height, maxVal, imgData);
    }

    toImageData(){
        return new ImageData(this.data, this.width, this.height);
    }

    drawImage(containerID){
        const container = document.getElementById(containerID);
        if(!container){
            console.error("Container not found");
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.id = `${canvasId}`; 
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        const imgData = new ImageData(this.data, this.width, this.height);
        ctx.putImageData(imgData, 0, 0);
        container.appendChild(canvas);
        return canvas;
    }
    
}
