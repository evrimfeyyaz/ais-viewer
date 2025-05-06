import pool from "../../db.js";
import { PositionReportMessage } from "./types.js";

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
  course: number,
  name: string,
  timestamp: string,
) {
  const upsertQuery = `
        INSERT INTO vessels (mmsi, timestamp, geom, course, name)
        VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6)
        ON CONFLICT (mmsi) DO UPDATE
        SET timestamp = EXCLUDED.timestamp,
            geom = EXCLUDED.geom,
            course = EXCLUDED.course,
            name = EXCLUDED.name;
    `;

  try {
    await pool.query(upsertQuery, [mmsi, timestamp, longitude, latitude, course, name]);
  } catch (err) {
    console.error(`[Ingestion] Error upserting data for MMSI ${mmsi}:`, err);
  }
}

export async function processPositionReportMessage(message: PositionReportMessage) {
  const {
    UserID: mmsi,
    Latitude: latitude,
    Longitude: longitude,
    Cog: course,
  } = message.Message.PositionReport;
  const { ShipName: name, time_utc: timestamp } = message.MetaData;

  if (!isValidPosition(mmsi, latitude, longitude)) {
    return;
  }

  const formattedTimestamp = new Date(timestamp.replace(" UTC", "Z")).toISOString();

  await upsertVesselPosition(mmsi, longitude, latitude, course, name, formattedTimestamp);
}
