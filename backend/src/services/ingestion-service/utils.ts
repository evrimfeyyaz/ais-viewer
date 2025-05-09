/**
 * Validates the latitude and longitude values.
 * Logs a warning if coordinates are invalid.
 */
export function isValidPosition(mmsi: number, latitude: number, longitude: number): boolean {
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    console.warn(
      `[Ingestion] Invalid coordinates for MMSI ${mmsi}: Lat ${latitude}, Lon ${longitude}. Skipping.`,
    );
    return false;
  }
  return true;
}

/**
 * Formats a timestamp string (assumed to be UTC with a " UTC" suffix)
 * to a full ISO 8601 string with 'Z' for UTC.
 * @param timestamp The raw timestamp string (e.g., "2023-10-27 10:30:00 UTC")
 * @returns ISO formatted string (e.g., "2023-10-27T10:30:00.000Z")
 */
export function formatTimestampToISO(timestamp: string): string {
  // Replace " UTC" with "Z" to conform to ISO 8601 UTC representation
  // and ensure correct parsing by the Date constructor.
  return new Date(timestamp.replace(" UTC", "Z")).toISOString();
}
