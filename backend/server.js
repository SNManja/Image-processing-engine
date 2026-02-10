import "dotenv/config";
import fastify from "fastify";
import { pool } from "./db/pool.js";

const app = fastify({ logger: true });
console.log("PORT env =", process.env.PORT, "HOST =", process.env.HOST_URL);

app.get("/health", async () => {
  return true;
});

app.get("/db-health", async () => {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
});

app.listen(
  { port: process.env.PORT, host: process.env.HOST_URL },
  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  },
);
