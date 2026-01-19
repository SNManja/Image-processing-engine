import { CanvasSlot } from "./CanvasSlot.js";

export class CanvasRow {
    constructor(opts) {
        this.step = opts.step;
        this.originalName = opts.originalName ?? "—";
        this.filteredName = opts.filteredName ?? "pending";
        this.aspect = opts.aspect ?? "16/9";

        this.rootEl = null;
        this.origSlot = null;
        this.filtSlot = null;
    }

    mount(rowsParent) {
        const row = document.createElement("div");
        row.className = "grid gap-4 md:grid-cols-2 canvas-row mb-4";
        
        // Estructura de ambas tarjetas (Original y Filtered)
        row.innerHTML = `
            <div class="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                <canvas class="aspect-[${this.aspect}] w-full rounded-xl border border-zinc-800 bg-zinc-950"></canvas>
                <div class="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>step ${this.step}</span>
                    <span data-role="orig-name">${this.originalName}</span>
                </div>
            </div>

            <div class="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                <canvas class="aspect-[${this.aspect}] w-full rounded-xl border border-zinc-800 bg-zinc-950"></canvas>
                <div class="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>step ${this.step}</span>
                    <span data-role="filt-name">${this.filteredName}</span>
                </div>
            </div>
        `;

        rowsParent.appendChild(row);

        // Selección de elementos
        const canvases = row.querySelectorAll("canvas");
        
        // Inicialización inmediata de slots
        this.origSlot = new CanvasSlot(canvases[0]);
        this.filtSlot = new CanvasSlot(canvases[1]);

        // Guardar referencias para updates de texto
        this.rootEl = row;
        this.origNameEl = row.querySelector('[data-role="orig-name"]');
        this.filtNameEl = row.querySelector('[data-role="filt-name"]');

        return this;
    }

    // Métodos limpios para que el FileAdministrator los llame
    drawOriginal(imageData) {
        this.origSlot.drawImageData(imageData);
    }

    drawFiltered(imageData) {
        this.filtSlot.drawImageData(imageData);
    }

    setFilteredName(name) {
        this.filtNameEl.textContent = name;
    }
}