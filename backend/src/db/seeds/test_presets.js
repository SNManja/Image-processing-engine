import { randomUUID } from "crypto";

/**
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  // Orden importa por FK
  await knex("presets").del();
  await knex("users").del();

  // ---- USERS ----
  const users = [
    {
      id: randomUUID(),
      email: "demo1@test.com",
      username: "demo1",
      created_at: new Date(),
    },
    {
      id: randomUUID(),
      email: "demo2@test.com",
      username: "demo2",
      created_at: new Date(),
    },
  ];

  await knex("users").insert(users);

  // ---- PRESETS RAW ----
  const rawPresets = [
    {
      name: "Obra Dinn-ish",
      pipeline: [
        { filter: "bnw" },
        { filter: "linearAdjustment", params: { scale: 1.6, offset: -0.12 } },
        { filter: "blur", params: { stride: 1, size: 1 } },
        {
          filter: "bayerDithering",
          params: { depth: 2, levels: 10, perceptual: true },
        },
        { filter: "linearAdjustment", params: { offset: 0.02, scale: 1.04 } },
      ],
      description:
        "As any other dithering preset, config stride and size in odd numbers to adjust to image size.",
    },

    {
      name: "Cool green-ish look",
      pipeline: [
        { filter: "bnw", params: { offset: 0, scale: 1 } },
        { filter: "alphaBlending", params: { alpha: [0.5, 0.5, 1] } },
      ],
      description: "Green artistic grayscale blend.",
    },
  ];

  // ---- PRESETS ----
  const presetsToInsert = rawPresets.map((p, i) => ({
    id: randomUUID(),
    creator_id: users[i % users.length].id, // distribuye presets entre users
    name: p.name,
    description: p.description,
    pipeline: JSON.stringify(p.pipeline),
    votes: Math.floor(Math.random() * 100),
    created_at: new Date(),
  }));

  await knex("presets").insert(presetsToInsert);
}
