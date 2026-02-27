import fp from "fastify-plugin";
import knex from "knex";
import knexConfig from "../../knexfile.js";

function mustEnv() {
	const v = process.env.NODE_ENV;
	if (!v) throw new Error(`Missing required env var: ${name}`);
	return v;
}

export default fp(async (app) => {
	const env = mustEnv();
	const db = knex(knexConfig[env] ?? knexConfig.development);
	app.log.info("Conexión a la base de datos establecida.");

	try {
		if (process.env.RUN_MIGRATIONS === "true") {
			await withMigrationLock(db, () => db.migrate.latest());
			app.log.info("Base de datos migrada y lista.");
		} else {
			app.log.info("RUN_MIGRATIONS=false, saltando migraciones.");
		}

		app.decorate("db", db);

		if (process.env.NODE_ENV === "development") {
			await db.seed.run();
			app.log.info("Seeds ejecutados.");
		}

		app.addHook("onClose", async () => {
			await db.destroy();
			app.log.info("Pool de conexiones de base de datos cerrado.");
		});
	} catch (err) {
		console.error(err);
		app.log.error("Error inicializando la base de datos:", err);
		process.exit(1);
	}
});

async function withMigrationLock(db, fn) {
	const LOCK_ID = 4242424242; // elegí uno fijo
	await db.raw("SELECT pg_advisory_lock(?);", [LOCK_ID]);
	try {
		return await fn();
	} finally {
		await db.raw("SELECT pg_advisory_unlock(?);", [LOCK_ID]);
	}
}
