import { useEffect } from "react";
import type { EditorHandle } from "../Pipeline/PipelineEditor";
import { ClearModal } from "./ClearModal";
import { PresetModal } from "./PresetsModal/PresetModal";
import { PublishModal } from "./PublishModal/PublishModal";
import type { ActiveModal } from "./types";

type ModalsHostProps = {
	activeModal: ActiveModal;
	onClose: () => void;
	onConfirmClearImages: () => void;
	onPresetApply: (presetJson: string) => void;
	editorRef: React.RefObject<EditorHandle | null>;
};

export function ModalsHost({
	activeModal,
	onClose,
	onConfirmClearImages,
	onPresetApply,
	editorRef,
}: ModalsHostProps) {
	const isOpen = activeModal !== null;

	useEffect(() => {
		if (!isOpen) return;

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isOpen, onClose]);

	if (!activeModal) return null;

	switch (activeModal.type) {
		case "clear-images":
			return (
				<ClearModal
					open={true}
					onClose={onClose}
					onConfirm={onConfirmClearImages}
				/>
			);

		case "presets":
			return (
				<PresetModal
					open={true}
					onClose={onClose}
					onApply={onPresetApply}
				/>
			);
		case "publish":
			return (
				<PublishModal
					open={true}
					onClose={onClose}
					editorRef={editorRef}
					onPublishSuccess={() => {}} //TODO onPublishSuccess
				/>
			);

		default:
			return null;
	}
}
