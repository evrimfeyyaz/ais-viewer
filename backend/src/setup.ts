import Fastify, { FastifyInstance } from "fastify";
import { routes } from "./routes";

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

  app.register(routes);

  return app;
}
