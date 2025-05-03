import dotenv from "dotenv";
import Fastify from "fastify";
import pool, { initializeDatabase } from "./db";

dotenv.config();

const server = Fastify({
  logger: true,
});

server.get("/health", async (_request, reply) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT NOW()");
      reply.code(200).send({ status: "ok", db_time: result.rows[0].now });
    } finally {
      client.release();
    }
  } catch (err) {
    server.log.error("Health check failed:", err);
    reply
      .code(503)
      .send({ status: "error", error: "Database connection failed" });
  }
});

const start = async () => {
  try {
    await initializeDatabase();
    server.log.info("Database initialization complete.");

    const port = parseInt(process.env.DB_PORT || "3000", 10);
    await server.listen({
      port: port,
      host: process.env.DB_HOST || "0.0.0.0",
    });
  } catch (err) {
    server.log.error("Error starting server:", err);
    process.exit(1);
  }
};

start();
