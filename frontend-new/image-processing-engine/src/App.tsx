import { useEffect, useRef, useState } from "react";
import { fetchMe, logout } from "./api/auth";
import { checkBackendHealth, checkDatabaseHealth } from "./api/health";
import "./App.css";
import ImagePanel from "./components/Images/ImagePanel";
import { ModalsHost } from "./components/Modals/ModalsHost";
import type { ActiveModal } from "./components/Modals/types";
import { UsernameOnboarding } from "./components/Onboarding/UsernameOnboarding";
import type { EditorHandle } from "./components/Pipeline/PipelineEditor";
import PipelinePanel from "./components/Pipeline/PipelinePanel";
import { Header } from "./components/ui/header";
import { useEngineController } from "./hooks/useEngineController";
import type { AuthStatus, User } from "./types";
import type { EngineModule } from "./wasm";

function App({ engine }: { engine: EngineModule }) {
	const {
		images,
		engineStatus,
		engineError,
		handleUploadFiles,
		handleEngineStart,
		downloadOutputFolder,
		deleteAllImages,
	} = useEngineController(engine);

	const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
	const [activeModal, setActiveModal] = useState<ActiveModal>(null);
	const editorRef = useRef<EditorHandle | null>(null);

	const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
	const [user, setUser] = useState<User | null>(null);
	const needsUsernameOnboarding =
		authStatus === "authenticated" && !user?.username;

	function handleUsernameSaved(username: string) {
		setUser((prev) => {
			if (!prev) return prev;
			return { ...prev, username };
		});
	}

	async function handleLogout() {
		try {
			await logout();
			setUser(null);
			setAuthStatus("unauthenticated");
		} catch (error) {
			console.error("Logout failed", error);
		}
	}

	useEffect(() => {
		fetchMe()
			.then((me) => {
				setUser(me.user);
				setAuthStatus("authenticated");
				console.log("fetched user:", me.user);
			})
			.catch(() => {
				setUser(null);
				console.log("User not found, login failed");
				setAuthStatus("unauthenticated");
			});
	}, []);

	const handlePresetApply = (presetJson: string) => {
		editorRef.current?.setValue(presetJson);
	};

	useEffect(() => {
		(async () => {
			console.log(
				"Checking backend health: ",
				await checkBackendHealth(),
				"Checking database health: ",
				await checkDatabaseHealth(),
			);
		})();
	}, []);
	return (
		<div className="app-shell">
			<Header
				authStatus={authStatus}
				user={user}
				onLogout={handleLogout}
				onOpenPresets={() => setActiveModal({ type: "presets" })}
			/>
			<main className="workspace">
				<ImagePanel
					images={images}
					selectedImageId={selectedImageId}
					onSelectImage={setSelectedImageId}
					engineStatus={engineStatus}
					downloadOutputFolder={downloadOutputFolder}
					onOpenClearModal={() =>
						setActiveModal({ type: "clear-images" })
					}
					onUploadFiles={handleUploadFiles}
				/>

				<PipelinePanel
					handleEngineStart={handleEngineStart}
					engineStatus={engineStatus}
					engineError={engineError}
					editorRef={editorRef}
					onOpenPublish={() => setActiveModal({ type: "publish" })}
				/>
			</main>

			<ModalsHost
				activeModal={activeModal}
				onClose={() => setActiveModal(null)}
				onConfirmClearImages={() => {
					deleteAllImages();
					setActiveModal(null);
				}}
				onPresetApply={handlePresetApply}
				editorRef={editorRef}
			/>
			<UsernameOnboarding
				open={needsUsernameOnboarding}
				onUsernameSaved={handleUsernameSaved}
			/>
		</div>
	);
}

export default App;
