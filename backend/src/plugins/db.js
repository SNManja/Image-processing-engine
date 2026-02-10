import fp from "fastify-plugin";
import knex from "knex";
import knexConfig from "../../knexfile.js";

export default fp(async (app) => {
  const db = knex(knexConfig.development);
  app.log.info("Conexión a la base de datos establecida.");

  try {
    await db.migrate.latest();
    app.log.info("Base de datos migrada y lista.");

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
