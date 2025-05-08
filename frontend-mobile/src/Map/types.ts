import { Feature, FeatureCollection, Point } from "geojson";

export type VesselData = {
  /** Maritime Mobile Service Identity */
  mmsi: number;
  /** Name of the vessel */
  name: string;
  /** Latitude of the vessel */
  lat: number;
  /** Longitude of the vessel */
  lon: number;
  /** Course of the vessel in degrees, e.g. 0 is north, 90 is east, 180 is south, 270 is west */
  course: number;
};

/**
 * The GeoJSON data for the vessels.
 */
export type VesselsGeoJSONData = FeatureCollection<
  Point,
  { mmsi: number; course: number; name: string }
>;

/**
 * The GeoJSON data for a single vessel.
 */
export type VesselGeoJSONData = Feature<Point, { mmsi: number; course: number; name: string }>;

/**
 * The visible bounds of the map.
 * @param northEast - The north-east corner of the visible bounds.
 * @param southWest - The south-west corner of the visible bounds.
 */
export type VisibleBounds = [northEast: GeoJSON.Position, southWest: GeoJSON.Position];
