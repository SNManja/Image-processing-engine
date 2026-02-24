export default async function healthRoutes(app) {
	app.get("/api/health", async () => {
		return true;
	});

	app.get("/api/db-health", async () => {
		try {
			await app.db.raw("SELECT 1");
			return true;
		} catch (error) {
			console.error("Database health check failed:", error);
			return false;
		}
	});
}
