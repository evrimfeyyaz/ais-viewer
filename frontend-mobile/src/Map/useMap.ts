import { CameraRef, MapViewRef } from "@maplibre/maplibre-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { VesselData, VesselGeoJSONData } from "./types";
import { getExpandedBounds, transformToGeoJSON } from "./utils";

/**
 * The factor by which the map bounds are expanded for when we're fetching vessels.
 * This is to fetch vessels that are near the edges of the visible section of the map thus improving the panning experience.
 * */
const BOUNDS_EXPANSION_FACTOR = 1;

/** The interval at which the vessels are updated in milliseconds. */
const UPDATE_INTERVAL_MS = 10000; // 10 seconds

/** The base URL of the API. */
const API_BASE_URL = "http://localhost:3000";

type UseMapReturn = {
  /** The ref object for the MapView component. */
  mapViewRef: React.RefObject<MapViewRef | null>;
  /** The ref object for the Camera component. */
  cameraRef: React.RefObject<CameraRef | null>;
  /** The GeoJSON data for the vessels. */
  geoJsonData: VesselGeoJSONData;
  /** The minimum zoom level at which vessels are displayed. */
  minZoomLevel: number;
  /** Fetches the vessels data from the API and updates the GeoJSON data. */
  updateVessels: () => Promise<void>;
};

/** The initial, empty GeoJSON data for the vessels state. */
const initialGeoJsonData: VesselGeoJSONData = {
  type: "FeatureCollection",
  features: [],
};

export function useMap(): UseMapReturn {
  const mapViewRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);

  const minZoomLevel = 10;

  const [geoJsonData, setGeoJsonData] = useState<VesselGeoJSONData>(initialGeoJsonData);

  const updateVessels = useCallback(async () => {
    if (!mapViewRef.current) {
      return;
    }

    const zoom = await mapViewRef.current.getZoom();

    if (zoom < minZoomLevel) {
      setGeoJsonData(initialGeoJsonData); // Clear data if zoomed out too far
      return;
    }

    const visibleBounds = await mapViewRef.current.getVisibleBounds();
    const {
      minLon: expandedMinLon,
      minLat: expandedMinLat,
      maxLon: expandedMaxLon,
      maxLat: expandedMaxLat,
    } = getExpandedBounds(visibleBounds, BOUNDS_EXPANSION_FACTOR);

    const apiUrl = `${API_BASE_URL}/api/vessels?min-lon=${expandedMinLon}&min-lat=${expandedMinLat}&max-lon=${expandedMaxLon}&max-lat=${expandedMaxLat}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      const vesselsData: VesselData[] = await response.json();
      const newGeoJsonData = transformToGeoJSON(vesselsData);
      setGeoJsonData(newGeoJsonData);
    } catch (error) {
      console.error("Error fetching or updating vessel data:", error);
      setGeoJsonData(initialGeoJsonData); // Clear data on error
    }
  }, []);

  useEffect(
    function setUpRegularVesselUpdates() {
      const intervalId = setInterval(updateVessels, UPDATE_INTERVAL_MS);

      return () => {
        clearInterval(intervalId);
      };
    },
    [updateVessels],
  );

  return {
    mapViewRef,
    cameraRef,
    geoJsonData,
    minZoomLevel,
    updateVessels,
  };
}
