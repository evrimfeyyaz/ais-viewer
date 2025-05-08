import { StyleSheet, Text, View } from "react-native";
import { VesselGeoJSONData } from "./types";

type Props = {
  selectedVessel: VesselGeoJSONData | null;
  onClosePress: () => void;
};

export default function VesselPopup({ selectedVessel, onClosePress }: Props) {
  if (!selectedVessel) {
    return null;
  }

  return (
    <View style={styles.popupContainer}>
      <View style={styles.popup}>
        <Text style={styles.popupTitle}>
          {selectedVessel.properties.name?.trim() || "Unnamed Vessel"}
        </Text>
        <Text style={styles.popupText}>MMSI: {selectedVessel.properties.mmsi}</Text>
        <Text style={styles.closeButton} onPress={onClosePress}>
          Close
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  popupContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  popup: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 200,
    alignItems: "center",
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  popupText: {
    fontSize: 14,
    marginBottom: 10,
  },
  closeButton: {
    fontSize: 14,
    color: "blue",
    marginTop: 5,
  },
});
