import type { VesselData } from "./types";

/**
 * Transforms the raw vessel data array from the API into a GeoJSON FeatureCollection.
 * @param vessels - Array of vessel data objects.
 * @returns GeoJSON FeatureCollection.
 */
export function transformToGeoJSON(
  vessels: VesselData[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = vessels.map((vessel) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [vessel.lon, vessel.lat],
    },
    properties: {
      mmsi: vessel.mmsi,
      course: vessel.course,
      name: vessel.name,
    },
  }));

  return {
    type: "FeatureCollection",
    features: features,
  };
}
