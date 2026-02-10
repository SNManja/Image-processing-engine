import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const defaultUp = async (knex, filename) => {
  const sqlPath = path.join(__dirname, ".", "sql", `${filename}.sql`);
  const sql = await fs.readFile(sqlPath, "utf8");
  return knex.raw(sql);
};

export const defaultDown = async (knex, tablename) => {
  return knex.raw(`DROP TABLE IF EXISTS ${tablename};`);
};
