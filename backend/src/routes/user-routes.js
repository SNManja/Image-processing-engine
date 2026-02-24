import { me, updateUsername } from "../controllers/user-controller.js";

export default async function userRoutes(app) {
	app.get("/api/me", me);
	app.patch("/api/me/updateUsername", updateUsername);
}
