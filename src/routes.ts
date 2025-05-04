import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { healthRoutes } from "./handlers/health";
import { vesselRoutes } from "./handlers/vessels";

export const routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.register(healthRoutes);
  fastify.register(vesselRoutes);
};
