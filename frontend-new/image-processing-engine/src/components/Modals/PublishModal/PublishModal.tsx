import { useEffect, useMemo, useState } from "react";
import { publishPreset } from "../../../api/presets";
import type { EditorHandle } from "../../Pipeline/PipelineEditor";
import "./PublishModal.css";

type PublishModalProps = {
	open: boolean;
	onClose: () => void;
	onPublishSuccess?: (createdPreset: unknown) => void;
	editorRef: React.RefObject<EditorHandle | null>;
};

type PipelineStatus = "pending" | "ok" | "invalid" | "too large";

const MAX_NAME_LENGTH = 70;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_PIPELINE_SIZE_BYTES = 50 * 1024;

function getPipelineSizeBytes(pipeline: unknown): number {
	return new Blob([JSON.stringify(pipeline)]).size;
}

function getStatusClass(status: string): string {
	switch (status) {
		case "ok":
			return "publish-modal__status-value publish-modal__status-value--ok";
		case "invalid":
			return "publish-modal__status-value publish-modal__status-value--invalid";
		case "too long":
			return "publish-modal__status-value publish-modal__status-value--too-long";
		case "too large":
			return "publish-modal__status-value publish-modal__status-value--too-large";
		default:
			return "publish-modal__status-value";
	}
}

export function PublishModal({
	open,
	onClose,
	onPublishSuccess,
	editorRef,
}: PublishModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [pipelineForPublish, setPipelineForPublish] = useState<
		unknown[] | null
	>(null);
	const [pipelinePreview, setPipelinePreview] = useState("");
	const [pipelineStatus, setPipelineStatus] =
		useState<PipelineStatus>("pending");

	const [submitError, setSubmitError] = useState("");
	const [submitSuccess, setSubmitSuccess] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!open) return;

		setSubmitError("");
		setSubmitSuccess("");
		setIsSubmitting(false);

		try {
			const editorContent = editorRef.current?.getValue() ?? "";
			console.log("Editor ref val ", editorContent);
			const parsed = JSON.parse(editorContent);

			const initialName =
				typeof parsed?.name === "string" ? parsed.name : "";
			const initialDescription =
				typeof parsed?.description === "string"
					? parsed.description
					: "";

			setName(initialName);
			setDescription(initialDescription);

			if (!Array.isArray(parsed?.pipeline)) {
				setPipelineForPublish(null);
				setPipelinePreview("Invalid pipeline");
				setPipelineStatus("invalid");
				return;
			}

			const pipeline = parsed.pipeline;
			const preview = JSON.stringify(pipeline, null, 2);
			const size = getPipelineSizeBytes(pipeline);

			setPipelineForPublish(pipeline);
			setPipelinePreview(preview);
			setPipelineStatus(
				size < MAX_PIPELINE_SIZE_BYTES ? "ok" : "too large",
			);
		} catch (e) {
			console.error("Error parsing pipeline JSON for publish modal", e);
			setName("");
			setDescription("");
			setPipelineForPublish(null);
			setPipelinePreview("Invalid pipeline");
			setPipelineStatus("invalid");
		}
	}, [open, editorRef]);

	const trimmedName = name.trim();
	const trimmedDescription = description.trim();

	const nameStatus = useMemo(() => {
		if (!trimmedName) return "invalid";
		if (trimmedName.length > MAX_NAME_LENGTH) return "invalid";
		return "ok";
	}, [trimmedName]);

	const descriptionStatus = useMemo(() => {
		if (description.length > MAX_DESCRIPTION_LENGTH) return "too long";
		return "ok";
	}, [description]);

	const isFormValid =
		nameStatus === "ok" &&
		descriptionStatus === "ok" &&
		pipelineStatus === "ok" &&
		pipelineForPublish !== null;

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setSubmitError("");
		setSubmitSuccess("");

		if (!pipelineForPublish) {
			setSubmitError("No pipeline found");
			return;
		}

		if (!trimmedName) {
			setSubmitError("Name is required");
			return;
		}

		if (!isFormValid) {
			setSubmitError("Please fix the invalid fields before publishing");
			return;
		}

		setIsSubmitting(true);

		try {
			const createdPreset = await publishPreset({
				name: trimmedName,
				description: trimmedDescription,
				pipeline: pipelineForPublish,
			});

			setSubmitSuccess("Created preset successfully!");
			onPublishSuccess?.(createdPreset);
		} catch (error) {
			console.error("Publish modal submit failed", error);
			setSubmitError(
				error instanceof Error ? error.message : "Unexpected error",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	if (!open) return null;

	return (
		<div className="publish-modal__overlay" aria-hidden={!open}>
			<div
				className="publish-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="publish-modal-title"
			>
				<div className="publish-modal__header">
					<div className="publish-modal__title-wrap">
						<h3
							id="publish-modal-title"
							className="publish-modal__title"
						>
							Publish preset
						</h3>
						<p className="publish-modal__subtitle">
							This preset will be public and visible to the
							community
						</p>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="publish-modal__close"
						aria-label="Close"
						disabled={isSubmitting}
					>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit} className="publish-modal__form">
					<div className="publish-modal__field">
						<label
							htmlFor="preset-name-input"
							className="publish-modal__label"
						>
							Name
						</label>
						<input
							id="preset-name-input"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							maxLength={MAX_NAME_LENGTH}
							placeholder="Preset name (Required)"
							disabled={isSubmitting}
							className="publish-modal__input"
						/>
					</div>

					<div className="publish-modal__field">
						<label
							htmlFor="preset-description-input"
							className="publish-modal__label"
						>
							Description
						</label>
						<textarea
							id="preset-description-input"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							maxLength={MAX_DESCRIPTION_LENGTH}
							placeholder="Description is not required, but highly recommended so users know what this preset does"
							disabled={isSubmitting}
							className="publish-modal__textarea"
						/>
					</div>

					<div className="publish-modal__preview-section">
						<div className="publish-modal__preview-label">
							Pipeline (read-only)
						</div>
						<pre className="publish-modal__preview">
							{pipelinePreview}
						</pre>
					</div>

					<div className="publish-modal__status">
						<div className="publish-modal__status-row">
							<span className="publish-modal__status-label">
								Name
							</span>
							<span className={getStatusClass(nameStatus)}>
								{nameStatus}
							</span>
						</div>

						<div className="publish-modal__status-row">
							<span className="publish-modal__status-label">
								Description
							</span>
							<span className={getStatusClass(descriptionStatus)}>
								{descriptionStatus}
							</span>
						</div>

						<div className="publish-modal__status-row">
							<span className="publish-modal__status-label">
								Pipeline size
							</span>
							<span className={getStatusClass(pipelineStatus)}>
								{pipelineStatus}
							</span>
						</div>
					</div>

					<div className="publish-modal__footer">
						<div className="publish-modal__feedback">
							{submitError ? (
								<p className="publish-modal__feedback--error">
									{submitError}
								</p>
							) : null}
							{submitSuccess ? (
								<p className="publish-modal__feedback--success">
									{submitSuccess}
								</p>
							) : null}
						</div>

						<div className="publish-modal__actions">
							<button
								type="button"
								onClick={onClose}
								disabled={isSubmitting}
								className="publish-modal__btn"
							>
								Cancel
							</button>

							<button
								type="submit"
								disabled={!isFormValid || isSubmitting}
								className="publish-modal__btn publish-modal__btn--primary"
							>
								{isSubmitting
									? "Publishing..."
									: "Publish preset"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
