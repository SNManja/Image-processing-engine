import { useRef } from "react";
import { fetchPresetPipeline } from "../../../api/presets";
import type { PresetListItem } from "./PresetModal";
import "./PresetModal.css";

type PresetCardProps = {
	preset: PresetListItem;
	onApply: (presetJson: string) => void;
};

export function PresetCard({ preset, onApply }: PresetCardProps) {
	const cachedJsonRef = useRef<string | null>(null);
	const pendingRequestRef = useRef<Promise<string> | null>(null);

	async function getPresetJson(): Promise<string> {
		if (cachedJsonRef.current) {
			return cachedJsonRef.current;
		}

		if (pendingRequestRef.current) {
			return pendingRequestRef.current;
		}

		const request = (async () => {
			try {
				const pipeline = await fetchPresetPipeline(preset.id);
				const json = JSON.stringify(pipeline, null, 2);
				cachedJsonRef.current = json;
				return json;
			} finally {
				pendingRequestRef.current = null;
			}
		})();

		pendingRequestRef.current = request;
		return request;
	}

	async function handleApply() {
		try {
			const json = await getPresetJson();
			onApply(json);
		} catch (error) {
			console.error("Failed to apply preset pipeline:", error);
		}
	}

	async function handleCopyJson() {
		try {
			const json = await getPresetJson();
			await navigator.clipboard.writeText(json);
		} catch (error) {
			console.error("Failed to copy preset pipeline JSON:", error);
		}
	}

	return (
		<article className="preset-card">
			<div className="preset-card__info">
				<div className="preset-card__header">
					<h3 className="preset-card__name">{preset.name}</h3>

					<p className="preset-card__meta">
						By {preset.creator_name ?? "Unknown creator"}
					</p>
				</div>

				<p className="preset-card__description">{preset.description}</p>
			</div>

			<div className="preset-card__actions">
				<button
					type="button"
					className="btn btn-primary"
					onClick={handleApply}
				>
					Apply
				</button>

				<button
					type="button"
					className="btn btn-secondary"
					onClick={handleCopyJson}
				>
					Copy JSON
				</button>
			</div>
		</article>
	);
}
