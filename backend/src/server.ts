import dotenv from "dotenv";
import { initializeDatabase } from "./db.js";
import { IngestionService } from "./services/ingestion-service/IngestionService.js";
import { MaintenanceService } from "./services/MaintenanceService.js";
import { setup } from "./setup.js";

dotenv.config();

async function start() {
  const app = setup();

  try {
    await initializeDatabase();
    app.log.info("Database initialization complete.");

    const ingestionService = new IngestionService(app.log);
    ingestionService.start();
    app.log.info("AIS Ingestion Service initiated.");

    const maintenanceService = new MaintenanceService(app.log);
    maintenanceService.start();
    app.log.info("Maintenance Service initiated.");

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
