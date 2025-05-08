import {
  Camera,
  Images,
  MapView,
  RegionPayload,
  ShapeSource,
  SymbolLayer,
} from "@maplibre/maplibre-react-native";
import type GeoJSON from "geojson";
import { ComponentProps, useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { VesselGeoJSONData } from "./types";
import { useMap } from "./useMap";
import VesselPopup from "./VesselPopup";

/** The type of the onPress handler for the ShapeSource component. */
type ShapeSourceOnPressHandler = NonNullable<ComponentProps<typeof ShapeSource>["onPress"]>;
/** The type of the onPress handler for the MapView component. */
type MapViewOnPressHandler = NonNullable<ComponentProps<typeof MapView>["onPress"]>;

/** The ID of the ship icon image to use in the map. */
const SHIP_ICON_ID = "ship-icon";
/** The ID of the selected ship icon image to use in the map. */
const SELECTED_SHIP_ICON_ID = "selected-ship-icon";

export default function Map() {
  const shipIcon = require("../../assets/ship-icon.png");
  const selectedShipIcon = require("../../assets/ship-icon-selected.png");

  const { mapViewRef, cameraRef, geoJsonData, minZoomLevel, updateVessels } = useMap();

  const [showZoomMessage, setShowZoomMessage] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<VesselGeoJSONData | null>(null);

  /**
   * Handles the region change event of the map.
   * This is called when the map has finished moving/zooming.
   */
  const handleRegionDidChange = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point, RegionPayload>) => {
      const zoomLevel = feature.properties?.zoomLevel;
      if (zoomLevel < minZoomLevel) {
        setShowZoomMessage(true);
      } else {
        setShowZoomMessage(false);
      }
      updateVessels();
    },
    [updateVessels, minZoomLevel],
  );

  const handleVesselPress: ShapeSourceOnPressHandler = useCallback((event) => {
    if (!event.features || event.features.length === 0) {
      setSelectedVessel(null);
      return;
    }

    const topMostFeature = event.features[0] as GeoJSON.Feature;
    if (topMostFeature.geometry?.type === "Point" && topMostFeature.properties) {
      setSelectedVessel(topMostFeature as VesselGeoJSONData);
    } else {
      setSelectedVessel(null);
    }
  }, []);

  const handleMapBasePress: MapViewOnPressHandler = useCallback(
    async (feature) => {
      if (!mapViewRef.current || !feature.properties) {
        return;
      }

      const { screenPointX, screenPointY } = feature.properties;

      try {
        const featuresInLayer = await mapViewRef.current.queryRenderedFeaturesAtPoint(
          [screenPointX, screenPointY],
          undefined, // No filter expression
          ["vessels-layer"], // Only query the vessels layer
        );

        // If no features from our 'vessels-layer' are at the tapped point,
        // it means the tap was on the base map or another non-vessel element.
        if (featuresInLayer.features.length === 0) {
          setSelectedVessel(null);
        }
        // If features ARE found, it means a vessel was tapped.
        // handleVesselPress (on ShapeSource) would have set it, so we do nothing here.
      } catch (error) {
        console.error("Error querying rendered features at point for map press:", error);
      }
    },
    [mapViewRef],
  );

  const closePopup = () => {
    setSelectedVessel(null);
  };

  return (
    <>
      <MapView
        style={styles.map}
        ref={mapViewRef}
        onRegionDidChange={handleRegionDidChange}
        onPress={handleMapBasePress}
      >
        <Camera ref={cameraRef} zoomLevel={1} centerCoordinate={[0, 0]} />
        <Images images={{ [SHIP_ICON_ID]: shipIcon, [SELECTED_SHIP_ICON_ID]: selectedShipIcon }} />
        <ShapeSource id="vessels-source" shape={geoJsonData} onPress={handleVesselPress}>
          <SymbolLayer
            id="vessels-layer"
            style={{
              iconImage: [
                "case",
                ["==", ["get", "mmsi"], selectedVessel ? selectedVessel.properties.mmsi : -1],
                SELECTED_SHIP_ICON_ID,
                SHIP_ICON_ID,
              ],
              iconSize: ["interpolate", ["linear"], ["zoom"], minZoomLevel, 0.1, 20, 0.5],
              iconRotate: ["get", "course"],
              iconAllowOverlap: true,
              iconIgnorePlacement: true,
              iconRotationAlignment: "map",
            }}
          />
        </ShapeSource>
      </MapView>
      {showZoomMessage && (
        <View style={styles.zoomMessageContainer}>
          <Text style={styles.zoomMessage}>Zoom in to see vessels</Text>
        </View>
      )}
      <VesselPopup selectedVessel={selectedVessel} onClosePress={closePopup} />
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  zoomMessage: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    fontSize: 16,
    color: "white",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  zoomMessageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    alignItems: "center",
    justifyContent: "center",
  },
});
