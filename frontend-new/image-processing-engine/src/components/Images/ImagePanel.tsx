import { useRef, useState } from "react";
import type { EngineStatus, ImageItem } from "../../types";
import "./ImagePanel.css";
import { ImageViewer } from "./ImageViewer";

type ImagePanelProps = {
	images: ImageItem[];
	selectedImageId: string | null;
	onSelectImage: (id: string) => void;
	engineStatus: EngineStatus;
	downloadOutputFolder: () => Promise<void>;
	onOpenClearModal: () => void;
	onUploadFiles?: (files: FileList | null) => void; // nuevo prop opcional
};

export default function ImagePanel({
	images,
	selectedImageId,
	onSelectImage,
	engineStatus,
	downloadOutputFolder,
	onOpenClearModal,
	onUploadFiles,
}: ImagePanelProps) {
	const selectedImage =
		images.find((image) => image.id === selectedImageId) ?? null;

	const [downloading, setDownloading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const handleDownload = async () => {
		try {
			setDownloading(true);
			await downloadOutputFolder();
		} catch (err) {
			console.error("Download failed", err);
			alert("Error descargando la carpeta procesada");
		} finally {
			setDownloading(false);
		}
	};

	const onUploadClick = () => {
		if (fileInputRef.current) fileInputRef.current.click();
	};

	const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0 && typeof onUploadFiles === "function") {
			onUploadFiles(files);
		}
		// reset value so same file can be selected again if needed
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	return (
		<section className="panel">
			<div className="panel-header">
				<div className="panel-title-block">
					<h2>Images</h2>
					<p className="panel-subtitle">
						Total: {images.length} · Status: {engineStatus}
					</p>
				</div>

				<div className="panel-toolbar">
					<button
						className="btn btn-secondary"
						onClick={onOpenClearModal}
					>
						Clear
					</button>
					<button
						className="btn btn-secondary"
						onClick={onUploadClick}
					>
						Upload
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept=".png,.jpg,.jpeg,.ppm"
						style={{ display: "none" }}
						onChange={onFilesSelected}
						multiple
					/>
					<button
						className="btn btn-secondary"
						onClick={handleDownload}
						disabled={downloading}
					>
						{downloading ? "Downloading..." : "Download"}
					</button>
				</div>
			</div>

			<div className="panel-body">
				<div
					className="image-strip"
					role="tablist"
					aria-label="Image thumbnails"
				>
					{images.map((image) => (
						<button
							key={image.id}
							type="button"
							className={
								image.id === selectedImageId
									? "thumb active"
									: "thumb"
							}
							onClick={() => onSelectImage(image.id)}
							title={image.name}
						>
							{image.name}
						</button>
					))}
				</div>

				<ImageViewer
					imagePresentation={selectedImage}
					engineStatus={engineStatus}
				/>
			</div>
		</section>
	);
}
