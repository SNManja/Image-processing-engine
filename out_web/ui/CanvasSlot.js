// CanvasSlot.js
// Slot = 1 canvas + lógica de resize + draw + placeholder.
// No sabe de "row", "step", "original/filtered". Solo render.

export class CanvasSlot {
  /**
   * @param {HTMLCanvasElement} canvas - canvas YA montado en el DOM (importante para medir size)
   * @param {{ smoothing?: boolean, background?: string }} opts
   */
  constructor(canvas, opts = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("CanvasSlot: expected an HTMLCanvasElement");
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: false });

    this.smoothing = opts.smoothing ?? false;
    this.background = opts.background ?? "#0a0a0a";

    // cache de tamaño para evitar trabajo repetido
    this._lastW = 0;
    this._lastH = 0;
    this._lastDpr = 0;
  }

  /**
   * Ajusta el buffer interno del canvas al tamaño CSS * devicePixelRatio.
   * Esto evita blur y mantiene pixel-perfect si smoothing=false.
   */
  resizeToDisplay() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));

    if (w === this._lastW && h === this._lastH && dpr === this._lastDpr) return false;

    this.canvas.width = w;
    this.canvas.height = h;

    this._lastW = w;
    this._lastH = h;
    this._lastDpr = dpr;

    this.ctx.imageSmoothingEnabled = this.smoothing;
    return true;
  }

  /** Limpia el canvas y pinta fondo. */
  clear() {
    this.resizeToDisplay();
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, w, h);
  }

  /**
   * Placeholder simple (para pending/error).
   * @param {string} text
   */
  showText(text) {
    this.clear();

    const w = this.canvas.width;
    const fontPx = Math.max(14, Math.round(w * 0.045));

    this.ctx.fillStyle = "rgba(255,255,255,0.55)";
    this.ctx.font = `${fontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    this.ctx.fillText(text, Math.round(fontPx * 0.9), Math.round(fontPx * 1.6));
  }

  /**
   * Dibuja ImageData escalándolo al canvas visible.
   * - Si querés pixel-perfect (sin blur), dejá smoothing=false.
   * @param {ImageData} imageData
   */
  drawImageData(imageData) {
    if (!(imageData instanceof ImageData)) {
      throw new Error("CanvasSlot.drawImageData: expected ImageData");
    }

    this.resizeToDisplay();
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Canvas offscreen para convertir ImageData -> bitmap escalable
    const off = document.createElement("canvas");
    off.width = imageData.width;
    off.height = imageData.height;
    off.getContext("2d").putImageData(imageData, 0, 0);

    this.ctx.clearRect(0, 0, w, h);
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, w, h);

    // Escala para encajar (contain) sin deformar
    const scale = Math.min(w / off.width, h / off.height);
    const dw = Math.floor(off.width * scale);
    const dh = Math.floor(off.height * scale);
    const dx = Math.floor((w - dw) / 2);
    const dy = Math.floor((h - dh) / 2);

    this.ctx.drawImage(off, dx, dy, dw, dh);
  }

  /**
   * Dibuja un Bitmap/HTMLImageElement/etc (si más adelante decidís pasar por createImageBitmap).
   * @param {CanvasImageSource} source
   */
  drawSource(source) {
    this.resizeToDisplay();
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, w, h);

    // contain
    const sw = source.width ?? source.videoWidth ?? w;
    const sh = source.height ?? source.videoHeight ?? h;

    const scale = Math.min(w / sw, h / sh);
    const dw = Math.floor(sw * scale);
    const dh = Math.floor(sh * scale);
    const dx = Math.floor((w - dw) / 2);
    const dy = Math.floor((h - dh) / 2);

    this.ctx.drawImage(source, dx, dy, dw, dh);
  }
}
