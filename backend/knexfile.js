// knexfile.js
import "dotenv/config";

const baseConfig = {
	client: "pg",
	migrations: {
		directory: "./src/db/migrations",
	},
	seeds: {
		directory: "./src/db/seeds",
	},
};

export default {
	development: {
		...baseConfig,
		connection: process.env.DATABASE_URL,
	},

	production: {
		...baseConfig,
		connection: {
			connectionString: process.env.DATABASE_URL,
			ssl:
				process.env.DB_SSL === "true"
					? { rejectUnauthorized: false }
					: false,
		},
		pool: { min: 0, max: 5 },
		acquireConnectionTimeout: 10000,
	},
};
