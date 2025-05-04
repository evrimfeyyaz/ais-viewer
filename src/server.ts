import dotenv from "dotenv";
import Fastify from "fastify";
import pool, { initializeDatabase } from "./db";
import { startIngestionService } from "./ingestion-service";

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

    startIngestionService();
    server.log.info("AIS Ingestion Service initiated.");

    const port = parseInt(process.env.PORT || "3000", 10);
    await server.listen({ port: port, host: "0.0.0.0" });
  } catch (err) {
    server.log.error("Error during server startup:", err);
    process.exit(1);
  }
};

start();
