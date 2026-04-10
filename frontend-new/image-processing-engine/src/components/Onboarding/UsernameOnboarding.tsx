import { useEffect, useState } from "react";
import { updateUsername } from "../../api/auth";
import "./UsernameOnboarding.css";

type UsernameOnboardingProps = {
	open: boolean;
	onUsernameSaved: (username: string) => void;
};

export function UsernameOnboarding({
	open,
	onUsernameSaved,
}: UsernameOnboardingProps) {
	const [username, setUsername] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (!open) {
			setUsername("");
			setError(null);
			setIsSaving(false);
		}
	}, [open]);

	if (!open) return null;

	function validateUsername(rawValue: string): string | null {
		const value = rawValue.trim().toLowerCase();

		if (!value) {
			return "Username is required.";
		}

		if (value.length < 3 || value.length > 30) {
			return "Username must be 3–30 characters.";
		}

		if (!/^[a-z0-9_]+$/.test(value)) {
			return "Only letters, numbers, and underscores (_) are allowed.";
		}

		return null;
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const normalized = username.trim().toLowerCase();
		const validationError = validateUsername(normalized);

		if (validationError) {
			setError(validationError);
			return;
		}

		setIsSaving(true);
		setError(null);

		try {
			//const response =
			await updateUsername(normalized);

			// Si tu backend devuelve algo útil, podrías usarlo.
			// Por ahora alcanza con asumir éxito si no tiró error.
			onUsernameSaved(normalized);
		} catch (err: unknown) {
			console.error("Failed to update username", err);

			// Si después querés, acá podés parsear mejor el error del backend.
			setError("Could not save username. It may already be taken.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="username-onboarding-backdrop" role="presentation">
			<div
				className="username-onboarding-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="username-onboarding-title"
				aria-describedby="username-onboarding-desc"
			>
				<div className="username-onboarding-modal__header">
					<h3
						id="username-onboarding-title"
						className="username-onboarding-modal__title"
					>
						Set your username
					</h3>
				</div>

				<form
					className="username-onboarding-modal__form"
					onSubmit={handleSubmit}
				>
					<div
						id="username-onboarding-desc"
						className="username-onboarding-modal__requirements"
					>
						<div className="username-onboarding-modal__requirements-title">
							Username requirements
						</div>

						<ul className="username-onboarding-modal__requirements-list">
							<li>Between 3 and 30 characters</li>
							<li>Only letters, numbers, and underscores</li>
							<li>Must be unique</li>
							<li>Case-insensitive, saved in lowercase</li>
							<li>Can only be set once</li>
						</ul>
					</div>

					<div className="username-onboarding-modal__field">
						<label
							htmlFor="username-onboarding-input"
							className="username-onboarding-modal__label"
						>
							Username
						</label>

						<input
							id="username-onboarding-input"
							type="text"
							autoComplete="username"
							minLength={3}
							maxLength={30}
							placeholder="Enter a username here..."
							className="username-onboarding-modal__input"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							disabled={isSaving}
							required
							autoFocus
						/>

						{error && (
							<p className="username-onboarding-modal__error">
								{error}
							</p>
						)}
					</div>

					<div className="username-onboarding-modal__actions">
						<button
							type="submit"
							className="username-onboarding-modal__submit"
							disabled={isSaving}
						>
							{isSaving ? "Saving..." : "Save"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
