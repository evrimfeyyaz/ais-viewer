/**
 * Normalizes a longitude value to the [-180, 180] range.
 *
 * @param lon - The longitude value to normalize.
 * @returns The normalized longitude value.
 */
export function normalizeLongitude(lon: number): number {
  while (lon <= -180) lon += 360;
  while (lon > 180) lon -= 360;
  return lon;
}
