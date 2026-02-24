let elUser, loginBtn, logoutBtn, publishPresetBtn;

function setGuestUI() {
	elUser.textContent = "Guest";
	loginBtn.classList.remove("hidden");
	logoutBtn.classList.add("hidden");
	publishPresetBtn.classList.add("hidden");
}

function setAuthedUI(user) {
	const display = user?.username || "undefined";
	if (!user?.username) displayUsernameChanger(user);
	elUser.textContent = display;
	loginBtn.classList.add("hidden");
	logoutBtn.classList.remove("hidden");
	publishPresetBtn.classList.remove("hidden");
}

async function loadSession() {
	try {
		const res = await fetch("/api/me", {
			method: "GET",
			credentials: "include",
			headers: { Accept: "application/json" },
		});
		console.log("Load session returned ", res);

		if (res.status === 401) {
			setGuestUI();
			return;
		}

		if (!res.ok) {
			// En MVP: tratá errores como guest para no trabarte
			setGuestUI();
			return;
		}

		const data = await res.json().catch(() => ({}));
		if (!data?.user) {
			setGuestUI();
			return;
		}

		setAuthedUI(data.user);
	} catch {
		setGuestUI();
	}
}

export async function loginSetup() {
	elUser = document.getElementById("current-user");
	loginBtn = document.getElementById("login-button");
	logoutBtn = document.getElementById("logout-button");
	publishPresetBtn = document.getElementById("publish-preset-button");

	loginBtn.addEventListener("click", () => {
		window.location.href = `/api/auth/google/start`;
	});

	logoutBtn.addEventListener("click", async () => {
		try {
			await fetch("/api/auth/logout", {
				method: "POST",
				credentials: "include",
			});
		} finally {
			await loadSession();
			// ! Habria que aclarar si el logout falla . Queda pendiente
		}
	});
	await loadSession();
}
function displayUsernameChanger(user) {
	const usernameField = document.getElementById("set-username-input");
	const usernameErrorDisplay = document.getElementById("set-username-error");
	const usernameForm = document.getElementById("set-username-form");
	const modal = document.getElementById("set-username-modal");
	const submitBtn = document.getElementById("set-username-button");

	// show modal
	modal.classList.remove("hidden");
	modal.setAttribute("aria-hidden", "false");

	// reset UI
	usernameErrorDisplay.classList.add("hidden");
	usernameErrorDisplay.textContent = "";
	usernameField.value = "";
	setTimeout(() => usernameField.focus(), 0);

	// avoid double-binding if you might call this more than once
	if (usernameForm.dataset.bound === "1") return;
	usernameForm.dataset.bound = "1";

	usernameForm.addEventListener("submit", async (e) => {
		e.preventDefault();

		// clear previous error
		usernameErrorDisplay.classList.add("hidden");
		usernameErrorDisplay.textContent = "";

		const newUsername = usernameField.value.trim();

		// basic client-side validation (matches your backend rules)
		if (!newUsername) {
			usernameErrorDisplay.textContent = "Username is required.";
			usernameErrorDisplay.classList.remove("hidden");
			return;
		}
		if (newUsername.length < 3 || newUsername.length > 30) {
			usernameErrorDisplay.textContent =
				"Username must be 3–30 characters.";
			usernameErrorDisplay.classList.remove("hidden");
			return;
		}
		if (!/^[a-z0-9_]+$/i.test(newUsername)) {
			usernameErrorDisplay.textContent =
				"Only letters, numbers, and underscores (_) are allowed.";
			usernameErrorDisplay.classList.remove("hidden");
			return;
		}

		submitBtn.disabled = true;

		try {
			const res = await fetch(`/api/me/updateUsername`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: newUsername }),
			});

			if (res.ok) {
				modal.classList.add("hidden");
				modal.setAttribute("aria-hidden", "true");
				await loadSession();
				return;
			}

			// try to read backend error
			const data = await res.json().catch(() => ({}));
			const err = (data?.error || "").toString();

			if (res.status === 409) {
				// backend uses: "Username already taken" OR "USERNAME_TAKEN" OR "USERNAME_ALREADY_SET"
				if (
					err.toLowerCase().includes("taken") ||
					err === "USERNAME_TAKEN"
				) {
					usernameErrorDisplay.textContent =
						"That username is already taken.";
				} else if (
					err.toLowerCase().includes("already_set") ||
					err.includes("already set")
				) {
					usernameErrorDisplay.textContent =
						"Username is already set for this account.";
				} else {
					usernameErrorDisplay.textContent =
						"Conflict. Please choose another username.";
				}
				usernameErrorDisplay.classList.remove("hidden");
				return;
			}

			if (res.status === 400) {
				// Invalid length/format, bad request
				usernameErrorDisplay.textContent =
					"Invalid username. Use 3–30 chars: letters, numbers, underscore.";
				usernameErrorDisplay.classList.remove("hidden");
				return;
			}

			usernameErrorDisplay.textContent =
				"Server error. Please try again.";
			usernameErrorDisplay.classList.remove("hidden");
		} catch (error) {
			usernameErrorDisplay.textContent =
				"Network error. Please try again.";
			usernameErrorDisplay.classList.remove("hidden");
		} finally {
			submitBtn.disabled = false;
		}
	});
}
