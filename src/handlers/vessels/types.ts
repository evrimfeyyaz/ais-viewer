/**
 * The query string for the vessels endpoint.
 *
 * This is used to filter the vessels by a bounding box.
 */
export type VesselQueryString = {
  /** The minimum longitude of the bounding box. */
  minLon: number;
  /** The minimum latitude of the bounding box. */
  minLat: number;
  /** The maximum longitude of the bounding box. */
  maxLon: number;
  /** The maximum latitude of the bounding box. */
  maxLat: number;
};
