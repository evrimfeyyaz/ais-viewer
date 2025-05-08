import type { VesselData, VesselsGeoJSONData, VisibleBounds } from "./types";

/**
 * Transforms the raw vessel data array from the API into a GeoJSON FeatureCollection.
 * @param vessels - Array of vessel data objects.
 * @returns GeoJSON FeatureCollection.
 */
export function transformToGeoJSON(vessels: VesselData[]): VesselsGeoJSONData {
  const features = vessels.map((vessel) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [vessel.lon, vessel.lat],
    },
    properties: {
      mmsi: vessel.mmsi,
      course: vessel.course,
      name: vessel.name,
    },
  }));

  return {
    type: "FeatureCollection" as const,
    features: features,
  };
}

type ExpandedBounds = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

/**
 * Expands the visible bounds of the map by a given factor.
 * @param visibleBounds - The visible bounds of the map.
 * @param expansionFactor - The factor by which the bounds are expanded.
 * @returns The expanded bounds of the map.
 */
export function getExpandedBounds(
  visibleBounds: VisibleBounds,
  expansionFactor: number,
): ExpandedBounds {
  const [southWest, northEast] = visibleBounds;
  const minLon = southWest[0];
  const minLat = southWest[1];
  const maxLon = northEast[0];
  const maxLat = northEast[1];

  const widthDegrees = maxLon - minLon;
  const heightDegrees = maxLat - minLat;

  const lonExpansion = (widthDegrees * expansionFactor) / 2;
  const latExpansion = (heightDegrees * expansionFactor) / 2;

  let expandedMinLon = minLon - lonExpansion;
  let expandedMaxLon = maxLon + lonExpansion;
  let expandedMinLat = minLat - latExpansion;
  let expandedMaxLat = maxLat + latExpansion;

  // Clamp latitudes to valid range [-90, 90]
  expandedMinLat = Math.max(-90, expandedMinLat);
  expandedMaxLat = Math.min(90, expandedMaxLat);

  return {
    minLon: expandedMinLon,
    minLat: expandedMinLat,
    maxLon: expandedMaxLon,
    maxLat: expandedMaxLat,
  };
}
