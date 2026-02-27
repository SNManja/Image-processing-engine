import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import staticPlugin from "@fastify/static";
import "dotenv/config";
import fastify from "fastify";
import path from "path";
import dbPlugin from "./plugins/db.js";
import authRoutes from "./routes/auth-routes.js";
import healthRoutes from "./routes/health-routes.js";
import presetRoutes from "./routes/preset-routes.js";
import userRoutes from "./routes/user-routes.js";

const app = fastify({
	logger: true,
	bodyLimit: 100 * 1024, // 100 KB
	requestTimeout: 10_000, // 10s,
});
app.register(rateLimit, {
	max: 100,
	timeWindow: "1 minute",
	ban: 1,
});

app.addHook("onSend", async (req, reply, payload) => {
	reply.header("Cross-Origin-Opener-Policy", "same-origin");
	reply.header("Cross-Origin-Embedder-Policy", "require-corp");
	return payload;
});

app.register(cookie);

const frontendDist = path.resolve(process.env.FRONT_DIST);
app.register(staticPlugin, {
	root: frontendDist,
	prefix: "/",
});

app.register(dbPlugin);
app.register(healthRoutes);
app.register(presetRoutes);
app.register(authRoutes);
app.register(userRoutes);

console.log(
	"PORT env =",
	Number(process.env.PORT) || 5500,
	"HOST =",
	process.env.HOST_URL ?? "0.0.0.0",
);
app.listen(
	{
		port: Number(process.env.PORT) || 5500,
		host: process.env.HOST_URL ?? "0.0.0.0",
	},
	(err, address) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log(`Server listening at ${address}`);
	},
);
