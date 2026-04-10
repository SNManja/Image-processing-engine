import { startGoogleLogin } from "../../api/auth";
import "../../App.css"; // This is wrooong, really baddddddddd need to make a css for the header
import type { AuthStatus, User } from "../../types";
type HeaderProps = {
	authStatus: AuthStatus;
	user: User | null;
	onLogout: () => void;
	onOpenPresets: () => void;
};

export function Header({
	authStatus,
	user,
	onLogout,
	onOpenPresets,
}: HeaderProps) {
	function handleAuthClick() {
		if (authStatus === "authenticated") {
			onLogout();
			return;
		}

		if (authStatus === "unauthenticated") {
			startGoogleLogin();
		}
	}

	const displayName = user?.username || user?.email || "User";

	return (
		<header className="app-header">
			<h1 className="app-title">Batchpix</h1>

			<div className="header-actions">
				{authStatus === "authenticated" && (
					<span className="header-user">
						Logged as: {displayName}
					</span>
				)}

				<button
					className="btn btn-secondary"
					onClick={handleAuthClick}
					disabled={authStatus === "loading"}
				>
					{authStatus === "loading"
						? "Loading..."
						: authStatus === "authenticated"
							? "Logout"
							: "Login"}
				</button>

				<button className="btn btn-secondary" onClick={onOpenPresets}>
					Presets
				</button>
			</div>
		</header>
	);
}
