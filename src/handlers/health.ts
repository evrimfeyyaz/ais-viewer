import { FastifyInstance, FastifyPluginAsync } from "fastify";
import pool from "../db";

/**
 * The health check endpoint.
 *
 * This is used to check if the database is running.
 */
export const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/health", async (_request, reply) => {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query("SELECT NOW()");
        reply.code(200).send({ status: "ok", db_time: result.rows[0].now });
      } finally {
        client.release();
      }
    } catch (err) {
      fastify.log.error("Health check failed:", err);
      reply.code(503).send({ status: "error", error: "Database connection failed" });
    }
  });
};
