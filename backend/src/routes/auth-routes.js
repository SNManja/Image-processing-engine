import {
	authCallback,
	authStart,
	logout,
} from "../controllers/auth-controller.js";

export default async function authRoutes(app) {
	app.get("/api/auth/:provider/start", authStart);
	app.get("/api/auth/:provider/callback", authCallback);
	app.post("/api/auth/logout", logout);
}
