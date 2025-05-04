import pool from "../../db";
import { PositionReport } from "./types";

/**
 * Validates the latitude and longitude values.
 * Logs a warning if coordinates are invalid.
 */
function isValidPosition(mmsi: number, latitude: number, longitude: number): boolean {
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    console.warn(
      `[Ingestion] Invalid coordinates for MMSI ${mmsi}: Lat ${latitude}, Lon ${longitude}. Skipping.`,
    );
    return false;
  }
  return true;
}

/**
 * Upserts the vessel position data into the database.
 */
async function upsertVesselPosition(
  mmsi: number,
  longitude: number,
  latitude: number,
  course: number | undefined,
) {
  const validCourse = typeof course === "number" ? course : null;

  const upsertQuery = `
        INSERT INTO vessels (mmsi, last_seen, geom, course)
        VALUES ($1, NOW(), ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4)
        ON CONFLICT (mmsi) DO UPDATE
        SET last_seen = EXCLUDED.last_seen,
            geom = EXCLUDED.geom,
            course = EXCLUDED.course;
    `;

  try {
    await pool.query(upsertQuery, [mmsi, longitude, latitude, validCourse]);
  } catch (err) {
    console.error(`[Ingestion] Error upserting data for MMSI ${mmsi}:`, err);
  }
}

export async function processPositionReport(report: PositionReport) {
  const { UserID: mmsi, Latitude: latitude, Longitude: longitude, Cog: course } = report;

  if (!isValidPosition(mmsi, latitude, longitude)) {
    return;
  }

  await upsertVesselPosition(mmsi, longitude, latitude, course);
}
