import "./ClearModal.css";

export function ClearModal({
	open,
	onClose,
	onConfirm,
}: {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
}) {
	if (!open) return null;

	return (
		<div
			className="clean-modal__overlay"
			role="dialog"
			aria-modal="true"
			aria-label="Confirm delete all images"
		>
			<div className="clean-modal">
				<h3 className="clean-modal__title">Delete all images?</h3>
				<p className="clean-modal__body">
					This action will remove all loaded images. Do you want to
					continue?
				</p>

				<div className="clean-modal__actions">
					<button className="btn" onClick={onClose}>
						Cancel
					</button>
					<button
						className="btn btn-danger"
						onClick={() => {
							onConfirm();
						}}
					>
						Yes, delete all
					</button>
				</div>
			</div>
		</div>
	);
}

export default ClearModal;
