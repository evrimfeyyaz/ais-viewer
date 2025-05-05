/**
 * The query string for the vessels endpoint.
 *
 * This is used to filter the vessels by a bounding box.
 */
export type VesselQueryString = {
  /** The minimum longitude of the bounding box. */
  "min-lon": number;
  /** The minimum latitude of the bounding box. */
  "min-lat": number;
  /** The maximum longitude of the bounding box. */
  "max-lon": number;
  /** The maximum latitude of the bounding box. */
  "max-lat": number;
};
