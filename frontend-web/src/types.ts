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
 * A click event on a Map layer.
 */
export type MapLayerClickEvent = maplibregl.MapMouseEvent & {
  features?: maplibregl.MapGeoJSONFeature[];
};
