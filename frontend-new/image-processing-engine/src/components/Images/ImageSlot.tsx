import type { EngineStatus } from "../../types";
import "./ImageSlot.css";

type ImageSlotProps = {
	src: string | null | undefined;
	alt: string;
	engineStatus: EngineStatus;
	missingLabel?: string;
	isOriginal: boolean;
};

export default function ImageSlot({
	src,
	alt,
	engineStatus,
	missingLabel = "Not available",
	isOriginal,
}: ImageSlotProps) {
	// Priority: if engine is processing, show loading; if error, show error; else show image if present, otherwise placeholder
	if (engineStatus === "processing" && !isOriginal) {
		return (
			<div className="viewer-placeholder viewer-loading" aria-busy="true">
				Loading…
			</div>
		);
	}

	if (engineStatus === "error" && !isOriginal) {
		return <div className="viewer-placeholder viewer-error">Error</div>;
	}

	// idle
	return (
		<div className="image-slot">
			{src ? (
				<img className="image-slot-img" src={src} alt={alt} />
			) : (
				<div className="image-slot-placeholder">{missingLabel}</div>
			)}
		</div>
	);
}
