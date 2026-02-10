import "dotenv/config";
import fastify from "fastify";
import dbPlugin from "./plugins/db.js";
import healthRoutes from "./routes/health-routes.js";
import presetRoutes from "./routes/preset-routes.js";

const app = fastify({ logger: true });
console.log(
  "PORT env =",
  process.env.BACKEND_PORT,
  "HOST =",
  process.env.HOST_URL,
);

app.register(dbPlugin);
app.register(healthRoutes);
app.register(presetRoutes);

app.listen(
  { port: process.env.BACKEND_PORT, host: process.env.HOST_URL },
  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  },
);
