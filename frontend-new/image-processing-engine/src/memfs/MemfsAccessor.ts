import JSZip from "jszip";
import guessMimeType from "../components/Images/guessMimeType";
import type { ImageItem } from "../types";
import type { EngineModule } from "../wasm";

const ORIGINAL_BASE = "/pics"; // ajustar según convención del proyecto
const PROCESSED_BASE = "/output"; // ajustar según convención del proyecto

// Añadir firma mínima del FS usada en este archivo
type FSLike = {
	readdir: (p: string) => string[];
	readFile: (p: string) => Uint8Array | ArrayBuffer;
	analyzePath?: (p: string) => { exists: boolean };
	stat?: (p: string) => { size?: number } | undefined;
	unlink?: (p: string) => void;
	writeFile?: (p: string, data: Uint8Array | ArrayBuffer) => void;
};

export class MemfsAccessor {
	private engine: EngineModule;
	private generatedUrls = new Set<string>();

	constructor(engine: EngineModule) {
		this.engine = engine;

		// Try to ensure /output exists if FS is already available.
		try {
			const maybeFS = (this.engine as any).FS;
			if (maybeFS && typeof maybeFS.readdir === "function") {
				try {
					this.ensureDirExists(PROCESSED_BASE);
					console.debug(
						"MemfsAccessor: ensured output dir at constructor:",
						PROCESSED_BASE,
					);
				} catch (err) {
					console.warn(
						"MemfsAccessor: could not ensure output dir at constructor:",
						err,
					);
				}
			} else {
				// FS not ready yet; caller can call ensureOutputExists() later.
				console.debug(
					"MemfsAccessor: FS not ready in constructor, delayed ensure of",
					PROCESSED_BASE,
				);
			}
		} catch (e) {
			/* ignore */
		}
	}

	// Devuelve las extensiones permitidas por defecto (incluye punto, minúsculas)
	private allowedExtensions(): string[] {
		return [".jpg", ".jpeg", ".png"];
	}

	// Sube un File del browser a MEMFS bajo ORIGINAL_BASE y devuelve el ImageItem creado.
	// Si el archivo no tiene extensión permitida, se rechaza con Error.
	async uploadFile(
		file: File,
		allowedFormats?: string[],
	): Promise<ImageItem> {
		const allowed = (allowedFormats ?? this.allowedExtensions()).map((e) =>
			e.toLowerCase(),
		);

		const parts = file.name.split(".");
		const ext = parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : "";
		if (!allowed.includes(ext)) {
			throw new Error(`Unsupported file extension: ${file.name}`);
		}

		const FS = this.getFS();
		const base = ORIGINAL_BASE.replace(/\/$/, "");
		const dest = `${base}/${file.name}`;

		// intentar crear directorio si no existe (Emscripten FS)
		try {
			const exists = !!FS.analyzePath?.(base)?.exists;
			if (!exists) {
				try {
					(this.engine.FS as any).mkdir(base);
				} catch (e) {
					// ignore mkdir errors (may already exist)
				}
			}
		} catch {
			/* ignore */
		}

		// leer File a ArrayBuffer y escribir como Uint8Array
		const buffer = await file.arrayBuffer();
		const data = new Uint8Array(buffer);

		try {
			(this.engine.FS as any).writeFile(dest, data);
		} catch (err) {
			console.error("Failed to write file to MEMFS:", err);
			throw err;
		}

		// devolver item ya construido
		return this.getImageItem(dest);
	}

	// Sube varios archivos; filtra por allowedFormats internamente.
	// Acepta FileList o Array<File>. Devuelve sólo los ImageItem creados (skipa no válidos).
	async uploadFiles(
		files: FileList | File[],
		allowedFormats?: string[],
	): Promise<ImageItem[]> {
		const arr: File[] = Array.isArray(files) ? files : Array.from(files);
		const allowed = (allowedFormats ?? this.allowedExtensions()).map((e) =>
			e.toLowerCase(),
		);

		const toUpload: File[] = [];
		const skipped: string[] = [];

		for (const f of arr) {
			const parts = f.name.split(".");
			const ext =
				parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : "";
			if (allowed.includes(ext)) {
				toUpload.push(f);
			} else {
				skipped.push(f.name);
			}
		}

		if (skipped.length > 0) {
			console.warn("Skipped files (unsupported format):", skipped);
		}

		const out: ImageItem[] = [];
		for (const f of toUpload) {
			try {
				const item = await this.uploadFile(f, allowed);
				out.push(item);
			} catch (err) {
				console.warn(
					"Skipping upload of file due to error:",
					f.name,
					err,
				);
				throw err;
			}
		}
		return out;
	}
	// Devuelve el FS tipado o lanza si no está disponible
	private getFS(): FSLike {
		if (
			!this.engine ||
			!this.engine.FS ||
			typeof (this.engine.FS as unknown as FSLike).readFile !== "function"
		) {
			throw new Error("MEMFS not available on engine");
		}
		return this.engine.FS as unknown as FSLike;
	}

	// Ensure a directory exists in MEMFS, creating parent segments as needed.
	private ensureDirExists(dirPath: string): void {
		const FS = this.getFS();
		const mkdir = (this.engine.FS as any).mkdir?.bind(this.engine.FS);
		if (typeof mkdir !== "function") {
			throw new Error("Emscripten FS.mkdir not available");
		}

		let normalized = dirPath === "/" ? "/" : dirPath.replace(/\/+$/, "");
		if (normalized === "") normalized = "/";

		try {
			if (FS.analyzePath?.(normalized)?.exists) {
				console.debug("ensureDirExists: already exists:", normalized);
				return;
			}
		} catch {
			// fallback to attempting creation below
		}

		const parts = normalized.split("/").filter(Boolean);
		let accum = dirPath.startsWith("/") ? "/" : "";
		for (let i = 0; i < parts.length; i++) {
			accum = accum === "/" ? `/${parts[i]}` : `${accum}/${parts[i]}`;
			try {
				if (FS.analyzePath?.(accum)?.exists) {
					console.debug("ensureDirExists: segment exists:", accum);
					continue;
				}
				console.debug("ensureDirExists: creating segment:", accum);
				mkdir(accum);
			} catch (err) {
				// ignore EEXIST-like errors; log unexpected ones
				console.debug(
					"ensureDirExists: mkdir ignored/failed for",
					accum,
					err,
				);
			}
		}
	}

	// Public helper to force creation of the output dir (useful if FS was not ready at ctor time)
	public ensureOutputExists(): void {
		try {
			this.ensureDirExists(PROCESSED_BASE);
		} catch (err) {
			console.warn("ensureOutputExists failed:", err);
			throw err;
		}
	}

	// Devuelve listado de paths completos en `dir` filtrado por las extensiones permitidas
	async listImagesInDir(dir: string): Promise<string[]> {
		const FS = this.getFS();
		// ensure directory exists so readdir won't fail unexpectedly
		try {
			this.ensureDirExists(dir);
		} catch (e) {
			// if ensure fails, still attempt to list (and propagate below)
		}

		const entries: string[] = FS.readdir(dir);
		const exts = new Set(this.allowedExtensions());
		const files = entries
			.filter((name) => name !== "." && name !== "..")
			.map((name) => `${dir.replace(/\/$/, "")}/${name}`)
			.filter((p) => {
				const lower = p.toLowerCase();
				return Array.from(exts).some((ext) => lower.endsWith(ext));
			});
		return files;
	}

	async readFile(path: string): Promise<Uint8Array> {
		const FS = this.getFS();
		const bytes = FS.readFile(path);
		return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	}

	async readFileAsBlob(path: string, mime?: string): Promise<Blob> {
		const bytes = await this.readFile(path); // Uint8Array | ArrayBuffer handled by readFile()
		const type = mime ?? guessMimeType(path) ?? "application/octet-stream";

		// normalizar a Uint8Array
		const src = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

		// crear una copia con ArrayBuffer garantizado (evita SharedArrayBuffer)
		const copy = new Uint8Array(src.length);
		copy.set(src);

		// pasar la copia (ArrayBufferView) al Blob constructor
		return new Blob([copy], { type });
	}

	async readFileAsObjectURL(path: string, mime?: string): Promise<string> {
		const blob = await this.readFileAsBlob(path, mime);
		const url = URL.createObjectURL(blob);
		this.generatedUrls.add(url);
		return url;
	}

	revokeObjectURL(url: string | undefined | null) {
		if (!url) return;
		try {
			URL.revokeObjectURL(url);
			this.generatedUrls.delete(url);
		} catch (err) {
			console.error("Failed to revoke ObjectURL:", err);
		}
	}

	// revoca todo lo generado por este accessor (usar en cleanup)
	revokeAll(): void {
		for (const u of Array.from(this.generatedUrls)) {
			try {
				URL.revokeObjectURL(u);
			} catch (err) {
				console.error("Failed to revoke ObjectURL:", err);
			}
		}
		this.generatedUrls.clear();
	}

	exists(path: string): boolean {
		// puedes seguir usando ensureFS() si querés exigir FS; aquí usamos existencia no estricta
		if (!this.engine || !this.engine.FS) return false;
		const FS = this.engine.FS as FSLike;
		const res = !!FS.analyzePath?.(path)?.exists;
		if (!res) console.log("Path wasnt found:", path);
		return res;
	}

	// Construye el path processed a partir del filename y la convención PROCESSED_BASE
	private processedPathFor(originalPath: string): string {
		const name = originalPath.split("/").pop() ?? originalPath;

		const dot = name.lastIndexOf(".");
		const base = dot >= 0 ? name.slice(0, dot) : name;
		const ext = dot >= 0 ? name.slice(dot) : "";

		return `${PROCESSED_BASE.replace(/\/$/, "")}/${base}${ext}`;
	}

	// Devuelve un ImageItem utilizable por el frontend: metadata + srcs (objectURLs)
	// El ImageItem debe ajustarse al shape que uses; se rellena con campos comunes.
	async getImageItem(originalPath: string): Promise<ImageItem> {
		const name = originalPath.split("/").pop() ?? originalPath;
		const processedPath = this.processedPathFor(originalPath);

		const item: Partial<ImageItem> = {
			id: originalPath,
			name,
			originalPath,
			processedPath,
			originalURL: null,
			processedURL: null,
		};

		try {
			item.originalURL = await this.readFileAsObjectURL(originalPath);
		} catch (err: unknown) {
			item.originalURL = null;
		}

		if (this.exists(processedPath)) {
			try {
				item.processedURL =
					await this.readFileAsObjectURL(processedPath);
			} catch (err: unknown) {
				item.processedURL = null;
			}
		} else {
			item.processedURL = null;
		}

		return item as ImageItem;
	}

	// Imprime en consola de forma "pretty" el árbol de ficheros a partir de `root`
	// Ejemplo de uso: memfs.printTree('/'); o memfs.printTree('/pics');
	printTree(root: string = "/"): void {
		// ensure root exists so traversal is meaningful (no-op if already present)
		try {
			this.ensureDirExists(root);
		} catch {
			/* ignore ensure errors for printTree */
		}

		const FS = this.getFS();

		const traverse = (dir: string, prefix: string) => {
			let entries: string[];
			try {
				entries = FS.readdir(dir)
					.filter((e) => e !== "." && e !== "..")
					.sort();
			} catch (err) {
				console.warn(`Cannot read directory: ${dir}`);
				return;
			}

			entries.forEach((entry, idx) => {
				const isLast = idx === entries.length - 1;
				const full = `${dir.replace(/\/$/, "")}/${entry}`;
				let isDirectory = false;
				try {
					FS.readdir(full);
					isDirectory = true;
				} catch {
					isDirectory = false;
				}

				let sizeInfo = "";
				if (!isDirectory && typeof FS.stat === "function") {
					try {
						const st = FS.stat(full);
						if (st && typeof st.size === "number") {
							sizeInfo = ` (${st.size} bytes)`;
						}
					} catch {
						// ignore stat errors
					}
				}

				const line = `${prefix}${isLast ? "└─ " : "├─ "}${entry}${isDirectory ? "/" : ""}${sizeInfo}`;
				console.log(line);

				if (isDirectory)
					traverse(full, prefix + (isLast ? "   " : "│  "));
			});
		};

		console.log(root.replace(/\/$/, "") || "/");
		traverse(root === "/" ? "/" : root.replace(/\/$/, ""), "");
	}

	// Actualiza una lista de ImageItem: asegura originalURL (si faltaba) y siempre refresca processedURL.
	// - Si falta original y no se encuentra en MEMFS -> se descarta el item (no se incluye en el resultado).
	// - Si processed no existe -> processedURL queda null.
	// - Si se reemplaza un processedURL anterior, lo revoca para evitar leaks.
	async refreshImageItems(items: ImageItem[]): Promise<ImageItem[]> {
		const out: ImageItem[] = [];

		for (const it of items) {
			const originalPath = it.originalPath;
			const processedPath = it.processedPath;
			console.log("expected processedPath:", processedPath);
			this.printTree("/output");

			// 1) ORIGINAL: si ya tiene URL, la respetamos; si no, intentamos obtenerla.
			let originalURL = it.originalURL ?? null;
			if (!originalURL) {
				if (!originalPath) {
					console.warn(
						"ImageItem missing originalPath, removing from list:",
						it,
					);
					continue; // descartar
				}
				if (!this.exists(originalPath)) {
					console.warn(
						"Original not found in MEMFS, removing from list:",
						originalPath,
					);
					continue; // descartar
				}
				try {
					originalURL = await this.readFileAsObjectURL(originalPath);
				} catch (err: unknown) {
					console.warn(
						"Failed to read original from MEMFS, removing from list:",
						originalPath,
						err,
					);
					continue; // descartar si no podemos leer el original
				}
			}
			console.log(
				"Passed first check originalURL for",
				originalPath,
				"got",
				originalURL,
			);
			// 2) PROCESSED: siempre comprobar y regenerar url si existe, o limpiar si no existe.
			let processedURL: string | null = null;
			// revocar previo si vamos a reemplazarlo (hacerlo después de generar la nueva URL para no perderla en caso de error)
			const prevProcessedURL = it.processedURL ?? null;

			if (processedPath && this.exists(processedPath)) {
				try {
					const newProcessedURL =
						await this.readFileAsObjectURL(processedPath);
					processedURL = newProcessedURL;
					// revocar antiguo solo si distinto
					this.revokeObjectURL(prevProcessedURL);
				} catch (err: unknown) {
					console.warn(
						"Failed to read processed from MEMFS, leaving processedURL null for:",
						processedPath,
						err,
					);
					// si falla la lectura dejamos processedURL en null (y no revocamos el previo)
					processedURL = null;
				}
			} else {
				// no existe processed: revocar previo y dejar null
				if (prevProcessedURL) this.revokeObjectURL(prevProcessedURL);
				processedURL = null;
			}

			// 3) construir item actualizado e incluir en la salida
			const updated: ImageItem = {
				...it,
				originalURL,
				processedURL,
			};
			out.push(updated);
		}

		return out;
	}

	async buildImageItemsFromOriginals(
		dir: string = ORIGINAL_BASE,
	): Promise<ImageItem[]> {
		const out: ImageItem[] = [];
		let paths: string[] = [];
		try {
			paths = await this.listImagesInDir(dir);
		} catch (err: unknown) {
			console.warn(`Failed to list images in ${dir}:`, err);
			return out;
		}

		for (const p of paths) {
			try {
				const item = await this.getImageItem(p);
				out.push(item);
			} catch (err: unknown) {
				console.warn(`Skipping image ${p} due to error:`, err);
			}
		}

		return out;
	}

	// Crea un ZIP con todo el árbol bajo PROCESSED_BASE y fuerza la descarga en el navegador.
	// Resuelve cuando se ha intentado la descarga, rechaza en caso de error.
	async zipOutputFolder(filename = "output.zip"): Promise<void> {
		const FS = this.getFS();
		const root = PROCESSED_BASE.replace(/\/$/, "") || "/output";

		// make sure output folder exists so we can read it (creates parents)
		try {
			this.ensureDirExists(root);
		} catch (err) {
			// if we cannot ensure dir, surface meaningful error
			throw new Error(
				`Failed to ensure output directory exists: ${String(err)}`,
			);
		}

		const zip = new JSZip();

		const addDir = (dir: string, basePath = "") => {
			let entries: string[];
			try {
				entries = FS.readdir(dir).filter(
					(e) => e !== "." && e !== "..",
				);
			} catch (err) {
				// directorio no legible -> ignorar
				console.warn("Cannot read directory while zipping:", dir, err);
				return;
			}

			for (const entry of entries) {
				const full = `${dir.replace(/\/$/, "")}/${entry}`;
				const rel = basePath ? `${basePath}/${entry}` : entry;
				// detectar si es directorio intentando leerlo
				let isDir = false;
				try {
					FS.readdir(full);
					isDir = true;
				} catch {
					isDir = false;
				}

				if (isDir) {
					addDir(full, rel);
				} else {
					try {
						const data = FS.readFile(full);
						const uint8 =
							data instanceof Uint8Array
								? data
								: new Uint8Array(data);
						zip.file(rel, uint8);
					} catch (err) {
						console.warn(
							"Failed to read file for zipping:",
							full,
							err,
						);
					}
				}
			}
		};

		try {
			addDir(root, "");
			const blob = await zip.generateAsync({
				type: "blob",
				compression: "DEFLATE",
				compressionOptions: { level: 9 },
			});

			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
			// liberar URL después de un tick para evitar problemas en algunos navegadores
			setTimeout(() => {
				try {
					URL.revokeObjectURL(url);
				} catch (e) {
					/* ignore */
				}
			}, 1000);
		} catch (err) {
			console.error("zipOutputFolder failed:", err);
			throw err;
		}
	}

	// alias si prefieres otro nombre
	zipOutFolder(filename = "output.zip"): Promise<void> {
		return this.zipOutputFolder(filename);
	}
}
