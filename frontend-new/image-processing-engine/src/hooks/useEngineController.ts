import { useEffect, useMemo, useRef, useState } from "react";
import { MemfsAccessor } from "../memfs/MemfsAccessor";
import type { EngineStatus, ImageItem } from "../types";
import type { EngineModule } from "../wasm";

declare global {
	interface Window {
		onEngineFinished?: () => void;
		onEngineError?: (msg?: string) => void;
	}
}

type UseEngineControllerResult = {
	images: ImageItem[];
	engineStatus: EngineStatus;
	engineError: string | null;
	handleUploadFiles: (files: FileList | null) => Promise<void>;
	downloadOutputFolder: () => Promise<void>;
	deleteAllImages: () => void;
	handleEngineStart: (jsonPipeline: string) => void;
};

export function useEngineController(
	engine: EngineModule,
): UseEngineControllerResult {
	const [images, setImages] = useState<ImageItem[]>([]);
	const [engineStatus, setEngineStatus] = useState<EngineStatus>("idle");
	const [engineError, setEngineError] = useState<string | null>(null);

	const memfs = useMemo(() => new MemfsAccessor(engine), [engine]);
	const imagesRef = useRef<ImageItem[]>([]);

	useEffect(() => {
		imagesRef.current = images;
	}, [images]);

	// 1) Bootstrap inicial
	useEffect(() => {
		if (!engine) return;

		let cancelled = false;

		(async () => {
			try {
				const items = await memfs.buildImageItemsFromOriginals();
				if (!cancelled) {
					setImages(items);
				}
			} catch (err) {
				console.error("Failed to build image items:", err);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [engine, memfs]);

	// 2) Callbacks globales del engine
	useEffect(() => {
		if (!engine) return;

		async function onFinished() {
			try {
				setEngineStatus("idle");
				memfs.printTree();
				const updated: ImageItem[] = await memfs.refreshImageItems(
					imagesRef.current,
				);

				setImages(updated);
			} catch (err) {
				console.error(
					"Failed to refresh images after engine finished:",
					err,
				);
			}
		}

		function onError(msg?: string) {
			console.error("engine error", msg);
			setEngineStatus("error");
			setEngineError(msg ?? "Engine error");
		}

		window.onEngineFinished = onFinished;
		window.onEngineError = onError;

		return () => {
			delete window.onEngineFinished;
			delete window.onEngineError;
		};
	}, [engine, memfs]);

	async function handleUploadFiles(files: FileList | null) {
		if (!files || files.length === 0) return;

		try {
			const newItems = await memfs.uploadFiles(files);

			if (newItems.length > 0) {
				setImages((prev) => [...prev, ...newItems]);
			}
		} catch (err) {
			console.error("Upload failed:", err);
			alert(
				`Upload failed: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	function formattedTimestamp(): string {
		const d = new Date();
		const pad = (n: number, w = 2) => String(n).padStart(w, "0");

		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
			d.getDate(),
		)}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(
			d.getSeconds(),
		)}-${pad(d.getMilliseconds(), 3)}`;
	}

	function downloadOutputFolder() {
		const filename = `output-${formattedTimestamp()}.zip`;
		return memfs.zipOutputFolder(filename);
	}

	function deleteAllImages() {
		try {
			memfs.revokeAll();
			setImages([]);
		} catch (err) {
			console.error("Failed to delete all images:", err);
		}
	}

	function handleEngineStart(jsonPipeline: string) {
		setEngineStatus("processing");
		setEngineError(null);

		if (!engine) {
			setEngineStatus("error");
			setEngineError("engine not initialized");
			return;
		}

		type EngineLike = {
			run_pipeline?: (json: string) => void;
			cwrap?: (
				ident: string,
				returnType: string | null,
				argTypes: string[],
			) => (...args: unknown[]) => unknown;
		};

		const eng = engine as unknown as EngineLike;

		if (typeof eng.run_pipeline === "function") {
			eng.run_pipeline(jsonPipeline);
			return;
		}

		if (typeof eng.cwrap === "function") {
			const run = eng.cwrap("run_pipeline", null, ["string"]);

			if (typeof run === "function") {
				void run(jsonPipeline);
				return;
			}

			setEngineStatus("error");
			setEngineError("cwrap fallback failed");
			return;
		}

		setEngineStatus("error");
		setEngineError("run_pipeline not available on engine");
	}

	return {
		images,
		engineStatus,
		engineError,
		handleUploadFiles,
		downloadOutputFolder,
		deleteAllImages,
		handleEngineStart,
	};
}
