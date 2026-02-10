export default async function healthRoutes(app) {
  app.get("/health", async () => {
    return true;
  });

  app.get("/db-health", async () => {
    try {
      await app.db.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  });
}
