import React, { useRef, useState } from "react";
import type { EngineStatus } from "../../types.ts";
import ToggleSwitch from "../ui/ToggleSwitch";
import type { EditorHandle } from "./PipelineEditor.tsx";
import { PipelineEditor } from "./PipelineEditor.tsx";

// Import CSS that enforces the dark theme for the editor container
import "./PipelinePanel.css";

export type PipelinePanelProps = {
	// ahora el pipeline es requerido (no opcional) para coincidir con la firma de App
	handleEngineStart: (json_pipeline: string) => void;
	engineStatus: EngineStatus;
	engineError: string | null;
	// optional ref from parent to read/set editor content on demand
	editorRef?: React.RefObject<EditorHandle | null>;
	onOpenPublish: () => void;
};

export default function PipelinePanel({
	handleEngineStart,
	engineStatus,
	engineError,
	editorRef,
	onOpenPublish,
}: PipelinePanelProps) {
	const [advanced, setAdvanced] = useState<boolean>(true);

	// ref to access editor value on-demand (use parent ref if provided)
	const internalEditorRef = useRef<EditorHandle | null>(null);
	// ensure the union type is consistent
	const refToUse: React.RefObject<EditorHandle | null> =
		editorRef ?? internalEditorRef;

	async function handleProcessClick() {
		// evitar dobles ejecuciones mientras el engine está procesando
		if (engineStatus === "processing") return;

		// read editor content on-demand via ref
		const pipelineText = refToUse.current?.getValue() ?? "";
		try {
			console.log("Trying to process using: ", pipelineText);
			JSON.parse(pipelineText); // validate
			handleEngineStart(pipelineText);
		} catch (e) {
			console.error("Invalid pipeline JSON", e);
			// optionally surface error to user
		}
	}

	function setLog() {
		if (engineStatus == "error" && engineError) {
			return "Log: " + engineError;
		} else {
			return "";
		}
	}

	return (
		<section className="panel">
			<div className="panel-header">
				<div className="panel-title-block">
					<h2>Pipeline</h2>

					<div className="status-pill">
						<span className={`status-dot ${engineStatus}`} />
						<span>{engineStatus}</span>
					</div>
				</div>

				<div className="panel-toolbar">
					<div
						style={{
							display: "flex",
							gap: 8,
							alignItems: "center",
						}}
					>
						<ToggleSwitch
							checked={advanced}
							onChange={setAdvanced}
							label={advanced ? "Advanced" : "User friendly"}
							title={
								"Toggle between advanced JSON editor and user friendly mode"
							}
						/>
					</div>
					<>
						<button
							className="btn btn-secondary"
							title="Help"
							aria-label="Help"
						>
							?
						</button>
					</>
				</div>
			</div>

			<div className="panel-body pipeline-panel-content">
				<div className="status-row"></div>

				<div
					className="pipeline-box"
					style={
						{ "--image-max-height": "240px" } as React.CSSProperties
					}
				>
					{advanced ? (
						// cast to React.Ref<EditorHandle> (not `any`) for forwardRef compatibility
						<PipelineEditor
							ref={refToUse as React.Ref<EditorHandle>}
						/>
					) : (
						<div className="friendly-editor-placeholder">
							<p
								style={{
									margin: 0,
									color: "var(--text-muted)",
								}}
							>
								User friendly editor (WIP). Use "Apply" to
								persist changes.
							</p>
						</div>
					)}
				</div>

				<div className="pipeline-footer">
					<span className="pipeline-meta">{setLog()}</span>

					<div
						style={{
							display: "flex",
							gap: 8,
							alignItems: "center",
						}}
					>
						<button
							className="btn btn-secondary"
							onClick={onOpenPublish}
						>
							Publish
						</button>
						<button
							className="btn btn-white"
							onClick={handleProcessClick}
							disabled={engineStatus === "processing"}
							aria-disabled={engineStatus === "processing"}
							style={{
								opacity:
									engineStatus === "processing" ? 0.5 : 1,
								cursor:
									engineStatus === "processing"
										? "not-allowed"
										: "pointer",
							}}
						>
							Process
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}
