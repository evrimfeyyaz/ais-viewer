import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { healthRoutes } from "./handlers/health.js";
import { vesselRoutes } from "./handlers/vessels/vessels.js";

export const routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.register(healthRoutes);
  fastify.register(vesselRoutes);
};
