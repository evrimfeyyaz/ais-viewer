import dotenv from "dotenv";
import { initializeDatabase } from "./db";
import { startIngestionService } from "./services/ingestion-service";
import { startMaintenanceSchedule } from "./services/maintenance-service";
import { setup } from "./setup";

dotenv.config();

async function start() {
  const app = setup();

  try {
    await initializeDatabase();
    app.log.info("Database initialization complete.");

    startIngestionService();
    app.log.info("AIS Ingestion Service initiated.");

    startMaintenanceSchedule();

    const port = parseInt(process.env.PORT || "3000", 10);
    const host = "0.0.0.0";
    await app.listen({ port: port, host: host });
  } catch (err) {
    const logger = app ? app.log : console;
    logger.error("Error during server startup:", err);
    process.exit(1);
  }
}

start();
