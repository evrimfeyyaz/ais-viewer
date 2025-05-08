import { Camera, Images, MapView, ShapeSource, SymbolLayer } from "@maplibre/maplibre-react-native";
import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { useMap } from "./useMap";

/** The ID of the ship icon image to use in the map. */
const SHIP_ICON_ID = "ship-icon";

export default function Map() {
  const shipIcon = require("../../assets/ship-icon.png");

  const { mapViewRef, cameraRef, geoJsonData, minZoomLevel, updateVessels } = useMap();

  /**
   * Handles the region change event of the map.
   * This is called when the map has finished moving/zooming.
   */
  const handleRegionDidChange = useCallback(() => {
    updateVessels();
  }, [updateVessels]);

  return (
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
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
