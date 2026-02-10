import { defaultDown, defaultUp } from "../defaultMigration.js";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = (knex) => defaultUp(knex, "user");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = (knex) => defaultDown(knex, "user");
