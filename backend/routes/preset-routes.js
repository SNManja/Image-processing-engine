export default async function presetRoutes(app) {
  app.get("/preset-list", async (request, reply) => {
    const query = {
      sort: request.query.sort || "created_at",
      order: request.query.order || "ASC",
      q: (request.query.q ?? "").trim() || "",
      limit: parseInt(request.query.limit, 10) || 20,
    };

    if (query.limit > 50 || query.limit < 1) {
      return reply.status(400).send({ error: `Invalid limit: ${query.limit}` });
    }
    if (query.sort !== "name" && query.sort !== "created_at") {
      return reply.status(400).send({ error: `Invalid sort: ${query.sort}` });
    }
    query.order = query.order.toUpperCase();
    if (query.order !== "ASC" && query.order !== "DESC") {
      return reply.status(400).send({ error: `Invalid order: ${query.order}` });
    }

    const result = await app.db.query(
      `SELECT * FROM presets WHERE name ILIKE $1 ORDER BY ${query.sort} ${query.order}, id ${query.order} LIMIT $2`,
      [`%${query.q}%`, query.limit],
    );
    return reply.send(result.rows);
  });
}
