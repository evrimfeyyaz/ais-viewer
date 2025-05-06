import { Pool } from "pg";

const pool = new Pool();

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(-1);
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS vessels (
    mmsi INT PRIMARY KEY,                 -- Maritime Mobile Service Identity (unique identifier)
    last_seen TIMESTAMPTZ NOT NULL,       -- Timestamp of the last received position report (timezone aware)
    geom GEOGRAPHY(POINT, 4326) NOT NULL, -- Vessel position using GEOGRAPHY type for accurate global calculations (WGS84 SRID 4326)
    course REAL NOT NULL,                 -- Course over ground in degrees
    name TEXT NOT NULL                    -- Vessel name
);

CREATE INDEX IF NOT EXISTS vessels_last_seen_idx ON vessels (last_seen);

CREATE INDEX IF NOT EXISTS vessels_geom_idx ON vessels USING GIST (geom);
`;

export const initializeDatabase = async () => {
  console.log("Attempting to initialize database...");
  let client;
  try {
    client = await pool.connect();
    console.log("Database connection established. Ensuring table exists...");

    await client.query(createTableQuery);
    console.log("'vessels' table checked/created successfully.");
  } catch (err) {
    console.error("Error initializing database:", err);
    throw err;
  } finally {
    if (client) {
      client.release();
      console.log("Database client released.");
    }
  }
};

export default pool;
