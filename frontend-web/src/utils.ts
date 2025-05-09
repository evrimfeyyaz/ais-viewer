import type { RequestTransformFunction } from "maplibre-gl";
import { isMapboxURL, transformMapboxUrl } from "maplibregl-mapbox-request-transformer";
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

/**
 * Transforms requests to be able to handle Mapbox URLs.
 * @param url - The URL to transform.
 * @param resourceType - The type of resource.
 * @returns The transformed URL.
 */
export const transformRequest: RequestTransformFunction = (url, resourceType) => {
  if (resourceType && isMapboxURL(url)) {
    return transformMapboxUrl(url, resourceType, import.meta.env.VITE_MAPBOX_ACCESS_TOKEN);
  }

  return { url };
};
