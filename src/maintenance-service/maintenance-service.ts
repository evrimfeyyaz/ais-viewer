import pool from "../db";

const MAX_AGE_INTERVAL = "1 hour"; // How old records must be to be deleted
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // How often to run the cleanup (15 minutes)

/**
 * Deletes vessel records that haven't been seen in the specified interval.
 */
async function deleteOldVessels() {
  console.log(`[Maintenance] Running cleanup: Deleting vessels older than ${MAX_AGE_INTERVAL}...`);

  const deleteQuery = `
        DELETE FROM vessels
        WHERE last_seen < NOW() - INTERVAL '${MAX_AGE_INTERVAL}';
    `;

  try {
    const result = await pool.query(deleteQuery);
    console.log(`[Maintenance] Cleanup complete. Deleted ${result.rowCount} old vessel records.`);
  } catch (err) {
    console.error("[Maintenance] Error deleting old vessels:", err);
  }
}

/**
 * Starts the periodic maintenance schedule for database cleanup.
 */
export async function startMaintenanceSchedule() {
  console.log("[Maintenance] Initializing maintenance schedule...");

  try {
    await deleteOldVessels();
  } catch (err) {
    console.error("[Maintenance] Error during initial cleanup:", err);
  }

  setInterval(() => {
    deleteOldVessels();
  }, CLEANUP_INTERVAL_MS);

  console.log(
    `[Maintenance] Scheduled vessel cleanup every ${CLEANUP_INTERVAL_MS / 60000} minutes.`,
  );
}
