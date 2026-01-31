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
		row.className = "grid gap-4 md:grid-cols-2 canvas-row mb-8";

		row.innerHTML = `
            <div class="relative group rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3 transition-all hover:border-zinc-700">
                
                <button class="delete-btn absolute top-5 right-5 z-10 
                               opacity-0 group-hover:opacity-100 
                               flex h-6 w-6 items-center justify-center rounded-lg
                               bg-red-500/10 text-red-500 border border-red-500/20
                               hover:bg-red-500 hover:text-white 
                               transition-all duration-200 shadow-xl backdrop-blur-sm"
                        title="Remove image from pipeline">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <canvas class="aspect-[${this.aspect}] w-full rounded-xl border border-zinc-800 bg-zinc-950 image-render-pixelated"></canvas>
                <div class="mt-2 flex items-center justify-between text-[11px] text-zinc-500 px-1">
                    <span>step ${this.step}</span>
                    <span data-role="orig-name" class="font-mono">${this.originalName}</span>
                </div>
            </div>

            <div class="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                <canvas class="aspect-[${this.aspect}] w-full rounded-xl border border-zinc-800 bg-zinc-950 image-render-pixelated"></canvas>
                <div class="mt-2 flex items-center justify-between text-[11px] text-zinc-500 px-1">
                    <span>step ${this.step}</span>
                    <span data-role="filt-name" class="font-mono">${this.filteredName}</span>
                </div>
            </div>
        `;

		rowsParent.appendChild(row);

		const deleteBtn = row.querySelector(".delete-btn");
		deleteBtn.onclick = (e) => {
			e.stopPropagation();
			window.fileAdmin.deleteRow(this.originalName);
		};

		// Selección de elementos para Slots y Modal
		const canvases = row.querySelectorAll("canvas");
		canvases.forEach((canvas, index) => {
			canvas.classList.add("cursor-zoom-in");
			canvas.onclick = () => {
				const slot = index === 0 ? this.origSlot : this.filtSlot;
				window.openImageModal(
					slot.lastImageData,
					"Tip: Click to close image preview",
				);
			};
		});

		this.origSlot = new CanvasSlot(canvases[0]);
		this.filtSlot = new CanvasSlot(canvases[1]);
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

	destroy() {
		if (this.rootEl) {
			this.rootEl.remove();
		}

		// Limpieza de referencias
		this.origSlot = null;
		this.filtSlot = null;
		this.rootEl = null;
	}
}
