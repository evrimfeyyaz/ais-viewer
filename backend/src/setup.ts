import cors from "@fastify/cors";
import Fastify, { FastifyInstance } from "fastify";
import { routes } from "./routes.js";

/**
 * Set up the Fastify application instance.
 *
 * This function configures the Fastify application instance with the necessary plugins and routes.
 *
 * @returns {FastifyInstance} The configured Fastify application instance.
 */
export function setup(): FastifyInstance {
  const app: FastifyInstance = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: "http://localhost:*",
    methods: ["GET", "OPTIONS"],
  });

  app.register(routes);

  return app;
}
