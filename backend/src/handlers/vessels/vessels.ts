import { FastifyInstance, FastifyPluginAsync, RouteShorthandOptions } from "fastify";
import pool from "../../db.js";
import { VesselQueryString } from "./types.js";

/**
 * The interval to consider vessel data as fresh.
 *
 * This is used to filter out vessels that have not been seen recently.
 */
const VESSEL_DATA_FRESHNESS_INTERVAL = "2 minutes";

const vesselQueryStringSchema = {
  type: "object",
  required: ["min-lon", "min-lat", "max-lon", "max-lat"],
  properties: {
    "min-lon": { type: "number", minimum: -180, maximum: 180 },
    "min-lat": { type: "number", minimum: -90, maximum: 90 },
    "max-lon": { type: "number", minimum: -180, maximum: 180 },
    "max-lat": { type: "number", minimum: -90, maximum: 90 },
  },
};

const vesselRouteOptions: RouteShorthandOptions = {
  schema: {
    querystring: vesselQueryStringSchema,
  },
};

export const vesselRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get<{ Querystring: VesselQueryString }>(
    "/api/vessels",
    vesselRouteOptions,
    async (request, reply) => {
      const {
        "min-lon": minLon,
        "min-lat": minLat,
        "max-lon": maxLon,
        "max-lat": maxLat,
      } = request.query;

      const sqlQuery = `
            SELECT
                mmsi,
                course,
                ST_Y(geom::geometry) as latitude,
                ST_X(geom::geometry) as longitude
            FROM vessels
            WHERE
                last_seen >= NOW() - $5::interval
                AND geom && ST_MakeEnvelope($1, $2, $3, $4, 4326);
        `;
      const params = [minLon, minLat, maxLon, maxLat, VESSEL_DATA_FRESHNESS_INTERVAL];

      try {
        fastify.log.info(`Querying vessels for bbox: [${minLon}, ${minLat}, ${maxLon}, ${maxLat}]`);
        const result = await pool.query(sqlQuery, params);

        const vessels = result.rows.map((row) => ({
          mmsi: row.mmsi,
          lat: parseFloat(row.latitude),
          lon: parseFloat(row.longitude),
          course: row.course === null ? null : parseFloat(row.course),
        }));

        fastify.log.info(
          `Found ${vessels.length} vessels for bbox: [${minLon}, ${minLat}, ${maxLon}, ${maxLat}]`,
        );
        reply.code(200).send(vessels);
      } catch (err) {
        fastify.log.error("Error querying vessels:", err);
        reply.code(500).send({ status: "error", error: "Internal Server Error" });
      }
    },
  );
};
