import { FastifyBaseLogger } from "fastify";
import pool from "../db.js";

/**
 * The MaintenanceService class is responsible for cleaning up old vessel records from the database.
 */
export class MaintenanceService {
  private readonly logger: FastifyBaseLogger;
  private readonly MAX_AGE_INTERVAL = "1 hour"; // The maximum age of a vessel record before it is deleted
  private readonly CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // How often to run the cleanup (15 minutes)

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger.child({ service: "MaintenanceService" });
    this.start();
  }

  /**
   * Deletes vessel records that haven't been seen in the specified interval.
   */
  private async deleteOldVessels() {
    this.logger.info(
      `[Maintenance] Running cleanup: Deleting vessels older than ${this.MAX_AGE_INTERVAL}...`,
    );

    const deleteQuery = `
        DELETE FROM vessels
        WHERE timestamp < NOW() - INTERVAL '${this.MAX_AGE_INTERVAL}';
    `;

    try {
      const result = await pool.query(deleteQuery);
      this.logger.info(
        `[Maintenance] Cleanup complete. Deleted ${result.rowCount} old vessel records.`,
      );
    } catch (err) {
      this.logger.error({ err }, "[Maintenance] Error deleting old vessels");
    }
  }

  /**
   * Starts the periodic maintenance schedule for database cleanup.
   */
  public async start() {
    this.logger.info("[Maintenance] Initializing maintenance schedule...");

    try {
      await this.deleteOldVessels();
    } catch (err) {
      this.logger.error({ err }, "[Maintenance] Error during initial cleanup");
    }

    setInterval(() => {
      this.deleteOldVessels();
    }, this.CLEANUP_INTERVAL_MS);

    this.logger.info(
      `[Maintenance] Scheduled vessel cleanup every ${this.CLEANUP_INTERVAL_MS / 60000} minutes.`,
    );
  }
}
