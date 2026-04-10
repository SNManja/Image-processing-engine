import type { EngineStatus, ImageItem } from "../../types";
import ImageSlot from "./ImageSlot";
import "./ImageViewer.css";

type ImageViewerProps = {
	imagePresentation: ImageItem | null;
	engineStatus: EngineStatus;
};

export function ImageViewer({
	imagePresentation,
	engineStatus,
}: ImageViewerProps) {
	if (!imagePresentation) {
		return <div className="viewer-placeholder">No image selected</div>;
	}

	const {
		originalURL: originalSrc,
		processedURL: processedSrc,
		name,
	} = imagePresentation;

	return (
		<div className="image-viewer">
			<div className="viewer-stage">
				<div className="viewer-card">
					<h3 className="viewer-card-title">Original</h3>
					<ImageSlot
						src={originalSrc}
						alt={`${name} original`}
						engineStatus={engineStatus}
						missingLabel="Original not found"
						isOriginal={true}
					/>
				</div>

				<div className="viewer-card">
					<h3 className="viewer-card-title">Processed</h3>
					<ImageSlot
						src={processedSrc}
						alt={`${name} processed`}
						engineStatus={engineStatus}
						missingLabel="Processed not found"
						isOriginal={false}
					/>
				</div>
			</div>

			{/* Engine status shown as simple indicator; errors are handled by parent */}
		</div>
	);
}
