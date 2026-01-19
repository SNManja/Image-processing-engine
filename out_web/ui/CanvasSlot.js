export class CanvasSlot {
    constructor(canvas, opts = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.smoothing = opts.smoothing ?? false;
        
        // El color de fondo para el "contain"
        this.bg = "#09090b"; 
    }

    /**
     * Sincroniza el buffer interno del canvas con el tamaño CSS.
     * Es vital llamarlo antes de dibujar porque el grid de Tailwind puede 
     * cambiar el tamaño del elemento según el viewport.
     */
    syncBuffer() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        const targetW = Math.floor(rect.width * dpr);
        const targetH = Math.floor(rect.height * dpr);

        if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
            this.canvas.width = targetW;
            this.canvas.height = targetH;
        }
        
        this.ctx.imageSmoothingEnabled = this.smoothing;
    }

    /**
     * Dibuja ImageData aplicando "contain" (encajar sin deformar).
     */
    drawImageData(imageData) {
        const aspect = imageData.width / imageData.height;
        this.canvas.style.aspectRatio = `${aspect}`;
        this.syncBuffer();
        const { width: cw, height: ch } = this.canvas;

        // 1. Limpiar con el fondo
        this.ctx.fillStyle = this.bg;
        this.ctx.fillRect(0, 0, cw, ch);

        // 2. Crear buffer temporal para escalar (ImageData no se puede escalar directo)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);

        // 3. Calcular proporciones (Logic: Contain)
        const scale = Math.min(cw / imageData.width, ch / imageData.height);
        const x = (cw / 2) - (imageData.width / 2) * scale;
        const y = (ch / 2) - (imageData.height / 2) * scale;

        this.ctx.drawImage(
            tempCanvas, 
            0, 0, imageData.width, imageData.height, // source
            x, y, imageData.width * scale, imageData.height * scale // destination
        );
    }

    /**
     * Estado inicial o error.
     */
    clear(text = "") {
        this.syncBuffer();
        this.ctx.fillStyle = this.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (text) {
            this.ctx.fillStyle = "#52525b";
            this.ctx.font = "12px ui-monospace, monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
        }
    }
}