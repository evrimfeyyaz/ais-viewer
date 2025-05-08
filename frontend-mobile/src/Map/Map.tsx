import {
  Camera,
  Images,
  MapView,
  RegionPayload,
  ShapeSource,
  SymbolLayer,
} from "@maplibre/maplibre-react-native";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useMap } from "./useMap";

/** The ID of the ship icon image to use in the map. */
const SHIP_ICON_ID = "ship-icon";

export default function Map() {
  const shipIcon = require("../../assets/ship-icon.png");

  const { mapViewRef, cameraRef, geoJsonData, minZoomLevel, updateVessels } = useMap();

  const [showZoomMessage, setShowZoomMessage] = useState(false);

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

  return (
    <>
      <MapView style={styles.map} ref={mapViewRef} onRegionDidChange={handleRegionDidChange}>
        <Camera ref={cameraRef} zoomLevel={1} centerCoordinate={[0, 0]} />
        <Images images={{ [SHIP_ICON_ID]: shipIcon }} />
        <ShapeSource id="vessels-source" shape={geoJsonData}>
          <SymbolLayer
            id="vessels-layer"
            style={{
              iconImage: SHIP_ICON_ID,
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
