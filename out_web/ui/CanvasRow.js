// CanvasRow.js
// Row = 1 fila (Original | Filtered) compatible con tu HTML.
// - Crea el DOM de la fila (grid md:grid-cols-2)
// - Inserta 1 canvas para original
// - Para filtered arranca en "pending" (sin canvas) y después podés reemplazar por canvas.
// - No depende de framework.

export class CanvasRow {
  /**
   * @param {{
   *  step: number,
   *  originalName?: string,
   *  filteredName?: string,
   *  aspect?: string,        // ej "16/9"
   *  makeCanvasIds?: boolean // si querés ids tipo orig0/filt0
   * }} opts
   */
  constructor(opts) {
    this.step = opts.step;
    this.originalName = opts.originalName ?? "—";
    this.filteredName = opts.filteredName ?? "pending";
    this.aspect = opts.aspect ?? "16/9";
    this.makeCanvasIds = opts.makeCanvasIds ?? true;

    this.rootEl = null;
    this.origCanvas = null;
    this.filteredContainer = null;
    this.filteredCanvas = null;
    this.filteredNameEl = null;
    this.originalNameEl = null;
  }

  /**
   * Monta la fila en el contenedor .space-y-3 (dentro del scroll).
   * @param {HTMLElement} rowsParent
   */
  mount(rowsParent) {
    if (!(rowsParent instanceof HTMLElement)) {
      throw new Error("CanvasRow.mount: rowsParent must be an HTMLElement");
    }

    const row = document.createElement("div");
    row.className = "grid gap-4 md:grid-cols-2";
    row.dataset.step = String(this.step);

    const origId = this.makeCanvasIds ? `orig${this.step}` : "";
    const filtId = this.makeCanvasIds ? `filt${this.step}` : "";

    row.innerHTML = `
      <!-- Original card -->
      <div class="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
        <canvas
          ${origId ? `id="${origId}"` : ""}
          class="aspect-[${this.aspect}] w-full rounded-xl border border-zinc-800 bg-zinc-950"
        ></canvas>
        <div class="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
          <span>step ${this.step}</span>
          <span data-role="orig-name"></span>
        </div>
      </div>

      <!-- Filtered card (starts pending placeholder) -->
      <div class="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
        <div
          data-role="filtered-container"
          class="aspect-[${this.aspect}] w-full rounded-xl border border-zinc-800 bg-zinc-950/60"
        >
          <div class="grid h-full place-items-center text-xs text-zinc-500">processing…</div>
        </div>
        <div class="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
          <span>step ${this.step}</span>
          <span data-role="filt-name"></span>
        </div>
      </div>
    `;

    rowsParent.appendChild(row);

    // Cache refs
    this.rootEl = row;
    this.origCanvas = row.querySelector("canvas");
    this.filteredContainer = row.querySelector('[data-role="filtered-container"]');
    this.filteredNameEl = row.querySelector('[data-role="filt-name"]');
    this.originalNameEl = row.querySelector('[data-role="orig-name"]');

    // Fill labels
    this.originalNameEl.textContent = this.originalName;
    this.filteredNameEl.textContent = this.filteredName;

    return this;
  }

  /** Cambia el label del original. */
  setOriginalName(name) {
    this.originalName = name;
    if (this.originalNameEl) this.originalNameEl.textContent = name;
  }

  /** Cambia el label del filtered. */
  setFilteredName(name) {
    this.filteredName = name;
    if (this.filteredNameEl) this.filteredNameEl.textContent = name;
  }

  /**
   * Reemplaza el placeholder de filtered por un canvas (una sola vez).
   * Devuelve el canvas creado (para que lo envuelvas con CanvasSlot después).
   */
  ensureFilteredCanvas() {
    if (!this.filteredContainer) {
      throw new Error("CanvasRow.ensureFilteredCanvas: row not mounted");
    }
    if (this.filteredCanvas) return this.filteredCanvas;

    const canvas = document.createElement("canvas");
    if (this.makeCanvasIds) canvas.id = `filt${this.step}`;
    canvas.className = `aspect-[${this.aspect}] w-full rounded-xl border border-zinc-800 bg-zinc-950`;

    // Limpia placeholder y mete canvas
    this.filteredContainer.innerHTML = "";
    this.filteredContainer.className = ""; // remove the placeholder's border/bg classes
    // En vez de reutilizar el div contenedor con aspect/border,
    // lo reemplazamos por el canvas con las mismas clases (más simple).
    this.filteredContainer.replaceWith(canvas);

    this.filteredCanvas = canvas;
    return canvas;
  }

  /** Acceso directo al canvas original (para armar CanvasSlot afuera). */
  getOriginalCanvas() {
    if (!this.origCanvas) throw new Error("CanvasRow.getOriginalCanvas: row not mounted");
    return this.origCanvas;
  }

  /** Acceso directo al canvas filtered si existe (si no, null). */
  getFilteredCanvas() {
    return this.filteredCanvas;
  }
}
